import React, { useState, useEffect } from "react";

const KeyUnlockAnimation = ({ letter, color = "yellow", onComplete }) => {
  const [stage, setStage] = useState("active");

  useEffect(() => {
    const fadeOutTimer = setTimeout(() => {
      setStage("done");
      if (onComplete) {
        onComplete();
      }
    }, 1500);

    return () => {
      clearTimeout(fadeOutTimer);
    };
  }, [onComplete]);

  if (stage === "done") {
    return null;
  }

  const getColorClasses = () => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-blue-500",
          border: "border-blue-400",
          glow: "shadow-[0_0_60px_rgba(59,130,246,0.8),0_0_100px_rgba(59,130,246,0.6)]",
          text: "text-white",
        };
      case "green":
        return {
          bg: "bg-green-500",
          border: "border-green-400",
          glow: "shadow-[0_0_60px_rgba(34,197,94,0.8),0_0_100px_rgba(34,197,94,0.6)]",
          text: "text-white",
        };
      case "purple":
        return {
          bg: "bg-purple-500",
          border: "border-purple-400",
          glow: "shadow-[0_0_60px_rgba(168,85,247,0.8),0_0_100px_rgba(168,85,247,0.6)]",
          text: "text-white",
        };
      default:
        return {
          bg: "bg-yellow-500",
          border: "border-yellow-400",
          glow: "shadow-[0_0_60px_rgba(234,179,8,0.8),0_0_100px_rgba(234,179,8,0.6)]",
          text: "text-white",
        };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative flex items-center justify-center">
        <div
          className={`absolute w-40 h-40 rounded-full ${colorClasses.bg} ${colorClasses.glow} animate-ping`}
        />
        <div
          className={`absolute w-32 h-32 rounded-full ${colorClasses.bg} ${colorClasses.glow} animate-pulse`}
        />

        <div
          className={`
            w-32 h-32 rounded-full 
            ${colorClasses.bg} ${colorClasses.border} 
            border-4 ${colorClasses.glow}
            flex items-center justify-center
            animate-key-unlock
          `}
        >
          <span className={`text-6xl font-bold ${colorClasses.text}`}>
            {letter}
          </span>
        </div>
      </div>

      <div className="absolute bottom-1/3 text-center">
        <p
          className={`text-2xl font-bold ${colorClasses.text} animate-fade-in-up`}
        >
          Key {letter} Unlocked!
        </p>
      </div>
    </div>
  );
};

export default KeyUnlockAnimation;
