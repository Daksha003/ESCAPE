import React, { useState, useEffect, useRef } from "react";

/**
 * TypingText - A reusable component that animates text appearing letter-by-letter
 * @param {string} text - The text to display
 * @param {number} speed - Typing speed in milliseconds (default: 30)
 * @param {function} onComplete - Optional callback when typing completes
 * @param {string} className - Optional additional CSS classes
 */
const TypingText = ({ text, speed = 30, onComplete, className = "" }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const indexRef = useRef(0);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText("");
    indexRef.current = 0;
    setIsTyping(true);

    if (!text) {
      setIsTyping(false);
      return;
    }

    const timer = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText((prev) => prev + text.charAt(indexRef.current));
        indexRef.current += 1;
      } else {
        clearInterval(timer);
        setIsTyping(false);
        if (onComplete) {
          onComplete();
        }
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {isTyping && (
        <span className="inline-block w-0.5 h-[1.2em] bg-purple-600 animate-pulse ml-0.5 align-middle" />
      )}
    </span>
  );
};

export default TypingText;
