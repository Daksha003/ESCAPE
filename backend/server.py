from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import json

import google.generativeai as genai


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class StatusCheckCreate(BaseModel):
    client_name: str


class InterviewQuestionRequest(BaseModel):
    conversation_history: List[dict]
    question_number: int
    interests: Optional[dict] = None


class InterviewQuestionResponse(BaseModel):
    question: str
    question_type: str
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class InterviewAnalysisRequest(BaseModel):
    answers: List[str]
    questions: List[dict]


class InterviewAnalysisResponse(BaseModel):
    overallAssessment: str
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    communicationSkills: List[str]
    technicalDepth: List[str]
    aiInsights: str
    nextSteps: List[str]


@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

gemini_api_key = os.environ.get('GEMINI_API_KEY')
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')
else:
    gemini_model = None
    print("Warning: GEMINI_API_KEY not found in environment variables")


@api_router.post("/generate-interview-question", response_model=InterviewQuestionResponse)
async def generate_interview_question(request: InterviewQuestionRequest):
    try:
        if not gemini_model:
            return await generate_fallback_question(request.question_number)

        conversation_text = ""
        for item in request.conversation_history:
            conversation_text += f"Q: {item['question']}\nA: {item['answer']}\n\n"

        is_personal = request.question_number % 3 == 1
        question_type = "personal" if is_personal else "technical"

        prompt = f"Generate a {question_type} interview question for software engineering candidates. Return only the question text."

        response = gemini_model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=150,
            )
        )

        question_text = response.text.strip()
        if question_text.startswith('"') and question_text.endswith('"'):
            question_text = question_text[1:-1]

        return InterviewQuestionResponse(
            question=question_text,
            question_type=question_type
        )

    except Exception as e:
        logger.error(f"Error generating AI question: {str(e)}")
        return await generate_fallback_question(request.question_number, request.interests)


async def generate_fallback_question(question_number: int, interests: Optional[dict] = None) -> InterviewQuestionResponse:
    fallback_questions = [
        {"question": "Tell me about yourself and your background in computer science.", "type": "personal"},
        {"question": "What programming languages are you proficient in?", "type": "technical"},
        {"question": "Explain the difference between object-oriented and functional programming.", "type": "technical"},
        {"question": "Describe a challenging project you worked on and how you overcame difficulties.", "type": "personal"},
        {"question": "What is your approach to debugging code?", "type": "technical"},
        {"question": "How do you stay updated with technology trends?", "type": "personal"},
        {"question": "Explain the concept of time complexity and space complexity.", "type": "technical"}
    ]

    index = (question_number - 1) % len(fallback_questions)
    question = fallback_questions[index]

    return InterviewQuestionResponse(
        question=question["question"],
        question_type=question["type"]
    )


FALLBACK_QUESTION_KEY_POINTS = {
    "Tell me about yourself": ["education", "degree", "computer science", "experience", "skills", "projects"],
    "programming languages": ["language", "python", "java", "javascript", "programming", "proficient"],
    "object-oriented": ["object-oriented", "oop", "class", "inheritance", "functional"],
    "challenging project": ["challenge", "project", "problem", "solution", "team"],
    "debugging": ["debug", "log", "breakpoint", "error", "test"],
    "technology trends": ["learn", "course", "blog", "documentation", "practice"],
    "time complexity": ["time complexity", "big o", "algorithm", "performance"]
}


def evaluate_with_key_points(answer: str, question: str) -> tuple:
    answer_lower = answer.lower()
    question_lower = question.lower()
    
    key_points = None
    for key, points in FALLBACK_QUESTION_KEY_POINTS.items():
        if key in question_lower:
            key_points = points
            break
    
    if not key_points:
        key_points = ["relevant", "experience", "understanding"]
    
    matched_points = sum(1 for point in key_points if point.lower() in answer_lower)
    
    if matched_points >= 2 or len(answer) > 50:
        feedback = f"Answer covers {matched_points} key points"
        return 1, feedback
    elif len(answer) > 20:
        feedback = "Answer provided but lacks key technical points"
        return 0, feedback
    else:
        feedback = "Answer too brief or incomplete"
        return 0, feedback


def clean_json_response(text: str) -> str:
    # Simple cleanup - strip whitespace and newlines
    result = text.strip()
    # Remove any leading/trailing characters that aren't part of JSON
    result = result.lstrip('\n\r').rstrip('\n\r')
    return result


