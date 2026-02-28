import React, { useState, useEffect, useRef } from "react";
import { Textarea } from "./textarea";
import {
  firstInterviewQuestion,
  detectInterests,
  generateDynamicQuestions,
  generateInterviewAnalysis,
  interviewQuestions,
} from "../../mock/gameData";
import { Mic, MicOff, Loader2, Send } from "lucide-react";
import useCountdownTimer from "../../hooks/useCountdownTimer";

const InterviewPanel = ({ onComplete, isActive = false, onReaction }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([""]);
  const [isListening, setIsListening] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [recognition, setRecognition] = useState(null);
  // Fixed: Initialize with exactly 7 empty answer slots and ensure 7 questions
  const [dynamicQuestions, setDynamicQuestions] = useState([
    firstInterviewQuestion,
  ]);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);

  // Track the total expected questions - always 7
  const TOTAL_QUESTIONS = 7;
  const [interimText, setInterimText] = useState("");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const speechAccumulatedRef = useRef("");

  // Typing effect state
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);

  // Analyzing state
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Question transition state
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Timer
  const { timeLeft, formattedTime, startTimer, stopTimer, resetTimer } =
    useCountdownTimer(1200, "interview-timer", () => {
      if (!showResults) {
        handleSubmitInterview();
      }
    });

  // Start timer when interview starts
  useEffect(() => {
    if (interviewStarted && !showResults) {
      startTimer();
    } else {
      stopTimer();
    }
  }, [interviewStarted, showResults, startTimer, stopTimer]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const speechRecognition = new SpeechRecognition();

      speechRecognition.continuous = true;
      speechRecognition.interimResults = true;
      speechRecognition.lang = "en-US";
      speechRecognition.maxAlternatives = 3;

      let finalTranscript = "";
      let interimTranscript = "";

      speechRecognition.onresult = (event) => {
        finalTranscript = "";
        interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          speechAccumulatedRef.current += finalTranscript;
          handleAnswerChange(speechAccumulatedRef.current);
        }

        if (interimTranscript) {
          setInterimText(interimTranscript);
        }
      };

      speechRecognition.onerror = () => {
        setIsListening(false);
      };

      speechRecognition.onend = () => {
        setIsListening(false);
      };

      setRecognition(speechRecognition);
    }
  }, [currentQuestion]);

  // Typing effect when question changes
  useEffect(() => {
    if (!interviewStarted || isGeneratingQuestion) return;

    const question = dynamicQuestions[currentQuestion];
    if (!question) return;

    // Fade in speech bubble
    setShowSpeechBubble(true);
    setDisplayText("");
    setIsTyping(true);

    let charIndex = 0;
    const text = question.question;
    const typingInterval = setInterval(() => {
      if (charIndex <= text.length) {
        setDisplayText(text.slice(0, charIndex));
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, [
    currentQuestion,
    dynamicQuestions,
    interviewStarted,
    isGeneratingQuestion,
  ]);

  const handleAnswerChange = (value) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
  };

  // Generate questions locally (fallback when API fails)
  const generateLocalQuestions = (firstAnswer, numQuestions = 7) => {
    // Always include the first question from dynamicQuestions
    const questions = [firstInterviewQuestion];

    // Detect interests from first answer
    const interests = detectInterests([firstAnswer]);

    // Get domain-specific questions
    let domainQuestions = generateDynamicQuestions(interests);

    // If we don't have enough domain questions, add from default interviewQuestions
    if (domainQuestions.length < numQuestions - 1) {
      // Add default questions that aren't already included
      interviewQuestions.forEach((q) => {
        if (!domainQuestions.find((dq) => dq.id === q.id)) {
          domainQuestions.push(q);
        }
      });
    }

    // Add remaining questions to reach numQuestions total (first question + numQuestions-1 more)
    const remainingCount = numQuestions - 1;
    for (let i = 0; i < remainingCount && i < domainQuestions.length; i++) {
      // Create unique IDs for questions (9, 10, 11, etc.)
      questions.push({
        ...domainQuestions[i],
        id: 9 + i,
      });
    }

    // If still not enough questions, add from interviewQuestions with unique IDs
    if (questions.length < numQuestions) {
      const usedIds = new Set(questions.map((q) => q.id));
      let additionalId = 20;
      interviewQuestions.forEach((q) => {
        if (questions.length >= numQuestions) return;
        if (!usedIds.has(q.id)) {
          questions.push({ ...q, id: additionalId++ });
          usedIds.add(q.id);
        }
      });
    }

    return questions;
  };

  // Debug logging for question flow
  const debugQuestionFlow = (action, data) => {
    console.log(`[Interview Debug] ${action}:`, {
      currentQuestionIndex: currentQuestion,
      questionsLength: dynamicQuestions?.length || 0,
      answersLength: answers?.length || 0,
      questionsGenerated,
      ...data,
    });
  };

  const handleNextQuestion = async () => {
    if (isListening && recognition) recognition.stop();
    speechAccumulatedRef.current = "";

    setIsTransitioning(true);
    setShowSpeechBubble(false);
    setTimeout(() => setIsTransitioning(false), 300);

    // First question - generate all remaining questions
    // Fixed: Use TOTAL_QUESTIONS to determine if we can proceed, not dynamicQuestions.length
    // This ensures we always have 7 questions available
    if (
      currentQuestion === 0 &&
      !questionsGenerated &&
      answers[0] &&
      answers[0].length > 0
    ) {
      // Add first Q&A to conversation history
      const newHistory = [
        ...conversationHistory,
        {
          question: dynamicQuestions[0].question,
          answer: answers[0],
        },
      ];
      setConversationHistory(newHistory);

      // Try to generate via API first
      try {
        setIsGeneratingQuestion(true);
        const response = await fetch("/api/generate-interview-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_history: newHistory,
            question_number: 2,
            interests: detectInterests([answers[0]]),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // API worked - create questions array
          const newQuestions = [
            dynamicQuestions[0],
            { id: 2, question: data.question, type: data.question_type },
          ];

          // Generate remaining 5 questions
          for (let i = 3; i <= 7; i++) {
            try {
              const qResponse = await fetch(
                "/api/generate-interview-question",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    conversation_history: newHistory,
                    question_number: i,
                    interests: detectInterests([answers[0]]),
                  }),
                },
              );
              if (qResponse.ok) {
                const qData = await qResponse.json();
                newQuestions.push({
                  id: i,
                  question: qData.question,
                  type: qData.question_type,
                });
              } else {
                throw new Error("API failed");
              }
            } catch {
              // Use fallback for this question
              const fallback = generateLocalQuestions(answers[0], 7);
              const fallbackIndex = (i - 2) % fallback.length;
              newQuestions.push(fallback[fallbackIndex] || fallback[0]);
            }
          }

          setDynamicQuestions(newQuestions);
        } else {
          throw new Error("API failed");
        }
      } catch (error) {
        console.log("API failed, using local fallback questions");
        // Use local fallback
        const localQuestions = generateLocalQuestions(answers[0], 7);
        setDynamicQuestions(localQuestions);
      } finally {
        setIsGeneratingQuestion(false);
      }

      setQuestionsGenerated(true);

      // Expand answers array - use new questions length (7) instead of old dynamicQuestions.length
      // The setDynamicQuestions was called above, but state updates are async, so we use 7 directly
      const expandedAnswers = [...answers];
      while (expandedAnswers.length < 7) {
        expandedAnswers.push("");
      }
      setAnswers(expandedAnswers);

      // Debug logging
      debugQuestionFlow("After question generation", {
        newQuestionsLength: 7,
        expandedAnswersLength: expandedAnswers.length,
      });

      // Move to next question
      setCurrentQuestion(1);
    }
    // Subsequent questions - just move to next
    else if (currentQuestion < dynamicQuestions.length - 1) {
      if (answers[currentQuestion] && answers[currentQuestion].length > 0) {
        const newHistory = [
          ...conversationHistory,
          {
            question: dynamicQuestions[currentQuestion].question,
            answer: answers[currentQuestion],
          },
        ];
        setConversationHistory(newHistory);
      }

      // Debug logging
      debugQuestionFlow("Moving to next question", {
        fromIndex: currentQuestion,
        toIndex: currentQuestion + 1,
      });

      setCurrentQuestion(currentQuestion + 1);
    }
  };

  // Local grading function to evaluate answers - each correct answer gets 1 point
  const gradeInterviewAnswers = (answers, questions) => {
    let correct = 0;
    const totalQuestions = TOTAL_QUESTIONS;

    answers.forEach((answer, index) => {
      // Check if answer is satisfactory (minimum 20 characters and not empty)
      if (answer && answer.trim().length >= 20) {
        correct += 1; // Each correct answer gets exactly 1 point
      }
      // All other cases (empty, too short) get 0 points
    });

    // Calculate percentage: (correct answers / total questions) * 100
    const percentage =
      totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;

    // Need 4 out of 7 (approximately 60%) to pass
    const passed = correct >= 4;

    return {
      score: Math.round(percentage),
      correct: correct,
      totalQuestions: totalQuestions,
      passed: passed,
    };
  };

  const handleSubmitInterview = async () => {
    if (isListening && recognition) recognition.stop();
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/analyze-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: answers,
          questions: dynamicQuestions.map((q) => ({
            question: q.question,
            type: q.type,
          })),
        }),
      });

      let aiAnalysis = null;
      if (response.ok) {
        aiAnalysis = await response.json();
      }

      // Use local evaluation with actual questions asked
      const localEvaluation = gradeInterviewAnswers(answers, dynamicQuestions);

      const resultsWithAnswers = {
        ...localEvaluation,
        ...aiAnalysis,
        answers: [...answers],
        totalQuestions: dynamicQuestions.length,
        questions: dynamicQuestions,
      };

      setResults(resultsWithAnswers);
      setShowResults(true);

      if (onReaction) {
        onReaction(localEvaluation.passed ? "positive" : "neutral");
      }

      setTimeout(() => {
        onComplete(resultsWithAnswers, answers, dynamicQuestions);
      }, 3000);
    } catch (error) {
      console.error("Error in interview submission:", error);

      // Fallback to local evaluation
      const localEvaluation = gradeInterviewAnswers(answers, dynamicQuestions);
      const mockAnalysis = generateInterviewAnalysis(
        localEvaluation,
        answers,
        dynamicQuestions,
      );

      const resultsWithAnswers = {
        ...localEvaluation,
        ...mockAnalysis,
        answers: [...answers],
        totalQuestions: dynamicQuestions.length,
        questions: dynamicQuestions,
      };

      setResults(resultsWithAnswers);
      setShowResults(true);

      if (onReaction) {
        onReaction(localEvaluation.passed ? "positive" : "neutral");
      }

      setTimeout(() => {
        onComplete(resultsWithAnswers, answers, dynamicQuestions);
      }, 3000);
    }
  };

  const toggleSpeechRecognition = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
      }
    }
  };

  const renderWelcome = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 max-w-lg mx-4 text-center shadow-2xl">
        <div className="text-6xl mb-4">👔</div>
        <h2 className="text-3xl font-bold text-white mb-4">
          HR Interview Round
        </h2>
        <div className="space-y-4 text-left mb-6">
          <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-semibold text-white">7 Questions</h4>
              <p className="text-slate-400 text-sm">
                Personal and technical topics
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-semibold text-white">Voice Input</h4>
              <p className="text-slate-400 text-sm">
                Use speech-to-text (Chrome recommended)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-semibold text-white">Passing Criteria</h4>
              <p className="text-slate-400 text-sm">
                Answer 4 out of 7 questions satisfactorily
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setInterviewStarted(true)}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-8 py-4 text-lg font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          Begin Interview
        </button>
      </div>
    </div>
  );

  const renderQuestion = () => {
    const question = dynamicQuestions[currentQuestion];
    // Fixed: Use TOTAL_QUESTIONS constant to properly determine last question
    // This prevents premature submission when dynamicQuestions.length is still 1
    const isLastQuestion =
      currentQuestion >= TOTAL_QUESTIONS - 1 ||
      (questionsGenerated && currentQuestion >= dynamicQuestions.length - 1);

    return (
      <div className="fixed inset-0 z-40 flex flex-col">
        {/* Timer - Top Right */}
        <div className="absolute top-4 right-4 z-50">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur text-white rounded-xl border ${timeLeft <= 60 ? "border-red-500" : "border-purple-500/50"}`}
          >
            <div
              className={`w-2 h-2 rounded-full ${timeLeft <= 60 ? "bg-red-500 animate-pulse" : "bg-green-500"}`}
            ></div>
            <span className="font-mono text-lg font-bold">{formattedTime}</span>
          </div>
        </div>

        {/* Speech Bubble - Above HR */}
        <div
          className={`absolute top-[15%] left-1/2 -translate-x-1/2 z-30 transition-all duration-500 ${
            showSpeechBubble
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4"
          }`}
        >
          <div className="relative max-w-xl">
            {/* Speech bubble pointer */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-purple-500/60"></div>

            {/* Bubble content */}
            <div className="bg-black/70 backdrop-blur-xl border border-purple-500/50 rounded-2xl px-6 py-4 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
              {isGeneratingQuestion ? (
                <div className="flex items-center gap-3 text-purple-300">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating question...</span>
                </div>
              ) : (
                <p className="text-white text-lg leading-relaxed">
                  {isTyping ? displayText : question?.question}
                  {isTyping && (
                    <span className="inline-block w-1 h-5 bg-purple-400 ml-1 animate-pulse"></span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Analyzing Message */}
        {isAnalyzing && (
          <div className="absolute top-[32%] left-1/2 -translate-x-1/2 z-30">
            <div className="bg-black/60 backdrop-blur-xl border border-purple-500/30 rounded-xl px-4 py-2 flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <div
                  className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
              <span className="text-purple-200 text-sm">
                Analyzing response...
              </span>
            </div>
          </div>
        )}

        {/* Results Overlay */}
        {showResults && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div
              className={`bg-slate-900/90 backdrop-blur-xl border-2 rounded-2xl p-8 text-center shadow-2xl ${
                results?.passed ? "border-green-500" : "border-red-500"
              }`}
            >
              <div className="text-6xl mb-4">
                {results?.passed ? "🎉" : "😞"}
              </div>
              <h2
                className={`text-3xl font-bold mb-2 ${results?.passed ? "text-green-400" : "text-red-400"}`}
              >
                {results?.passed ? "Interview Passed!" : "Interview Completed"}
              </h2>
              <p className="text-slate-300 mb-4">
                Score: {results?.score}% ({results?.correct} points)
              </p>
              {results?.passed && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                  <p className="text-green-400 font-semibold">
                    You earned Key C! 🔑
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Input Panel */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-black/70 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
              {/* Question Progress */}
              <div className="flex items-center justify-between mb-3 text-sm text-slate-400">
                <span>
                  Question {currentQuestion + 1} of {dynamicQuestions.length}
                </span>
                <div className="flex gap-1">
                  {dynamicQuestions.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentQuestion
                          ? "bg-purple-500"
                          : idx < currentQuestion
                            ? "bg-green-500"
                            : "bg-slate-600"
                      }`}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="flex gap-3">
                <Textarea
                  value={answers[currentQuestion]}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder={
                    isTyping
                      ? "Wait for question..."
                      : "Type your response here..."
                  }
                  className="flex-1 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 resize-none min-h-[60px] max-h-[120px]"
                  disabled={isTyping}
                />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={toggleSpeechRecognition}
                    disabled={!recognition || isTyping}
                    className={`p-3 rounded-xl transition-all ${
                      isListening
                        ? "bg-red-500/20 border border-red-500 text-red-400"
                        : "bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600"
                    } ${!recognition || isTyping ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isListening ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={
                      isLastQuestion
                        ? handleSubmitInterview
                        : handleNextQuestion
                    }
                    disabled={
                      isTyping ||
                      isAnalyzing ||
                      answers[currentQuestion].length < 20
                    }
                    className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isLastQuestion ? (
                      <Send className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">Next</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Character Count */}
              <div className="mt-2 text-xs text-slate-500 text-right">
                {answers[currentQuestion].length} characters
                {answers[currentQuestion].length < 20 && " (min 20)"}
              </div>
            </div>
          </div>
        </div>

        {/* Transition Overlay */}
        {isTransitioning && (
          <div className="absolute inset-0 bg-black/30 z-10 pointer-events-none"></div>
        )}
      </div>
    );
  };

  if (!interviewStarted) {
    return renderWelcome();
  }

  return renderQuestion();
};

export default InterviewPanel;
