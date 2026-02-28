import React, { useState, useEffect } from "react";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { codingChallenges, evaluateCodingChallenge } from "../../mock/gameData";
import { Play, CheckCircle, XCircle, Code, Zap, Settings } from "lucide-react";
import useCountdownTimer from "../../hooks/useCountdownTimer";

const CodingChallenge = ({ onComplete }) => {
  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [code, setCode] = useState(codingChallenges.python.starterCode);
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [screenFlash, setScreenFlash] = useState("");
  const [showSuccessText, setShowSuccessText] = useState(false);

  const { timeLeft, formattedTime, startTimer, stopTimer } = useCountdownTimer(
    1200,
    "coding-timer",
    () => {
      if (!showResults && !isRunning) {
        handleRunTests();
      }
    },
  );

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [startTimer, stopTimer]);

  const languages = [
    { value: "python", label: "Python", icon: "🐍" },
    { value: "java", label: "Java", icon: "☕" },
    { value: "cpp", label: "C++", icon: "⚡" },
    { value: "c", label: "C", icon: "🔧" },
  ];

  const currentChallenge = codingChallenges[selectedLanguage];

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    setCode(codingChallenges[language].starterCode);
    setTestResults(null);
    setShowResults(false);
  };

  const handleRunTests = async () => {
    setIsRunning(true);
    setScreenFlash("compiling");

    await new Promise((resolve) => setTimeout(resolve, 2500));

    const results = evaluateCodingChallenge(code, selectedLanguage);

    const enhancedResults = {
      ...results,
      language: selectedLanguage,
      testResults: currentChallenge.testCases.map((test, index) => ({
        testCase: index + 1,
        passed: results.passed,
        input: test.input,
        expected: test.expected,
        actual: results.passed ? test.expected : "Error",
        description: test.description,
        executionTime: `${Math.random() * 50 + 10}ms`,
      })),
    };

    setTestResults(enhancedResults);
    setIsRunning(false);
    setScreenFlash("");

    if (enhancedResults.passed) {
      setScreenFlash("success");
      setShowSuccessText(true);
      setTimeout(() => {
        setScreenFlash("");
        setShowSuccessText(false);
        onComplete(enhancedResults, code, selectedLanguage, currentChallenge);
      }, 3000);
    } else {
      setScreenFlash("fail");
      setTimeout(() => setScreenFlash(""), 500);
    }
    setShowResults(true);
  };

  const renderLanguageSelector = () => (
    <div className="mb-4 flex-shrink-0">
      <h4 className="text-xs font-semibold text-cyan-400/70 mb-3 flex items-center gap-2 uppercase tracking-wider">
        <Settings className="w-3 h-3" />
        Language
      </h4>
      <div className="flex gap-2 flex-wrap">
        {languages.map((lang) => (
          <button
            key={lang.value}
            onClick={() => handleLanguageChange(lang.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              selectedLanguage === lang.value
                ? "bg-cyan-500/10 text-cyan-400 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                : "bg-[#0a0f1a] text-slate-500 border-slate-800 hover:border-slate-600 hover:text-slate-400"
            }`}
          >
            <span className="text-base">{lang.icon}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderProblemStatement = () => (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Dark panel with cyan left border - scrollable */}
      <div className="flex-1 bg-[#0a1628] border border-cyan-500/20 rounded-xl overflow-y-auto overflow-x-hidden relative group hover:border-cyan-500/30 transition-all duration-500">
        {/* Left cyan border glow */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/60 via-cyan-500/20 to-cyan-500/60"></div>

        {/* Subtle floating animation */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

        <div className="px-5 py-4 border-b border-cyan-500/10 flex items-center gap-3 sticky top-0 bg-[#0a1628] z-10">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
          <Code className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400 font-semibold text-sm tracking-wide">
            PROBLEM STATEMENT
          </span>
          <span className="animate-pulse text-cyan-500/50">_</span>
        </div>
        <div className="p-5">
          <div className="whitespace-pre-line text-slate-400 leading-relaxed text-sm mb-4">
            {currentChallenge.problem}
          </div>

          <div className="p-3 bg-[#061224] border border-cyan-500/20 rounded-lg">
            <h5 className="font-semibold text-cyan-400 mb-2 text-xs flex items-center gap-2 uppercase tracking-wider">
              <Zap className="w-3 h-3" />
              Test Cases
            </h5>
            <div className="space-y-1 text-xs text-slate-500 font-mono">
              {currentChallenge.testCases.map((test, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-cyan-500">›</span>
                  {test.description}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {showResults && testResults && (
        <div className="mt-4 bg-[#0a1628] border border-cyan-500/20 rounded-xl overflow-hidden flex-shrink-0">
          <div
            className={`px-5 py-3 border-b ${
              testResults.passed
                ? "border-green-500/30 bg-green-500/5"
                : "border-red-500/30 bg-red-500/5"
            } flex items-center gap-2`}
          >
            {testResults.passed ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                testResults.passed ? "text-green-400" : "text-red-400"
              }`}
            >
              Results
            </span>
          </div>
          <div className="p-5">
            <div
              className={`p-3 rounded-lg mb-4 text-center ${
                testResults.passed
                  ? "bg-green-500/10 border border-green-500/30"
                  : "bg-red-500/10 border border-red-500/30"
              }`}
            >
              <p
                className={`font-semibold text-sm ${
                  testResults.passed ? "text-green-400" : "text-red-400"
                }`}
              >
                {testResults.passed ? "✓ ALL TESTS PASSED" : "✗ TESTS FAILED"}
              </p>
              {testResults.passed && (
                <p className="text-green-400/60 text-xs mt-1">
                  KEY B EARNED 🔑
                </p>
              )}
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto">
              {testResults.testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-xs flex items-center justify-between ${
                    result.passed
                      ? "bg-green-500/5 border border-green-500/10"
                      : "bg-red-500/5 border border-red-500/10"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.passed ? (
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400" />
                    )}
                    <span className="text-slate-400">
                      Test {result.testCase}
                    </span>
                  </div>
                  <span className="text-slate-600 font-mono text-xs">
                    {result.executionTime}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCodeEditor = () => (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Deep black editor with green border glow - scrollable */}
      <div
        className={`flex-1 bg-[#030712] border-2 rounded-xl overflow-y-auto transition-all duration-300 ${
          isRunning
            ? "border-cyan-500 shadow-[0_0_30px_rgba(34,211,238,0.3)]"
            : "border-slate-800 hover:border-green-500/30"
        }`}
      >
        {/* Subtle shadow glow behind editor */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/[0.03] to-transparent pointer-events-none"></div>

        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#030712] z-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <Zap className="w-4 h-4 text-green-500" />
            <span className="text-green-500 font-semibold text-sm tracking-wide">
              CODE EDITOR
            </span>
          </div>
          <div className="text-xs text-slate-600 font-mono">
            {code.split("\n").length} LINES
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="mb-3 text-xs text-slate-500 uppercase tracking-wider flex-shrink-0">
            <span className="text-slate-600">Language:</span>{" "}
            <span className="text-cyan-400">
              {languages.find((l) => l.value === selectedLanguage)?.label}
            </span>
          </div>

          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono text-sm flex-1 bg-[#010409] text-green-400 border border-slate-800 rounded-lg resize-none h-64 focus:border-green-500/50 focus:shadow-[0_0_15px_rgba(34,197,94,0.2)] focus:outline-none transition-all p-4"
            placeholder="// Write your code here..."
            spellCheck="false"
          />

          <div className="mt-4 flex justify-end flex-shrink-0">
            <Button
              onClick={handleRunTests}
              disabled={isRunning || !code.trim()}
              className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 px-6 py-2 text-sm font-semibold tracking-wide transition-all hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {isRunning ? "EXECUTING..." : "RUN TESTS"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (showResults && testResults?.passed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/95 backdrop-blur-sm overflow-y-auto">
        <div className="text-center relative p-4">
          {/* Success glow */}
          <div className="absolute inset-0 bg-green-500/10 blur-3xl rounded-full"></div>

          <div className="text-6xl mb-4 animate-bounce relative">🎉</div>
          <h2 className="text-2xl font-bold text-green-400 mb-2 tracking-wider relative">
            CHALLENGE COMPLETE
          </h2>
          <div className="bg-[#0a1628] border border-green-500/30 rounded-xl p-6 max-w-sm mx-auto relative">
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">ALL 3 TESTS PASSED</span>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                <p className="text-green-400 font-semibold text-sm">
                  KEY B EARNED 🔑
                </p>
                <p className="text-green-400/60 text-xs mt-1">
                  {languages.find((l) => l.value === selectedLanguage)?.label}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getFlashClass = () => {
    if (screenFlash === "compiling") return "bg-cyan-500/5";
    if (screenFlash === "success") return "bg-green-500/10";
    if (screenFlash === "fail") return "bg-red-500/10";
    return "";
  };

  return (
    <div
      className={`h-full flex flex-col relative overflow-y-auto ${getFlashClass()}`}
      style={{
        background: "linear-gradient(135deg, #020617 0%, #0f172a 100%)",
      }}
    >
      {/* Animated radial glow behind center */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Ambient purple/cyan blending */}
      <div className="fixed top-0 left-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 p-6 flex flex-col min-h-full">
        {/* Header */}
        <div className="mb-4 text-center relative flex-shrink-0">
          <h2
            className="text-2xl font-bold mb-1 flex items-center justify-center gap-3 tracking-widest"
            style={{
              color: "#22d3ee",
              textShadow:
                "0 0 20px rgba(34,211,238,0.5), 0 0 40px rgba(34,211,238,0.3)",
            }}
          >
            <Zap className="w-6 h-6" />
            PROGRAMMING CHAMBER
          </h2>
          <p className="text-slate-500 text-xs tracking-widest uppercase">
            Complete the challenge to unlock next access key
          </p>

          {/* Neon divider */}
          <div className="w-64 h-px mx-auto mt-4 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
        </div>

        {/* Timer */}
        <div className="absolute top-6 right-6 z-20">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm transition-all ${
              timeLeft <= 300
                ? "bg-[#0f172a] border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse"
                : "bg-[#0f172a] border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                timeLeft <= 300 ? "bg-red-500 animate-pulse" : "bg-cyan-400"
              }`}
            ></div>
            <span
              className={`font-mono text-sm font-bold tracking-wider ${
                timeLeft <= 300 ? "text-red-400" : "text-cyan-400"
              }`}
            >
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="absolute top-6 left-6 z-20">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-mono tracking-wider ${
              isRunning
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                : "bg-green-500/10 text-green-400 border border-green-500/30"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isRunning ? "bg-cyan-400 animate-pulse" : "bg-green-400"
              }`}
            ></div>
            {isRunning ? "COMPILING" : "SYSTEM ACTIVE"}
          </div>
        </div>

        {renderLanguageSelector()}

        <div className="flex-1 flex gap-4 min-h-0">
          <div className="flex-1 min-w-0">{renderProblemStatement()}</div>
          <div className="flex-1 min-w-0">{renderCodeEditor()}</div>
        </div>

        {showSuccessText && (
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="text-2xl font-bold text-green-400 animate-bounce tracking-widest shadow-[0_0_30px_rgba(34,197,94,0.8)]">
              TEST CASES PASSED ✓
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodingChallenge;