@api_router.post("/analyze-interview", response_model=InterviewAnalysisResponse)
async def analyze_interview(request: InterviewAnalysisRequest):
    try:
        if not gemini_model:
            return await generate_fallback_analysis(request.answers, request.questions)

        answer_evaluations = []
        total_points = 0
        
        for i, (answer, question) in enumerate(zip(request.answers, request.questions)):
            if not answer or not answer.strip():
                answer_evaluations.append({
                    "question": question.get('question', ''),
                    "answer": "",
                    "points": 0,
                    "feedback": "No answer provided"
                })
                continue
                
            question_text = question.get('question', '')
            
            eval_prompt = f"""Evaluate this interview answer. Question: {question_text}. Answer: {answer}. 
Return ONLY JSON: {{"points": 1, "feedback": "brief feedback"}} if satisfactory, or {{"points": 0, "feedback": "reason"}} if not."""

            try:
                eval_response = gemini_model.generate_content(
                    eval_prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.3,
                        max_output_tokens=200,
                    )
                )
                
                eval_text = clean_json_response(eval_response.text)
                eval_data = json.loads(eval_text)
                
                points = eval_data.get("points", 0)
                feedback = eval_data.get("feedback", "")
                
            except Exception as e:
                logger.error(f"Error evaluating answer {i+1}: {str(e)}")
                points, feedback = evaluate_with_key_points(answer, question_text)
            
            total_points += points
            answer_evaluations.append({
                "question": question_text,
                "answer": answer,
                "points": points,
                "feedback": feedback
            })

        score_percentage = (total_points / 7) * 100 if len(request.answers) > 0 else 0
        passed = total_points >= 4

        strengths = []
        weaknesses = []
        answered_satisfactorily = sum(1 for e in answer_evaluations if e["points"] == 1)
        
        if answered_satisfactorily >= 5:
            strengths.append("Excellent understanding across most topics")
        if answered_satisfactorily >= 4:
            strengths.append("Good communication and technical knowledge")
            
        if answered_satisfactorily < 3:
            weaknesses.append("Need more depth in technical responses")
        if score_percentage < 60:
            weaknesses.append("Several answers were not satisfactory")

        if score_percentage >= 80:
            overall_assessment = "Outstanding interview performance!"
        elif score_percentage >= 60:
            overall_assessment = "Good interview performance. You passed!"
        elif score_percentage >= 40:
            overall_assessment = "Average interview performance."
        else:
            overall_assessment = "Interview performance needs improvement."

        return InterviewAnalysisResponse(
            overallAssessment=overall_assessment,
            strengths=strengths,
            weaknesses=weaknesses,
            recommendations=["Practice answering technical questions", "Use specific examples"],
            communicationSkills=["Clarity" if answered_satisfactorily >= 4 else "Work on communication"],
            technicalDepth=[f"Knowledge in {answered_satisfactorily}/7 answers"],
            aiInsights=f"Score: {score_percentage:.0f}% ({total_points}/7) - {'PASSED' if passed else 'NEEDS IMPROVEMENT'}",
            nextSteps=["Review technical concepts", "Practice mock interviews"]
        )

    except Exception as e:
        logger.error(f"Error generating AI interview analysis: {str(e)}")
        return await generate_fallback_analysis(request.answers, request.questions)


async def generate_fallback_analysis(answers: List[str], questions: List[dict]) -> InterviewAnalysisResponse:
    try:
        total_points = 0
        answer_evaluations = []
        
        for answer, question in zip(answers, questions):
            if not answer or not answer.strip():
                answer_evaluations.append((0, "No answer provided"))
                continue
            
            points, feedback = evaluate_with_key_points(answer, question.get('question', ''))
            total_points += points
            answer_evaluations.append((points, feedback))
        
        score_percentage = (total_points / 7) * 100 if len(answers) > 0 else 0
        passed = total_points >= 4
        answered_satisfactorily = sum(1 for p, _ in answer_evaluations if p == 1)
        
        strengths = []
        weaknesses = []
        
        if answered_satisfactorily >= 5:
            strengths.append("Excellent understanding")
        if answered_satisfactorily >= 4:
            strengths.append("Good communication")
            
        if answered_satisfactorily < 3:
            weaknesses.append("Need more depth")
        if score_percentage < 60:
            weaknesses.append("Several answers not satisfactory")
        
        if score_percentage >= 80:
            overall_assessment = "Outstanding interview performance!"
        elif score_percentage >= 60:
            overall_assessment = "Good interview performance. You passed!"
        elif score_percentage >= 40:
            overall_assessment = "Average interview performance."
        else:
            overall_assessment = "Interview performance needs improvement."

        return InterviewAnalysisResponse(
            overallAssessment=overall_assessment,
            strengths=strengths,
            weaknesses=weaknesses,
            recommendations=["Practice more", "Use specific examples"],
            communicationSkills=["Clarity" if answered_satisfactorily >= 4 else "Work on communication"],
            technicalDepth=[f"Knowledge in {answered_satisfactorily}/7 answers"],
            aiInsights=f"Score: {score_percentage:.0f}% ({total_points}/7) - {'PASSED' if passed else 'NEEDS IMPROVEMENT'}",
            nextSteps=["Review concepts", "Practice interviews"]
        )

    except Exception as e:
        logger.error(f"Error generating fallback analysis: {str(e)}")
        return InterviewAnalysisResponse(
            overallAssessment="Unable to analyze interview performance.",
            strengths=[],
            weaknesses=[],
            recommendations=["Please try again"],
            communicationSkills=[],
            technicalDepth=[],
            aiInsights="Analysis unavailable",
            nextSteps=["Retry the interview analysis"]
        )


app.include_router(api_router)

cors_origins = os.environ.get('CORS_ORIGINS', '*')
if cors_origins == '*':
    origins = ['*']
else:
    origins = [origin.strip() for origin in cors_origins.split(',')]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == '__main__':
    import uvicorn
    import os
    port = int(os.environ.get('PORT', 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
