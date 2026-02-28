import React, { useState, useEffect } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import {
  getRandomAptitudeQuestions,
  evaluateAptitudeTest,
} from "../../mock/gameData";
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Target,
  Navigation,
  Timer,
} from "lucide-react";
import useCountdownTimer from "../../hooks/useCountdownTimer";
import TimerUI from "./Timer";

const AptitudeTest = ({ onComplete }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Use the countdown timer hook for round 1 (10 minutes)
  const {
    timeLeft,
    formattedTime,
    startTimer,
    stopTimer,
    resetTimer,
    isRunning,
  } = useCountdownTimer(600, "aptitude-timer", () => {
    // Auto-submit when time runs out
    if (!showResults) {
      handleSubmit();
    }
  });

  useEffect(() => {
    // Load 10 random questions when component mounts
    const randomQuestions = getRandomAptitudeQuestions(10);
    setQuestions(randomQuestions);
    // Trigger fade-in animation
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  // Start timer when entering the test interface
  useEffect(() => {
    if (currentPage === 2 && !showResults) {
      startTimer();
    } else {
      stopTimer();
    }
  }, [currentPage, showResults, startTimer, stopTimer]);

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
    }));
  };

  const handleSubmit = () => {
    const answerArray = questions.map((_, index) => answers[index] ?? -1);
    const testResults = evaluateAptitudeTest(answerArray, questions);
    setResults(testResults);
    setShowResults(true);

    setTimeout(() => {
      onComplete(testResults, questions, answers);
    }, 3000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getQuestionStatus = (index) => {
    if (answers[index] !== undefined) return "answered";
    return "not-answered";
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const renderWelcomePage = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h2 className="text-3xl font-bold text-white mb-8">
        Welcome to the Aptitude Test
      </h2>
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">
                10 minutes – 10 questions
              </h4>
              <p className="text-slate-300">Multiple choice format</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Navigation className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">
                Freely navigate between questions
              </h4>
              <p className="text-slate-300">
                Jump to any question using the question panel
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Timer className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">Auto-submit enabled</h4>
              <p className="text-slate-300">
                Test will automatically submit when time expires
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">60% required to pass</h4>
              <p className="text-slate-300">Score at least 60% to earn Key A</p>
            </div>
          </div>
        </div>
      </div>
      <Button
        onClick={() => setCurrentPage(1)}
        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
      >
        Start Test
      </Button>
    </div>
  );

  const renderInstructionsPage = () => (
    <div className="text-center py-8">
      <h2 className="text-2xl font-bold text-white mb-6">Test Instructions</h2>
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl text-left max-w-2xl mx-auto p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">Time Limit</h4>
              <p className="text-slate-300">10 minutes for 10 questions</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">Navigation</h4>
              <p className="text-slate-300">
                You can jump to any question using the question panel
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">Auto-Submit</h4>
              <p className="text-slate-300">
                Test will automatically submit when time expires
              </p>
            </div>
          </div>
        </div>
      </div>
      <Button
        onClick={() => setCurrentPage(2)}
        className="mt-6 bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
      >
        Begin Questions
      </Button>
    </div>
  );

  const renderTestInterface = () => {
    const question = questions[currentQuestionIndex];

    if (!question) return null;

    return (
      <div className="h-full flex">
        {/* Left Side - Question Display */}
        <div className="flex-1 flex flex-col p-6">
          {/* Question Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              Question {currentQuestionIndex + 1}
            </h2>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
                }
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentQuestionIndex(
                    Math.min(questions.length - 1, currentQuestionIndex + 1),
                  )
                }
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Question Content */}
          <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl flex-1 p-6">
            <p className="text-white mb-8 text-lg leading-relaxed">
              {question.question}
            </p>

            <div className="space-y-4">
              {question.options.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    answers[currentQuestionIndex] === index
                      ? "border-blue-400 bg-blue-500/20"
                      : "border-white/20 hover:border-white/40 hover:bg-white/10"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestionIndex}`}
                    value={index}
                    checked={answers[currentQuestionIndex] === index}
                    onChange={() =>
                      handleAnswerSelect(currentQuestionIndex, index)
                    }
                    className="w-4 h-4 text-blue-400"
                  />
                  <span className="ml-3 text-slate-200">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
            >
              Submit Test
            </Button>
          </div>
        </div>

        {/* Right Side - Question Navigation and Timer */}
        <div className="w-80 bg-white/5 border-l border-white/10 p-6 flex flex-col rounded-r-2xl">
          {/* Timer */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock
                className={`w-6 h-6 ${timeLeft < 60 ? "text-red-400" : "text-slate-300"}`}
              />
              <span
                className={`font-mono text-2xl font-bold ${timeLeft < 60 ? "text-red-400" : "text-white"}`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="text-center text-sm text-slate-400">
              Time Remaining
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="text-center mb-2">
              <span className="text-lg font-semibold text-white">
                {getAnsweredCount()}/{questions.length}
              </span>
              <span className="text-sm text-slate-400 ml-1">
                Questions Answered
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(getAnsweredCount() / questions.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Question Grid */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-4">Questions</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-12 h-12 rounded-lg border-2 font-semibold transition-all ${
                    currentQuestionIndex === index
                      ? "border-blue-400 bg-blue-500/30 text-blue-200"
                      : getQuestionStatus(index) === "answered"
                        ? "border-green-400 bg-green-500/30 text-green-200"
                        : "border-white/20 bg-white/10 text-slate-300 hover:border-white/40"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/20 bg-white/10 rounded"></div>
              <span className="text-slate-400">Not Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-green-400 bg-green-500/30 rounded"></div>
              <span className="text-slate-400">Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-400 bg-blue-500/30 rounded"></div>
              <span className="text-slate-400">Current</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => (
    <div className="text-center py-8">
      <div
        className={`text-6xl mb-4 ${results.passed ? "text-green-400" : "text-red-400"}`}
      >
        {results.passed ? "🎉" : "😞"}
      </div>

      <h2
        className={`text-3xl font-bold mb-4 ${results.passed ? "text-green-400" : "text-red-400"}`}
      >
        {results.passed ? "Congratulations!" : "Test Failed"}
      </h2>

      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl max-w-md mx-auto p-6">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">
              {results.score.toFixed(1)}%
            </div>
            <div className="text-slate-400">Your Score</div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Correct Answers:</span>
              <span className="font-semibold text-white">
                {results.correctAnswers}/{results.totalQuestions}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Passing Score:</span>
              <span className="font-semibold text-white">60%</span>
            </div>
          </div>

          {results.passed && (
            <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4 text-center">
              <p className="text-green-300 font-semibold">
                You earned Key A! 🔑
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (showResults) {
      return renderResults();
    }

    if (currentPage === 0) {
      return renderWelcomePage();
    }

    if (currentPage === 1) {
      return renderInstructionsPage();
    }

    return renderTestInterface();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">
      <div
        className={`
          bg-white/5 
          rounded-2xl 
          border border-white/10 
          shadow-2xl 
          p-8 
          w-full 
          max-w-6xl 
          max-h-[90vh] 
          overflow-y-auto
          transition-all 
          duration-500 
          ease-out
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default AptitudeTest;
