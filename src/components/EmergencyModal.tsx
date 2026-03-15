"use client";

import { useState, useEffect } from "react";

const QUOTES = [
  "Breathe. The urge will pass. Your regret will last.",
  "You didn't come this far to only come this far.",
  "This is the moment where you actually grow stronger.",
  "Pain of discipline > Pain of regret.",
  "Your brain is lying to you right now. Don't listen.",
  "Every time you resist, the neural pathway gets weaker."
];

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmergencyModal({ isOpen, onClose }: EmergencyModalProps) {
  const [phase, setPhase] = useState<"inhale" | "hold1" | "exhale" | "hold2">("inhale");
  const [timer, setTimer] = useState(4);
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    setQuoteIdx(Math.floor(Math.random() * QUOTES.length));
    setPhase("inhale");
    setTimer(4);

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev > 1) return prev - 1;
        
        // Switch phases
        setPhase((cp) => {
          if (cp === "inhale") return "hold1";
          if (cp === "hold1") return "exhale";
          if (cp === "exhale") return "hold2";
          return "inhale";
        });
        return 4; // all phases are 4 seconds in box breathing
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  let prompt = "";
  if (phase === "inhale") prompt = "Breathe In...";
  if (phase === "hold1") prompt = "Hold...";
  if (phase === "exhale") prompt = "Breathe Out...";
  if (phase === "hold2") prompt = "Hold...";

  return (
    <div className="modal-overlay active" style={{ zIndex: 1000, background: "rgba(0,0,0,0.85)" }}>
      <div className="emergency-modal">
        <h2 style={{ color: "var(--red)", marginBottom: "30px", fontSize: "24px" }}>🚨 EMERGENCY 🚨</h2>
        
        <div className="breathing-circle-container">
          <div className={`breathing-circle ${phase}`}>
            <div className="breathing-text">
              <div style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "2px", opacity: 0.8 }}>{prompt}</div>
              <div style={{ fontSize: "40px", fontWeight: "bold" }}>{timer}</div>
            </div>
          </div>
        </div>

        <div className="emergency-quote">
          "{QUOTES[quoteIdx]}"
        </div>

        <button className="btn" style={{ marginTop: "40px", background: "rgba(255,255,255,0.1)", color: "#fff", width: "100%" }} onClick={onClose}>
          I'm in control now, Close.
        </button>
      </div>
    </div>
  );
}
