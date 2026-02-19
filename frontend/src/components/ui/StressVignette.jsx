import React from "react";

/**
 * StressVignette - A full-screen red vignette overlay for low time stress effect
 *
 * Features:
 * - Shows subtle red vignette overlay when timer < 10 seconds
 * - Smooth fade in/out transition
 * - Uses pointer-events-none to allow clicking through
 * - No external libraries
 */
const StressVignette = ({ isActive = false }) => {
  if (!isActive) return null;

  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 ease-in-out"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(239, 68, 68, 0.3) 100%)",
          animation: "vignette-pulse 1s ease-in-out infinite",
          zIndex: 50,
        }}
      />
      <style>{`
        @keyframes vignette-pulse {
          0%, 100% { 
            opacity: 0.6;
          }
          50% { 
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default StressVignette;
