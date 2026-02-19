from fastapi import FastAPI, APIRouter, HTTPException
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

import google.generativeai as genai


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class InterviewQuestionRequest(BaseModel):
    conversation_history: List[dict]  # List of {question: str, answer: str}
    question_number: int  # Current question number (1-6)
    interests: Optional[dict] = None  # User interests for domain-specific questions

class InterviewQuestionResponse(BaseModel):
    question: str
    question_type: str  # "personal" or "technical"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class InterviewAnalysisRequest(BaseModel):
    answers: List[str]  # List of interview answers
    questions: List[dict]  # List of {question: str, type: str}

class InterviewAnalysisResponse(BaseModel):
    overallAssessment: str
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    communicationSkills: List[str]
    technicalDepth: List[str]
    aiInsights: str
    nextSteps: List[str]

# Add your routes to the router instead of directly to app
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Gemini client
gemini_api_key = os.environ.get('GEMINI_API_KEY')
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')
else:
    gemini_model = None
    print("Warning: GEMINI_API_KEY not found in environment variables")

@api_router.post("/generate-interview-question", response_model=InterviewQuestionResponse)
async def generate_interview_question(request: InterviewQuestionRequest):
    """
    Generate the next interview question using Google's Gemini API based on conversation history.
    Falls back to static questions if AI is unavailable.
    """
    try:
        if not gemini_model:
            logger.warning("Gemini model not available, using fallback")
            return await generate_fallback_question(request.question_number)

        # Build conversation context
        conversation_text = ""
        for item in request.conversation_history:
            conversation_text += f"Q: {item['question']}\nA: {item['answer']}\n\n"

        # Determine question type distribution (mix of personal and technical)
        is_personal = request.question_number % 3 == 1  # Every 3rd question is personal
        question_type = "personal" if is_personal else "technical"

        # Create prompt for Gemini
        prompt = f"""Generate a {question_type} interview question for software engineering candidates.

Guidelines:
- Professional and workplace-appropriate
- Technical: programming, algorithms, system design
- Personal: career goals, learning experiences
- Build on conversation history when possible
- Clear and specific

History:
{conversation_text}

Return only the question text."""

        # Call Gemini API
        response = gemini_model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=150,
            )
        )

        # Check for safety filter blocks
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'finish_reason') and candidate.finish_reason == 2:  # SAFETY
                logger.warning("Gemini safety filter blocked question generation, using fallback")
                return await generate_fallback_question(request.question_number, request.interests)

        question_text = response.text.strip()

        # Clean up the question (remove quotes if present)
        if question_text.startswith('"') and question_text.endswith('"'):
            question_text = question_text[1:-1]
        if question_text.startswith("'") and question_text.endswith("'"):
            question_text = question_text[1:-1]

        return InterviewQuestionResponse(
            question=question_text,
            question_type=question_type
        )

    except Exception as e:
        logger.error(f"Error generating AI question: {str(e)}")
        return await generate_fallback_question(request.question_number, request.interests)

