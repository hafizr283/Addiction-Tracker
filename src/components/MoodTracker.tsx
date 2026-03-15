"use client";

import { useState } from "react";
import { Mood } from "@/hooks/useMoods";

interface MoodTrackerProps {
  moods: Mood[];
  onAdd: (mood: string, note: string) => Promise<void>;
}

const MOOD_OPTIONS = [
  { label: 'Happy', emoji: '😄', color: 'var(--green)' },
  { label: 'Motivated', emoji: '🔥', color: 'var(--gold)' },
  { label: 'Neutral', emoji: '😐', color: 'var(--text-secondary)' },
  { label: 'Stressed', emoji: '😫', color: 'var(--red)' },
  { label: 'Anxious', emoji: '😰', color: 'var(--accent)' },
  { label: 'Depressed', emoji: '🌧️', color: 'var(--blue)' },
];

export default function MoodTracker({ moods, onAdd }: MoodTrackerProps) {
  const [selectedMood, setSelectedMood] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNote, setShowNote] = useState(false);

  // Check if logged today by checking the latest mood's date
  const todayStr = new Date().toDateString();
  const loggedToday = moods.length > 0 && new Date(moods[0].created_at).toDateString() === todayStr;

  const handleSubmit = async () => {
    if (!selectedMood) return;
    try {
      setLoading(true);
      await onAdd(selectedMood, note);
      setSelectedMood("");
      setNote("");
      setShowNote(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loggedToday) {
    const todaysMoodObj = MOOD_OPTIONS.find(m => m.label === moods[0].mood_type) || MOOD_OPTIONS[2];
    return (
      <div className="widget-card mood-tracker">
        <h3 className="widget-title">🧠 Daily Check-in</h3>
        <div className="success-msg" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <span style={{ fontSize: '24px' }}>{todaysMoodObj.emoji}</span> You logged your mood today ({moods[0].mood_type}).
        </div>
      </div>
    );
  }

  return (
    <div className="widget-card mood-tracker">
      <h3 className="widget-title">🧠 Daily Check-in</h3>
      <p className="widget-subtitle">How are you feeling today?</p>
      
      {!showNote ? (
        <div className="mood-grid">
          {MOOD_OPTIONS.map((m) => (
            <button 
              key={m.label} 
              className={`mood-btn ${selectedMood === m.label ? 'active' : ''}`}
              onClick={() => { setSelectedMood(m.label); setShowNote(true); }}
              style={{ '--mood-color': m.color } as any}
            >
              <div className="mood-emoji">{m.emoji}</div>
              <div className="mood-label">{m.label}</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="widget-body">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
             <button onClick={() => setShowNote(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>⬅ Back</button>
             <span style={{ fontSize: "16px", fontWeight: "bold" }}>{MOOD_OPTIONS.find(m=>m.label===selectedMood)?.emoji} {selectedMood}</span>
          </div>
          <div className="form-group">
            <label>Notes (Optional)</label>
            <input 
              type="text" 
              placeholder="Why are you feeling this way?" 
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
          <button className="btn btn-save" onClick={handleSubmit} disabled={loading} style={{ width: "100%" }}>
            {loading ? "Saving..." : "Save Check-in"}
          </button>
        </div>
      )}
    </div>
  );
}
