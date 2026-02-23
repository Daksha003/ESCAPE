import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import ClassroomScene from "./scenes/ClassroomScene";
import CodingLabScene from "./scenes/CodingLabScene";
import InterviewRoomScene from "./scenes/InterviewRoomScene";
import GameUI from "./ui/GameUI";
import Report from "./ui/Report";
import AIAnalysis from "./ui/AIAnalysis";
import ComprehensiveAnalysis from "./ui/ComprehensiveAnalysis";
import {
  generateAptitudeAnalysis,
  generateCodingAnalysis,
  generateInterviewAnalysis,
  generateComprehensiveAnalysis,
} from "../mock/gameData";

const Game = () => {
  const loadGameState = () => {
    try {
      const saved = localStorage.getItem("escapeRoomGameState");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  };

  const savedState = loadGameState();

  const [stage, setStage] = useState("door");
  const [textPhase, setTextPhase] = useState(0);
  const [lockShaking, setLockShaking] = useState(false);
  const [lockBouncing, setLockBouncing] = useState(false);
  const [lightBeam, setLightBeam] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const [currentRoom, setCurrentRoom] = useState(savedState?.currentRoom || 1);
  const [keysCollected, setKeysCollected] = useState(
    savedState?.keysCollected || { keyA: false, keyB: false, keyC: false },
  );
  const [roomsCompleted, setRoomsCompleted] = useState(
    savedState?.roomsCompleted || {
      classroom: false,
      codingLab: false,
      interviewRoom: false,
    },
  );
  const [showUI, setShowUI] = useState(null);
  const [gameCompleted, setGameCompleted] = useState(
    savedState?.gameCompleted || false,
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [scores, setScores] = useState(
    savedState?.scores || { aptitude: null, coding: null, interview: null },
  );
  const [showReport, setShowReport] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [showComprehensiveAnalysis, setShowComprehensiveAnalysis] =
    useState(false);
  const [comprehensiveAnalysisData, setComprehensiveAnalysisData] =
    useState(null);
  const [testData, setTestData] = useState({
    aptitude: null,
    coding: null,
    interview: null,
  });
  const [testFailed, setTestFailed] = useState(false);

  useEffect(() => {
    if (stage !== "door") return;
    if (textPhase === 0) setTimeout(() => setTextPhase(1), 1500);
    else if (textPhase === 1) setTimeout(() => setTextPhase(2), 2500);
    else if (textPhase === 2) setTimeout(() => setTextPhase(3), 3000);
    else if (textPhase === 3) setTimeout(() => setTextPhase(4), 2000);
  }, [textPhase, stage]);

  const handleLockClick = () => {
    console.log("🧠 Cognitive Lock clicked!");
    console.log("🔊 Playing metallic unlock sound...");

    if (stage !== "door") return;

    // Trigger lock bounce animation
    setLockBouncing(true);
    setTimeout(() => setLockBouncing(false), 400);

    // Trigger door shake
    setLockShaking(true);

    // Show light beam effect after 300ms
    setTimeout(() => {
      setLightBeam(true);
      console.log("💡 Light beam effect activated");
    }, 300);

    // Transition to unlock stage after 500ms
    setTimeout(() => {
      console.log("🚪 Door unlocking... Transitioning to Cognitive Chamber");
      setStage("unlock");
    }, 500);

    // Fade to black after unlock animation (1.5s total)
    setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setStage("intro");
        setIsFading(false);
        setLockShaking(false);
        setLightBeam(false);
      }, 700); // 700ms fade transition (within 500-800ms range)
    }, 1500);
  };

  const handleEnterChamber = () => {
    console.log("Enter Chamber clicked! Going to classroom...");
    setStage("classroom");
  };

  useEffect(() => {
    const gameState = {
      currentRoom,
      keysCollected,
      roomsCompleted,
      gameCompleted,
      scores,
    };
    try {
      localStorage.setItem("escapeRoomGameState", JSON.stringify(gameState));
    } catch (error) {
      console.error("Error saving game state:", error);
    }
  }, [currentRoom, keysCollected, roomsCompleted, gameCompleted, scores]);

  useEffect(() => {
    const allKeysCollected =
      keysCollected.keyA && keysCollected.keyB && keysCollected.keyC;
    if (allKeysCollected && !gameCompleted) {
      setTimeout(() => setGameCompleted(true), 1000);
    }
  }, [keysCollected, gameCompleted]);

  const handleRoomComplete = (roomType) => {
    setRoomsCompleted((prev) => ({ ...prev, [roomType]: true }));
    if (roomType === "classroom") {
      setKeysCollected((prev) => ({ ...prev, keyA: true }));
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentRoom(2);
        setIsTransitioning(false);
      }, 3000);
    } else if (roomType === "codingLab") {
      setKeysCollected((prev) => ({ ...prev, keyB: true }));
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentRoom(3);
        setIsTransitioning(false);
      }, 3000);
    } else if (roomType === "interviewRoom") {
      setKeysCollected((prev) => ({ ...prev, keyC: true }));
    }
  };

  const renderCurrentRoom = () => {
    switch (currentRoom) {
      case 1:
        return (
          <ClassroomScene
            onComplete={() => handleRoomComplete("classroom")}
            onShowUI={(type) => setShowUI(type)}
            completed={roomsCompleted.classroom}
          />
        );
      case 2:
        return (
          <CodingLabScene
            onComplete={() => handleRoomComplete("codingLab")}
            onShowUI={(type) => setShowUI(type)}
            completed={roomsCompleted.codingLab}
          />
        );
      case 3:
        return (
          <InterviewRoomScene
            onComplete={() => handleRoomComplete("interviewRoom")}
            onShowUI={(type) => setShowUI(type)}
            completed={roomsCompleted.interviewRoom}
          />
        );
      default:
        return null;
    }
  };

  const getRoomTheme = () => {
    switch (currentRoom) {
      case 1:
        return "from-blue-900 to-slate-800";
      case 2:
        return "from-gray-900 to-black";
      case 3:
        return "from-purple-900 to-slate-800";
      default:
        return "from-slate-900 to-slate-800";
    }
  };

  const getRoomName = () => {
    switch (currentRoom) {
      case 1:
        return "Classroom - Aptitude Round";
      case 2:
        return "Coding Lab - Programming Challenge";
      case 3:
        return "Interview Room - Final Assessment";
      default:
        return "Unknown Room";
    }
  };

  const handleTestComplete = (testType, result, param1, param2, param3) => {
    setScores((prev) => ({ ...prev, [testType]: result }));
    setTestData((prev) => ({
      ...prev,
      [testType]: { result, param1, param2, param3 },
    }));
    const failed = !result.passed;
    if (failed) {
      setTestFailed(true);
      return;
    }
    const completedTests =
      Object.values(scores).filter((score) => score !== null).length + 1;
    const allCompleted = completedTests === 3;

    if (allCompleted) {
      setTimeout(() => {
        const comprehensiveAnalysis = generateComprehensiveAnalysis(
          scores,
          testData,
        );
        setComprehensiveAnalysisData(comprehensiveAnalysis);
        setShowComprehensiveAnalysis(true);
      }, 1000);
    } else {
      setTimeout(() => {
        let analysis = null;
        if (testType === "aptitude")
          analysis = generateAptitudeAnalysis(result, param1, param2);
        else if (testType === "coding")
          analysis = generateCodingAnalysis(result, param2, param1);
        else if (testType === "interview")
          analysis = generateInterviewAnalysis(result, param1);
        if (analysis) {
          setAnalysisData(analysis);
          setShowAIAnalysis(testType);
        }
      }, 1000);
    }
  };

  const renderDoorScene = () => (
    <div className="absolute inset-0 z-50 bg-gradient-to-b from-slate-950 via-slate-900 to-black flex items-center justify-center">
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/60"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>
      <div className="text-center px-8 max-w-2xl relative z-10">
        <div className="mb-16 space-y-6">
          <p
            className={`text-2xl text-white/90 font-light tracking-wide transition-all duration-700 ${textPhase >= 1 ? "opacity-100" : "opacity-0"}`}
          >
            "The door has no handle."
          </p>
          <p
            className={`text-2xl text-white/90 font-light tracking-wide transition-all duration-700 ${textPhase >= 2 ? "opacity-100" : "opacity-0"}`}
          >
            "It opens only for those who pass all three trials."
          </p>
          <p
            className={`text-2xl text-amber-400/90 font-light tracking-wide transition-all duration-700 ${textPhase >= 3 ? "opacity-100" : "opacity-0"}`}
          >
            "Behind it... your Offer Letter waits."
          </p>
          <p
            className={`text-xl text-blue-400 font-semibold tracking-wider transition-all duration-700 ${textPhase >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            "Choose your first chamber."
          </p>
        </div>
        <div
          className={`relative transition-transform duration-100 ${lockShaking ? "animate-shake" : ""}`}
        >
          <div className="w-72 h-96 mx-auto bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg border-4 border-slate-600 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLockClick();
                }}
                className={`group relative w-20 h-24 bg-slate-900 rounded-lg border-2 border-blue-500 hover:border-blue-400 transition-all duration-300 hover:scale-110 cursor-pointer shadow-[0_0_25px_rgba(59,130,246,0.5)] ${lockBouncing ? "animate-lockBounce" : "animate-pulseGlow"}`}
                style={
                  lockBouncing
                    ? {}
                    : { animation: "pulseGlow 2s ease-in-out infinite" }
                }
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl">🧠</span>
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-blue-500/50 rounded-full blur-sm group-hover:bg-blue-400 group-hover:shadow-[0_0_15px_rgba(59,130,246,1)] transition-all"></div>
                <div className="absolute inset-0 rounded-lg bg-blue-500/10 animate-pulse"></div>
              </button>
              <div className="w-16 h-20 bg-slate-900/50 rounded-md border-2 border-slate-700 opacity-40">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl">💻</span>
                </div>
              </div>
              <div className="w-16 h-20 bg-slate-900/50 rounded-md border-2 border-slate-700 opacity-40">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl">🗣</span>
                </div>
              </div>
            </div>
            {lightBeam && (
              <div className="absolute inset-x-0 top-0 h-1 bg-white/80 shadow-[0_0_30px_rgba(255,255,255,0.8)] animate-pulse"></div>
            )}
          </div>
        </div>
      </div>
      {isFading && (
        <div
          className="absolute inset-0 bg-black transition-opacity duration-700"
          style={{ opacity: isFading ? 1 : 0 }}
        ></div>
      )}
    </div>
  );

  const renderUnlockScene = () => (
    <div className="absolute inset-0 z-50 bg-gradient-to-b from-slate-950 via-slate-900 to-black flex items-center justify-center">
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/60"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>
      <div className="text-center px-8 max-w-2xl relative z-10">
        <div className="mb-16 space-y-6">
          <p className="text-2xl text-white/90 font-light tracking-wide opacity-100">
            "The door has no handle."
          </p>
          <p className="text-2xl text-white/90 font-light tracking-wide opacity-100">
            "It opens only for those who pass all three trials."
          </p>
          <p className="text-2xl text-amber-400/90 font-light tracking-wide opacity-100">
            "Behind it... your Offer Letter waits."
          </p>
          <p className="text-xl text-blue-400 font-semibold tracking-wider opacity-100">
            "Choose your first chamber."
          </p>
        </div>
        <div className="relative animate-shake">
          <div className="w-72 h-96 mx-auto bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg border-4 border-slate-600 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
              <div className="relative w-16 h-20 bg-slate-900 rounded-md border-2 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.8)]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl">🧠</span>
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-1 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
              </div>
              <div className="w-16 h-20 bg-slate-900/50 rounded-md border-2 border-slate-700 opacity-40">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl">💻</span>
                </div>
              </div>
              <div className="w-16 h-20 bg-slate-900/50 rounded-md border-2 border-slate-700 opacity-40">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl">🗣</span>
                </div>
              </div>
            </div>
            <div className="absolute inset-x-0 top-0 h-1 bg-white/80 shadow-[0_0_30px_rgba(255,255,255,0.8)] animate-pulse"></div>
          </div>
        </div>
      </div>
      {isFading && (
        <div
          className="absolute inset-0 bg-black transition-opacity duration-700"
          style={{ opacity: isFading ? 1 : 0 }}
        ></div>
      )}
    </div>
  );

  const renderIntroSlide = () => (
    <div className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-12 max-w-lg mx-4 text-center shadow-[0_0_60px_rgba(59,130,246,0.2)]">
        <h1 className="text-4xl font-bold text-white mb-4 tracking-wider">
          Cognitive Chamber
        </h1>
        <p className="text-xl text-blue-300 mb-6 font-light">
          Tests your reasoning under time pressure.
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 mb-8 space-y-2">
          <div className="flex justify-between text-white/80">
            <span>Accuracy Threshold:</span>
            <span className="text-green-400 font-semibold">60%</span>
          </div>
          <div className="flex justify-between text-white/80">
            <span>Timer:</span>
            <span className="text-amber-400 font-semibold">Active</span>
          </div>
        </div>
        <button
          onClick={handleEnterChamber}
          className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xl font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-blue-400/30"
        >
          Enter Chamber
        </button>
      </div>
    </div>
  );

  const renderClassroom = () => (
    <>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>
      {isTransitioning && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🔑</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Room Completed!
            </h2>
            <p className="text-white/80">Transitioning to next challenge...</p>
            <div className="mt-6 w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      <Canvas
        camera={{ position: [0, 5, 10], fov: 75 }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <OrbitControls
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minDistance={5}
          maxDistance={20}
          enableDamping={true}
          dampingFactor={0.05}
        />
        {renderCurrentRoom()}
      </Canvas>
      <GameUI
        currentRoom={currentRoom}
        keysCollected={keysCollected}
        showUI={showUI}
        onCloseUI={() => setShowUI(null)}
        onRoomComplete={handleRoomComplete}
        onTestComplete={handleTestComplete}
        gameCompleted={gameCompleted}
      />

      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <div className="text-white text-sm font-semibold mb-2">
          Keys Collected
        </div>
        <div className="flex gap-2">
          <KeyDisplay keyName="A" collected={keysCollected.keyA} theme="blue" />
          <KeyDisplay
            keyName="B"
            collected={keysCollected.keyB}
            theme="green"
          />
          <KeyDisplay
            keyName="C"
            collected={keysCollected.keyC}
            theme="purple"
          />
        </div>
      </div>

      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md rounded-xl p-4 text-white z-10 border border-white/20">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          Progress
        </h3>
        <div className="space-y-2 text-sm">
          <div
            className={`flex items-center justify-between p-2 rounded-lg ${currentRoom >= 1 ? "bg-blue-600/30 text-blue-300" : "bg-gray-700/30 text-gray-500"}`}
          >
            <span>Room 1: Classroom</span>
            <span>
              {roomsCompleted.classroom ? "✓" : currentRoom === 1 ? "⏳" : "○"}
            </span>
          </div>
          <div
            className={`flex items-center justify-between p-2 rounded-lg ${currentRoom >= 2 ? "bg-green-600/30 text-green-300" : "bg-gray-700/30 text-gray-500"}`}
          >
            <span>Room 2: Coding Lab</span>
            <span>
              {roomsCompleted.codingLab ? "✓" : currentRoom === 2 ? "⏳" : "○"}
            </span>
          </div>
          <div
            className={`flex items-center justify-between p-2 rounded-lg ${currentRoom >= 3 ? "bg-purple-600/30 text-purple-300" : "bg-gray-700/30 text-gray-500"}`}
          >
            <span>Room 3: Interview</span>
            <span>
              {roomsCompleted.interviewRoom
                ? "✓"
                : currentRoom === 3
                  ? "⏳"
                  : "○"}
            </span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-white/10 rounded-lg">
          <div className="text-xs text-white/70 mb-1">Current Location</div>
          <div className="font-semibold">{getRoomName()}</div>
        </div>
        {!roomsCompleted.classroom && currentRoom === 1 && (
          <button
            onClick={() => setShowUI("aptitude")}
            className="mt-3 w-full text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
          >
            🎯 Test Aptitude
          </button>
        )}
        {!roomsCompleted.codingLab && currentRoom === 2 && (
          <button
            onClick={() => setShowUI("coding")}
            className="mt-3 w-full text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg"
          >
            💻 Test Coding
          </button>
        )}
        {!roomsCompleted.interviewRoom && currentRoom === 3 && (
          <button
            onClick={() => setShowUI("interview")}
            className="mt-3 w-full text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg"
          >
            🎤 Test Interview
          </button>
        )}
      </div>

      {showReport && (
        <Report scores={scores} onClose={() => setShowReport(false)} />
      )}

      {gameCompleted && !showReport && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-8 rounded-3xl text-center max-w-lg mx-4 shadow-2xl border-4 border-yellow-300 animate-pulse">
            <div className="text-8xl mb-6">🎉</div>
            <h2 className="text-4xl font-bold text-white mb-4">
              CONGRATULATIONS!
            </h2>
            <p className="text-white/95 mb-6 text-lg">
              You have successfully escaped the Placement Cell!
            </p>
            <div className="flex justify-center gap-3 mb-6">
              {["A", "B", "C"].map((key, index) => (
                <div
                  key={key}
                  className="w-16 h-16 bg-yellow-300 rounded-full flex items-center justify-center text-2xl font-bold text-yellow-800 shadow-lg animate-bounce"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  {key}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReport(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700"
              >
                📊 View Report
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("escapeRoomGameState");
                  window.location.reload();
                }}
                className="bg-white text-orange-600 px-6 py-3 rounded-xl font-bold hover:bg-orange-50"
              >
                🔄 Play Again
              </button>
            </div>
          </div>
        </div>
      )}

      {showAIAnalysis && analysisData && (
        <AIAnalysis
          analysis={analysisData}
          testType={showAIAnalysis}
          onClose={() => {
            setShowAIAnalysis(null);
            setAnalysisData(null);
          }}
        />
      )}

      {showComprehensiveAnalysis && comprehensiveAnalysisData && (
        <ComprehensiveAnalysis
          analysis={comprehensiveAnalysisData}
          onClose={() => {
            setShowComprehensiveAnalysis(false);
            setComprehensiveAnalysisData(null);
            if (comprehensiveAnalysisData.completedTests < 3) {
              localStorage.removeItem("escapeRoomGameState");
              window.location.reload();
            }
          }}
        />
      )}

      {testFailed && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-red-400 via-red-500 to-red-600 p-8 rounded-3xl text-center max-w-lg mx-4 shadow-2xl border-4 border-red-300 animate-pulse">
            <div className="text-8xl mb-6">❌</div>
            <h2 className="text-4xl font-bold text-white mb-4">TEST FAILED!</h2>
            <p className="text-white/95 mb-6 text-lg">
              You didn't pass the test. Better luck next time!
            </p>
            <button
              onClick={() => {
                localStorage.removeItem("escapeRoomGameState");
                setCurrentRoom(1);
                setKeysCollected({ keyA: false, keyB: false, keyC: false });
                setRoomsCompleted({
                  classroom: false,
                  codingLab: false,
                  interviewRoom: false,
                });
                setScores({ aptitude: null, coding: null, interview: null });
                setTestFailed(false);
                setShowUI(null);
                setGameCompleted(false);
                setShowReport(false);
                setShowAIAnalysis(null);
                setAnalysisData(null);
                setShowComprehensiveAnalysis(false);
                setComprehensiveAnalysisData(null);
                setTestData({ aptitude: null, coding: null, interview: null });
              }}
              className="bg-white text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-50"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div
      className={`w-full h-screen bg-gradient-to-b ${getRoomTheme()} relative overflow-hidden`}
    >
      {stage === "door" && renderDoorScene()}
      {stage === "unlock" && renderUnlockScene()}
      {stage === "intro" && renderIntroSlide()}
      {stage === "classroom" && renderClassroom()}
    </div>
  );
};

const KeyDisplay = ({ keyName, collected, theme }) => {
  const getThemeColors = () => {
    switch (theme) {
      case "blue":
        return collected
          ? "bg-blue-500 border-blue-400 text-white shadow-blue-500/50"
          : "bg-gray-700 border-gray-600 text-gray-400";
      case "green":
        return collected
          ? "bg-green-500 border-green-400 text-white shadow-green-500/50"
          : "bg-gray-700 border-gray-600 text-gray-400";
      case "purple":
        return collected
          ? "bg-purple-500 border-purple-400 text-white shadow-purple-500/50"
          : "bg-gray-700 border-gray-600 text-gray-400";
      default:
        return "bg-gray-700 border-gray-600 text-gray-400";
    }
  };

  return (
    <div
      className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-lg font-bold transition-all duration-500 ${getThemeColors()} ${collected ? "animate-pulse shadow-lg" : ""}`}
    >
      {keyName}
    </div>
  );
};

export default Game;