async def generate_fallback_question(question_number: int, interests: Optional[dict] = None) -> InterviewQuestionResponse:
    """
    Generate a fallback question when AI is unavailable.
    Uses domain-wise questions based on user interests if provided, otherwise static questions.
    """
    try:
        # If interests are provided, generate domain-wise questions
        if interests:
            domain_questions = []

            # Frontend questions (6)
            if interests.get('frontend', 0) > 0:
                domain_questions.extend([
                    {"question": "How would you optimize a slow-loading web page?", "type": "technical"},
                    {"question": "Explain the difference between React state and props.", "type": "technical"},
                    {"question": "What are the differences between inline, internal, and external CSS?", "type": "technical"},
                    {"question": "How do you handle browser compatibility issues?", "type": "technical"},
                    {"question": "What is the Virtual DOM, and how does it improve performance in React?", "type": "technical"},
                    {"question": "Explain the difference between client-side and server-side rendering.", "type": "technical"},
                ])

            # Backend questions (6)
            if interests.get('backend', 0) > 0:
                domain_questions.extend([
                    {"question": "How do you handle database connections in a high-traffic application?", "type": "technical"},
                    {"question": "Explain RESTful API design principles.", "type": "technical"},
                    {"question": "What are the differences between SQL and NoSQL databases?", "type": "technical"},
                    {"question": "How do you implement authentication and authorization in a backend system?", "type": "technical"},
                    {"question": "Explain caching strategies to improve backend performance.", "type": "technical"},
                    {"question": "How do you handle error logging and monitoring in backend services?", "type": "technical"},
                ])

            # Data Science questions (6)
            if interests.get('dataScience', 0) > 0:
                domain_questions.extend([
                    {"question": "Explain the difference between supervised and unsupervised learning.", "type": "technical"},
                    {"question": "How do you handle missing data in a dataset?", "type": "technical"},
                    {"question": "What is feature engineering, and why is it important?", "type": "technical"},
                    {"question": "Explain the difference between classification and regression problems.", "type": "technical"},
                    {"question": "How do you evaluate the performance of a machine learning model?", "type": "technical"},
                    {"question": "Explain the bias-variance tradeoff.", "type": "technical"},
                ])

            # Machine Learning questions (6)
            if interests.get('machineLearning', 0) > 0:
                domain_questions.extend([
                    {"question": "What are the differences between overfitting and underfitting?", "type": "technical"},
                    {"question": "Explain the concept of gradient descent.", "type": "technical"},
                    {"question": "What is regularization, and why is it used?", "type": "technical"},
                    {"question": "Explain the difference between batch and stochastic gradient descent.", "type": "technical"},
                    {"question": "How do you handle imbalanced datasets in classification problems?", "type": "technical"},
                    {"question": "What are ensemble learning methods, and why are they useful?", "type": "technical"},
                ])

            # DevOps questions (6)
            if interests.get('devops', 0) > 0:
                domain_questions.extend([
                    {"question": "How do you implement CI/CD pipelines?", "type": "technical"},
                    {"question": "Explain container orchestration and its benefits.", "type": "technical"},
                    {"question": "What are the differences between continuous integration, continuous delivery, and continuous deployment?", "type": "technical"},
                    {"question": "How do you monitor and maintain application performance in production?", "type": "technical"},
                    {"question": "Explain the role of infrastructure as code (IaC) in DevOps.", "type": "technical"},
                    {"question": "How do you manage version control in a collaborative environment?", "type": "technical"},
                ])

            # Mobile questions (6)
            if interests.get('mobile', 0) > 0:
                domain_questions.extend([
                    {"question": "What are the key considerations for mobile app performance?", "type": "technical"},
                    {"question": "How do you handle different screen sizes and orientations in mobile apps?", "type": "technical"},
                    {"question": "Explain the difference between native, hybrid, and cross-platform apps.", "type": "technical"},
                    {"question": "How do you optimize battery usage in mobile apps?", "type": "technical"},
                    {"question": "What are best practices for offline support in mobile applications?", "type": "technical"},
                    {"question": "How do you handle app security and data privacy?", "type": "technical"},
                ])

            # Cybersecurity questions (6)
            if interests.get('cybersecurity', 0) > 0:
                domain_questions.extend([
                    {"question": "What are common web application security vulnerabilities?", "type": "technical"},
                    {"question": "How do you implement secure authentication?", "type": "technical"},
                    {"question": "Explain the differences between symmetric and asymmetric encryption.", "type": "technical"},
                    {"question": "How do you prevent SQL injection and XSS attacks?", "type": "technical"},
                    {"question": "What is multi-factor authentication, and why is it important?", "type": "technical"},
                    {"question": "How do you conduct security audits and vulnerability assessments?", "type": "technical"},
                ])

            # Blockchain questions (6)
            if interests.get('blockchain', 0) > 0:
                domain_questions.extend([
                    {"question": "Explain the difference between public and private blockchains.", "type": "technical"},
                    {"question": "What are smart contracts and how do they work?", "type": "technical"},
                    {"question": "How do consensus mechanisms like PoW and PoS work?", "type": "technical"},
                    {"question": "What are the advantages and limitations of blockchain technology?", "type": "technical"},
                    {"question": "Explain the concept of decentralization and its importance.", "type": "technical"},
                    {"question": "How do you ensure the security and immutability of blockchain transactions?", "type": "technical"},
                ])

            # Cloud questions (6)
            if interests.get('cloud', 0) > 0:
                domain_questions.extend([
                    {"question": "How do you choose between different cloud service models (IaaS, PaaS, SaaS)?", "type": "technical"},
                    {"question": "Explain cloud security best practices.", "type": "technical"},
                    {"question": "What is auto-scaling, and how does it help in cloud applications?", "type": "technical"},
                    {"question": "How do you manage cost optimization in cloud deployments?", "type": "technical"},
                    {"question": "Explain the differences between public, private, and hybrid clouds.", "type": "technical"},
                    {"question": "How do you ensure high availability and disaster recovery in cloud systems?", "type": "technical"},
                ])

            # If domain questions found, use them
            if domain_questions:
                # Ensure unique questions by using a set-like approach
                used_questions = set()
                unique_questions = []
                for q in domain_questions:
                    question_text = q["question"]
                    if question_text not in used_questions:
                        used_questions.add(question_text)
                        unique_questions.append(q)

                # Get question based on number (1-indexed), cycling through available questions
                index = (question_number - 1) % len(unique_questions)
                question = unique_questions[index]

                return InterviewQuestionResponse(
                    question=question["question"],
                    question_type=question["type"]
                )

        # Default fallback questions if no interests or no domain questions
        fallback_questions = [
            {
                "question": "Tell me about yourself and your background in computer science.",
                "type": "personal"
            },
            {
                "question": "What programming languages are you proficient in?",
                "type": "technical"
            },
            {
                "question": "Explain the difference between object-oriented and functional programming.",
                "type": "technical"
            },
            {
                "question": "Describe a challenging project you worked on and how you overcame difficulties.",
                "type": "personal"
            },
            {
                "question": "What is your approach to debugging code?",
                "type": "technical"
            },
            {
                "question": "How do you stay updated with technology trends?",
                "type": "personal"
            },
            {
                "question": "Explain the concept of time complexity and space complexity.",
                "type": "technical"
            }
        ]

        # Get question based on number (1-indexed)
        index = (question_number - 1) % len(fallback_questions)
        question = fallback_questions[index]

        return InterviewQuestionResponse(
            question=question["question"],
            question_type=question["type"]
        )
    except Exception as e:
        logger.error(f"Error generating fallback question: {str(e)}")
        # Ultimate fallback
        return InterviewQuestionResponse(
            question="Tell me about a challenging project you worked on and what you learned from it.",
            question_type="personal"
        )

