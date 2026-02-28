import React, { useState, useEffect, useMemo } from "react";

const RoomIntro = ({
  title,
  subtitle,
  accentColor = "#3b82f6",
  onComplete,
}) => {
  const [stage, setStage] = useState("fade-in"); // 'fade-in', 'stay', 'fade-out', 'done'

  // Determine room type based on accent color
  const roomType = useMemo(() => {
    if (accentColor === "#3b82f6") return "classroom";
    if (accentColor === "#06b6d4") return "codinglab";
    if (accentColor === "#a855f7") return "interview";
    return "classroom";
  }, [accentColor]);

  useEffect(() => {
    // Fade in: 0.6s
    const fadeInTimer = setTimeout(() => {
      setStage("stay");
    }, 600);

    // Stay: 1.2s
    const stayTimer = setTimeout(() => {
      setStage("fade-out");
    }, 1800); // 600 + 1200

    // Fade out: 0.6s
    const fadeOutTimer = setTimeout(() => {
      setStage("done");
      if (onComplete) {
        onComplete();
      }
    }, 2400); // 600 + 1200 + 600

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(stayTimer);
      clearTimeout(fadeOutTimer);
    };
  }, [onComplete]);

  if (stage === "done") {
    return null;
  }

  const getAnimationClass = () => {
    switch (stage) {
      case "fade-in":
        return "animate-fade-in-scale";
      case "stay":
        return "animate-stay";
      case "fade-out":
        return "animate-fade-out-scale";
      default:
        return "";
    }
  };

  // Create gradient style for text
  const titleStyle = {
    background: `linear-gradient(135deg, #ffffff 0%, ${accentColor} 100%)`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    textShadow: `0 0 40px ${accentColor}40`,
    filter: `drop-shadow(0 0 20px ${accentColor}60)`,
  };

  // =====================================================
  // CODING LAB BACKGROUND: Falling binary characters
  // Only implement animated background for CODING LAB intro
  // - Add falling binary characters ("0" and "1") only
  // - Use multiple absolutely positioned columns
  // - Animate vertically from top to bottom using translateY
  // - Very low opacity (0.05-0.08)
  // - Accent color: cyan / neon blue
  // - Random horizontal positions
  // - Random animation delays per column
  // - Slow falling speed
  // - Use CSS keyframes (fallDown)
  // - pointer-events-none
  // =====================================================
  const binaryColumns = useMemo(() => {
    if (roomType !== "codinglab") return [];
    // Create columns at fixed positions with random horizontal placement
    return Array.from({ length: 10 }, (_, colIndex) => ({
      left: `${5 + Math.random() * 85}%`,
      chars: Array.from({ length: 6 }, (_, charIndex) => ({
        char: charIndex % 2 === 0 ? "0" : "1",
        top: `${charIndex * 15}%`,
        animationDelay: `${colIndex * 0.4 + Math.random() * 2}s`,
        animationDuration: `${6 + Math.random() * 4}s`,
      })),
    }));
  }, [roomType]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: `linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(10,10,30,0.9) 50%, rgba(0,0,0,0.95) 100%)`,
      }}
    >
      {/* =====================================================
          BACKGROUND LAYER
          - Classroom and Interview: clean gradient only (no animations)
          - Coding Lab: Falling binary characters
          ===================================================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* CODING LAB: Falling Binary in columns */}
        {roomType === "codinglab" && (
          <>
            {/* Binary characters in columns - falling from top to bottom */}
            {binaryColumns.map((col, colIndex) => (
              <div
                key={colIndex}
                className="absolute"
                style={{ left: col.left, top: 0 }}
              >
                {col.chars.map((charData, charIndex) => (
                  <span
                    key={charIndex}
                    className="absolute animate-fall-down font-mono"
                    style={{
                      top: charData.top,
                      animationDelay: charData.animationDelay,
                      animationDuration: charData.animationDuration,
                      fontSize: "0.9rem",
                      color: accentColor,
                      opacity: 0.06,
                      textShadow: `0 0 6px ${accentColor}`,
                    }}
                  >
                    {charData.char}
                  </span>
                ))}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Subtle Horizontal Scan Line Effect */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ opacity: 0.15 }}
      >
        <div
          className="absolute left-0 right-0 h-px animate-scan-line"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)`,
            top: "30%",
            boxShadow: `0 0 10px ${accentColor}, 0 0 20px ${accentColor}`,
          }}
        />
      </div>

      {/* Main Content */}
      <div className={`text-center px-8 relative z-10 ${getAnimationClass()}`}>
        {/* Top Status Label */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <span
            className="text-xs tracking-[0.3em] uppercase"
            style={{ color: accentColor }}
          >
            ROOM INITIALIZING
          </span>
          <div className="flex gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full animate-blink-dot"
              style={{ backgroundColor: accentColor }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full animate-blink-dot-delay-1"
              style={{ backgroundColor: accentColor }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full animate-blink-dot-delay-2"
              style={{ backgroundColor: accentColor }}
            />
          </div>
        </div>

        {/* Room Title with gradient and glow */}
        <h1
          className="text-6xl md:text-8xl font-bold mb-6 tracking-wider animate-title-scale-in"
          style={titleStyle}
        >
          {title}
        </h1>

        {/* Subtitle / Mission Text */}
        <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto leading-relaxed mb-8">
          {subtitle}
        </p>

        {/* Sequential Pulsing Progress Dots */}
        <div className="flex justify-center gap-3">
          <div
            className="w-2 h-2 rounded-full animate-pulse-dot"
            style={{ backgroundColor: accentColor }}
          />
          <div
            className="w-2 h-2 rounded-full animate-pulse-dot-delay-1"
            style={{ backgroundColor: accentColor }}
          />
          <div
            className="w-2 h-2 rounded-full animate-pulse-dot-delay-2"
            style={{ backgroundColor: accentColor }}
          />
        </div>

        {/* Decorative accent lines */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <div
            className="h-px w-16 bg-gradient-to-r from-transparent"
            style={{ backgroundColor: accentColor }}
          />
          <div
            className="w-2 h-2 rotate-45 animate-glow-pulse"
            style={{ backgroundColor: accentColor, color: accentColor }}
          />
          <div
            className="h-px w-16 bg-gradient-to-l from-transparent"
            style={{ backgroundColor: accentColor }}
          />
        </div>
      </div>
    </div>
  );
};

export default RoomIntro;
