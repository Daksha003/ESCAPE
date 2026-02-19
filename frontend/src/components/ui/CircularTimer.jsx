import React from "react";

/**
 * CircularTimer - A futuristic circular countdown timer with SVG progress ring
 *
 * Features:
 * - SVG-based circular progress ring
 * - Color changes based on time percentage: >60% green, 30-60% yellow, <30% red
 * - Pulse animation when <10 seconds
 * - Keeps existing timer logic intact (timeLeft, formattedTime)
 */
const CircularTimer = ({
  timeLeft,
  totalTime = 600,
  formattedTime,
  className = "",
  showVignette = false,
}) => {
  // Calculate percentage remaining
  const percentage = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));

  // SVG circle parameters
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on percentage
  const getColor = () => {
    if (percentage > 60) return "#22c55e"; // green-500
    if (percentage > 30) return "#eab308"; // yellow-500
    return "#ef4444"; // red-500
  };

  // Check if time is critical (<10 seconds)
  const isCritical = timeLeft <= 10 && timeLeft > 0;

  // Glow effect based on color
  const color = getColor();

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      {/* SVG Circular Progress */}
      <svg
        width={size}
        height={size}
        className={`transform -rotate-90 ${isCritical ? "animate-pulse" : ""}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease",
            filter: `drop-shadow(0 0 6px ${color}80)`,
          }}
        />
      </svg>

      {/* Time Display */}
      <div
        className={`absolute inset-0 flex items-center justify-center font-mono font-bold ${isCritical ? "text-red-500 animate-pulse" : "text-white"}`}
      >
        <span className="text-sm">{formattedTime}</span>
      </div>

      {/* Vignette Effect - when time is critical */}
      {isCritical && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none animate-pulse"
          style={{
            background: `radial-gradient(circle, transparent 40%, ${color}40 100%)`,
            animation: "vignette-pulse 1s ease-in-out infinite",
          }}
        />
      )}

      <style>{`
        @keyframes vignette-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CircularTimer;