@api_router.post("/analyze-interview", response_model=InterviewAnalysisResponse)
async def analyze_interview(request: InterviewAnalysisRequest):
    """
    Generate AI-powered interview analysis using Google's Gemini API.
    Falls back to rule-based analysis if AI is unavailable.
    """
    try:
        if not gemini_model:
            logger.warning("Gemini model not available, using fallback analysis")
            return await generate_fallback_analysis(request.answers, request.questions)

        # Build conversation context from answers and questions
        conversation_text = ""
        for i, (answer, question) in enumerate(zip(request.answers, request.questions)):
            if answer and answer.strip():
                conversation_text += f"Q{i+1}: {question.get('question', '')}\nA{i+1}: {answer}\n\n"

        # Create prompt for Gemini
        prompt = f"""Analyze software engineering interview responses.

Return JSON:
{{
  "overallAssessment": "brief summary",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendations": ["advice1", "advice2"],
  "communicationSkills": ["skill1", "skill2"],
  "technicalDepth": ["depth1", "depth2"],
  "aiInsights": "potential score out of 100",
  "nextSteps": ["step1", "step2"]
}}

Conversation:
{conversation_text}"""

        # Call Gemini API
        response = gemini_model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=1000,
            )
        )

        # Check for safety filter blocks
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'finish_reason') and candidate.finish_reason == 2:  # SAFETY
                logger.warning("Gemini safety filter blocked analysis generation, using fallback")
                return await generate_fallback_analysis(request.answers, request.questions)

        # Parse the response
        analysis_text = response.text.strip()

        # Clean up the response (remove markdown code blocks if present)
        if analysis_text.startswith('```json'):
            analysis_text = analysis_text[7:]
        if analysis_text.endswith('```'):
            analysis_text = analysis_text[:-3]
        analysis_text = analysis_text.strip()

        # Parse JSON response
        import json
        analysis_data = json.loads(analysis_text)

        return InterviewAnalysisResponse(**analysis_data)

    except Exception as e:
        logger.error(f"Error generating AI interview analysis: {str(e)}")
        return await generate_fallback_analysis(request.answers, request.questions)

