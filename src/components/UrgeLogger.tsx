"use client";

import { useState } from "react";

interface UrgeLoggerProps {
  onAdd: (intensity: number, trigger: string) => Promise<void>;
}

export default function UrgeLogger({ onAdd }: UrgeLoggerProps) {
  const [intensity, setIntensity] = useState(5);
  const [trigger, setTrigger] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onAdd(intensity, trigger);
      setSuccess(true);
      setTrigger("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="widget-card urge-logger">
      <h3 className="widget-title">🌊 Survived an Urge?</h3>
      <p className="widget-subtitle">Log it to track your triggers and build resistance.</p>
      
      {success ? (
        <div className="success-msg">✅ Urge logged! You are getting stronger.</div>
      ) : (
        <div className="widget-body">
          <div className="form-group">
            <label>Intensity (1-10): <span style={{ color: "var(--accent)", fontSize: "16px" }}>{intensity}</span></label>
            <input 
              type="range" 
              min="1" max="10" 
              value={intensity} 
              onChange={e => setIntensity(Number(e.target.value))}
              className="slider"
            />
          </div>
          <div className="form-group">
            <label>What triggered it?</label>
            <input 
              type="text" 
              placeholder="e.g., Boredom, Instagram, Stress..." 
              value={trigger}
              onChange={e => setTrigger(e.target.value)}
            />
          </div>
          <button className="btn btn-save" onClick={handleSubmit} disabled={loading} style={{ width: "100%" }}>
            {loading ? "Logging..." : "Log Urge Survival"}
          </button>
        </div>
      )}
    </div>
  );
}
