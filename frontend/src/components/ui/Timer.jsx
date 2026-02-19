import React from "react";
import CircularTimer from "./CircularTimer";

const Timer = ({
  timeLeft,
  formattedTime,
  totalTime = 600,
  className = "",
}) => {
  const isLowTime = timeLeft <= 60; // Less than 1 minute

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 bg-slate-900/80 backdrop-blur-sm text-white rounded-lg border border-slate-700 ${className}`}
    >
      <CircularTimer
        timeLeft={timeLeft}
        totalTime={totalTime}
        formattedTime={formattedTime}
        size={32}
      />
      <div className="flex flex-col">
        <span
          className={`font-mono text-sm font-bold ${isLowTime ? "text-red-400" : "text-white"}`}
        >
          {formattedTime}
        </span>
        {isLowTime && (
          <span className="text-xs text-red-400 animate-pulse">
            Time running out!
          </span>
        )}
      </div>
    </div>
  );
};

export default Timer;
