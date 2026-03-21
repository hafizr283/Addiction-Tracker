"use client";

import { useEffect, useState } from "react";
import { Relapse } from "@/hooks/useRelapses";
import { Mood } from "@/hooks/useMoods";
import UrgeLogger from "./UrgeLogger";
import MoodTracker from "./MoodTracker";
import BadgeList from "./BadgeList";

// ===== MILESTONES =====
const MILESTONES = [
  { days: 1, label: '1 Day', emoji: '⭐' },
  { days: 3, label: '3 Days', emoji: '💪' },
  { days: 7, label: '1 Week', emoji: '🔥' },
  { days: 14, label: '2 Weeks', emoji: '✨' },
  { days: 21, label: '3 Weeks', emoji: '🌟' },
  { days: 30, label: '1 Month', emoji: '👑' },
  { days: 60, label: '2 Months', emoji: '🏅' },
  { days: 90, label: '90 Days', emoji: '🏆' },
  { days: 180, label: '6 Months', emoji: '💎' },
  { days: 365, label: '1 Year', emoji: '🌈' },
];

const QUOTES = [
  "Every second you resist, you're rewiring your brain.",
  "The pain of discipline is far less than the pain of regret.",
  "You didn't come this far to only come this far.",
  "Fall seven times, stand up eight.",
  "Your future self will thank you for today's discipline.",
  "Progress, not perfection.",
  "Every urge you resist makes the next one weaker.",
  "You are not your habits. You are the one who chooses.",
  "This streak is proof — you CAN do this.",
  "Don't count the days, make the days count.",
  "Freedom is on the other side of discipline.",
  "You are stronger than your urges.",
  "Discipline is choosing between what you want now and what you want most.",
  "One day at a time. One hour at a time. One moment at a time.",
  "The strongest people are those who keep getting up.",
  "Your brain is healing. Every clean day counts.",
];

interface StreakDashboardProps {
  relapses: Relapse[];
  addUrge: (intensity: number, trigger: string) => Promise<void>;
  moods: Mood[];
  addMood: (mood: string, note: string) => Promise<void>;
  userCreatedAt?: string;
}

export default function StreakDashboard({ relapses, addUrge, moods, addMood, userCreatedAt }: StreakDashboardProps) {
  const [time, setTime] = useState({ days: 0, hrs: 0, mins: 0, secs: 0 });
  const [quoteIdx, setQuoteIdx] = useState(0);
  
  useEffect(() => {
    // Quote rotation
    const qInterval = setInterval(() => {
      setQuoteIdx(prev => (prev + 1) % QUOTES.length);
    }, 10000);
    return () => clearInterval(qInterval);
  }, []);

  useEffect(() => {
    // Time calculation
    const uInterval = setInterval(() => {
      let last: Date;
      if (relapses.length === 0) {
        if (!userCreatedAt) {
          setTime({ days: 0, hrs: 0, mins: 0, secs: 0 });
          return;
        }
        last = new Date(userCreatedAt);
      } else {
        last = new Date(relapses[0].date);
      }

      const diff = Math.max(0, new Date().getTime() - last.getTime());
      const totalSec = Math.floor(diff / 1000);
      setTime({
        days: Math.floor(totalSec / 86400),
        hrs: Math.floor((totalSec % 86400) / 3600),
        mins: Math.floor((totalSec % 3600) / 60),
        secs: totalSec % 60
      });
    }, 1000);

    return () => clearInterval(uInterval);
  }, [relapses]);

  // Derived state for styling
  const { days, hrs, mins, secs } = time;
  
  let fireEmoji = '🌱';
  if (days >= 90) fireEmoji = '🏆';
  else if (days >= 30) fireEmoji = '👑';
  else if (days >= 7) fireEmoji = '🔥';
  else if (days >= 1) fireEmoji = '⭐';

  let dcStyle = {};
  if (days >= 30) dcStyle = { background: 'linear-gradient(135deg,#fef3c7,#fbbf24,#f59e0b,#d97706)', WebkitBackgroundClip: 'text', backgroundClip: 'text'};
  else if (days >= 7) dcStyle = { background: 'linear-gradient(135deg,#dcfce7,#4ade80,#22c55e,#16a34a)', WebkitBackgroundClip: 'text', backgroundClip: 'text'};
  else dcStyle = { background: 'linear-gradient(135deg,#f0f0ff,#c4b5fd,#8b5cf6,#6d28d9)', WebkitBackgroundClip: 'text', backgroundClip: 'text'};

  const lastRelapseDate = relapses.length > 0 ? new Date(relapses[0].date) : (userCreatedAt ? new Date(userCreatedAt) : null);
  const diffFloat = lastRelapseDate ? Math.max(0, new Date().getTime() - lastRelapseDate.getTime()) / 86400000 : 0;
  
  let curM = { days: 0, label: 'Start', emoji: '🌱' }, nxtM = MILESTONES[0];
  if (relapses.length > 0) {
    for (let i = 0; i < MILESTONES.length; i++) {
        if (diffFloat >= MILESTONES[i].days) {
            curM = MILESTONES[i];
            nxtM = MILESTONES[i + 1] || { days: curM.days * 2, label: 'Beyond', emoji: '🚀' };
        } else { nxtM = MILESTONES[i]; break; }
    }
  }

  let bestStreak = 0;
  if (relapses.length > 0) {
    let currentStreakCount = diffFloat;
    bestStreak = currentStreakCount;
    for (let i = 0; i < relapses.length - 1; i++) {
        const gap = (new Date(relapses[i].date).getTime() - new Date(relapses[i+1].date).getTime()) / 86400000;
        if (gap > bestStreak) bestStreak = gap;
    }
  } else {
    // No relapses = infinite best streak, but let's just use diffFloat since day 1
    bestStreak = diffFloat;
  }

  const prog = relapses.length === 0 ? 0 : ((diffFloat - curM.days) / (nxtM.days - curM.days)) * 100;
  return (
    <div className="page streak-page active">
      <div className="streak-label">Current Streak</div>
      <div className="fire">{fireEmoji}</div>
      <div className="days-count" style={dcStyle}>{days}</div>
      <div className="days-suffix">Days Free</div>

      <div className="time-grid">
        <div className="time-box">
          <div className="time-value">{String(hrs).padStart(2, '0')}</div>
          <div className="time-unit">Hours</div>
        </div>
        <div className="time-box">
          <div className="time-value">{String(mins).padStart(2, '0')}</div>
          <div className="time-unit">Minutes</div>
        </div>
        <div className="time-box">
          <div className="time-value">{String(secs).padStart(2, '0')}</div>
          <div className="time-unit">Seconds</div>
        </div>
      </div>

      <div className="milestone-section">
        <div className="milestone-bar-bg">
          <div className="milestone-bar-fill" style={{ width: `${Math.min(prog, 100)}%` }}></div>
        </div>
        <div className="milestone-text">
          <span>{curM.emoji} {curM.label} achieved</span>
          <span className="milestone-next">Next: {nxtM.label} {nxtM.emoji}</span>
        </div>
      </div>

      <div className="quote">"{QUOTES[quoteIdx]}"</div>
      <div className="start-info" style={{ marginBottom: "40px" }}>
        {lastRelapseDate ? `Streak started: ${lastRelapseDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'No relapses recorded yet'}
      </div>

      <div className="widgets-container">
        <MoodTracker moods={moods} onAdd={addMood} />
        <UrgeLogger onAdd={addUrge} />
      </div>

      <div style={{ marginTop: "2rem" }}>
         <BadgeList currentStreak={days} bestStreak={Math.floor(bestStreak)} />
      </div>
    </div>
  );
}