async def generate_fallback_analysis(answers: List[str], questions: List[dict]) -> InterviewAnalysisResponse:
    """
    Generate fallback analysis when AI is unavailable.
    Uses the existing rule-based logic from gameData.js.
    """
    try:
        # Implement basic rule-based analysis similar to the frontend
        total_questions = len(answers)
        answered_questions = len([a for a in answers if a and a.strip()])

        # Calculate basic scores
        avg_answer_length = sum(len(ans) for ans in answers if ans) / len(answers) if answers else 0

        # Basic analysis logic
        overall_assessment = ""
        if answered_questions == total_questions:
            if avg_answer_length > 80:
                overall_assessment = "Outstanding interview performance! You demonstrated excellent communication and technical skills."
            elif avg_answer_length > 40:
                overall_assessment = "Good interview performance with strong potential. Focus on consistency across all questions."
            else:
                overall_assessment = "Average interview performance. Work on providing more detailed and relevant answers."
        else:
            overall_assessment = f"Completed {answered_questions} out of {total_questions} questions. Focus on completing all interview questions."

        # Basic strengths and weaknesses
        strengths = []
        weaknesses = []

        if avg_answer_length > 80:
            strengths.append("Good communication skills with detailed responses")
        if answered_questions == total_questions:
            strengths.append("Completed all interview questions")

        if avg_answer_length < 40:
            weaknesses.append("Responses are too brief - expand on your answers")
        if answered_questions < total_questions:
            weaknesses.append("Did not answer all questions completely")

        # Technical analysis
        technical_questions = [q for q in questions if q.get('type') == 'technical']
        technical_answers = [answers[i] for i in range(len(answers)) if i < len(questions) and questions[i].get('type') == 'technical' and answers[i] and answers[i].strip()]

        communication_skills = []
        technical_depth = []

        if avg_answer_length > 100:
            communication_skills.append("Excellent verbal communication skills")
        elif avg_answer_length > 50:
            communication_skills.append("Good communication skills")
        else:
            communication_skills.append("Communication skills need improvement")

        if len(technical_answers) > 0:
            technical_depth.append("Demonstrated basic technical knowledge")
        else:
            technical_depth.append("Limited technical depth shown")

        recommendations = [
            "Practice answering common interview questions out loud",
            "Use the STAR method (Situation, Task, Action, Result) for behavioral questions",
            "Research company-specific technologies and prepare relevant examples",
            "Record yourself answering questions to improve delivery and confidence",
        ]

        ai_insights = "This analysis is based on basic heuristics. Consider practicing with more detailed responses and technical examples."

        next_steps = [
            "Review technical concepts mentioned in the questions",
            "Practice mock interviews with friends or mentors",
            "Prepare specific examples from your experience",
            "Work on speaking clearly and confidently",
        ]

        return InterviewAnalysisResponse(
            overallAssessment=overall_assessment,
            strengths=strengths,
            weaknesses=weaknesses,
            recommendations=recommendations,
            communicationSkills=communication_skills,
            technicalDepth=technical_depth,
            aiInsights=ai_insights,
            nextSteps=next_steps
        )

    except Exception as e:
        logger.error(f"Error generating fallback analysis: {str(e)}")
        # Ultimate fallback
        return InterviewAnalysisResponse(
            overallAssessment="Unable to analyze interview performance due to technical issues.",
            strengths=[],
            weaknesses=[],
            recommendations=["Please try again or contact support"],
            communicationSkills=[],
            technicalDepth=[],
            aiInsights="Analysis unavailable",
            nextSteps=["Retry the interview analysis"]
        )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
