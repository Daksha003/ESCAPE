import React, { useState, useEffect } from "react";

const SplashScreen = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Start fade out after 2.5 seconds
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2500);

    // Complete the splash screen after fade out (3 seconds total)
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        onComplete();
      }
    }, 3000);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Generate random particles
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    duration: `${3 + Math.random() * 2}s`,
    size: `${2 + Math.random() * 2}px`,
  }));

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden ${
        isFadingOut ? "animate-splash-fade-out" : "animate-splash-fade-in"
      }`}
      style={{
        background:
          "linear-gradient(135deg, #0a1929 0%, #000000 50%, #0d1b2a 100%)",
      }}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-cyan-400/3 blur-[80px]" />
      </div>

      {/* Light streak behind the cube */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[2px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent animate-light-streak" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent animate-light-streak-delay"
          style={{ transform: "translate(-50%, -50%) rotate(-15deg)" }}
        />
      </div>

      {/* Floating particles - subtle */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-cyan-400/15 animate-particle-float"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}

      {/* Cyan Glow Layers behind cube with flicker effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Outer glow - smaller subtle */}
        <div className="absolute w-[180px] h-[180px] rounded-full bg-cyan-500/20 animate-cyan-glow-flicker blur-[50px]" />
        {/* Middle glow - smaller with flicker */}
        <div className="absolute w-[140px] h-[140px] rounded-full bg-cyan-400/30 animate-cyan-glow-flicker blur-[35px]" />
        {/* Inner glow - smaller bright with secondary flicker */}
        <div className="absolute w-[100px] h-[100px] rounded-full bg-cyan-300/40 animate-cyan-glow-flicker-secondary blur-[25px]" />
        {/* Core glow - smaller very bright */}
        <div className="absolute w-[70px] h-[70px] rounded-full bg-cyan-200/50 animate-cyan-glow-flicker blur-[15px]" />
      </div>

      {/* Logo container with animations - floating + scale */}
      <div className="relative z-50 animate-logo-float">
        {/* Main logo - visible with proper sizing */}
        <img
          src="/assets/WhatsApp_Image_2026-02-16_at_10.34.21_PM-removebg-preview.png"
          alt="Escape Logo"
          className="w-40 h-40 md:w-48 md:h-48 object-contain animate-logo-scale drop-shadow-xl"
        />
      </div>

      {/* Scan line effect (subtle) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-scan-vertical" />
      </div>
    </div>
  );
};

export default SplashScreen;
