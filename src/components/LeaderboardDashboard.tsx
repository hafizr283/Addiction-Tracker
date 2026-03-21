"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/utils/supabase/client";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  currentStreak: number;
  bestStreak: number;
  joinedDaysAgo: number;
  isCustomName: boolean;
}

interface UserProfile {
  display_name: string;
}

export default function LeaderboardDashboard() {
  const { user } = useAuth();
  const supabase = createClient();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [editingName, setEditingName] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      if (data.leaderboard) setEntries(data.leaderboard);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setDisplayName(data.profile.display_name);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  }, [user, supabase.auth]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchLeaderboard(), fetchProfile()]);
      setLoading(false);
    };
    load();
  }, [fetchLeaderboard, fetchProfile]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (displayName.trim().length < 2) {
      setMsg({ text: "Name must be at least 2 characters.", type: "error" });
      return;
    }

    setSaving(true);
    setMsg({ text: "", type: "" });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ displayName: displayName.trim(), showOnLeaderboard: true }),
      });
      const data = await res.json();
      if (data.error) {
        setMsg({ text: data.error, type: "error" });
      } else {
        setProfile(data.profile);
        setMsg({ text: "Name updated! 🎉", type: "success" });
        setEditingName(false);
        await fetchLeaderboard();
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Find current user's entry
  const myEntry = entries.find(e => e.userId === user?.id);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { emoji: "🥇", color: "#fbbf24" };
    if (rank === 2) return { emoji: "🥈", color: "#cbd5e1" };
    if (rank === 3) return { emoji: "🥉", color: "#f97316" };
    return { emoji: `#${rank}`, color: "var(--text-muted)" };
  };

  const fmtDays = (d: number) => {
    if (d >= 365) return `${Math.floor(d / 365)}y ${d % 365}d`;
    return `${d}d`;
  };

  if (loading) {
    return (
      <div className="leaderboard-page page active">
        <div className="section-title">🏆 Leaderboard</div>
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }} className="animate-pulse">🏆</div>
          <div>Loading rankings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page page active">
      <div className="section-title">🏆 Leaderboard</div>

      {/* My Rank Card */}
      {myEntry && (
        <div className="lb-my-rank-card">
          <div className="lb-my-rank-header">
            <div>
              <div className="lb-my-rank-label">YOUR RANK</div>
              <div className="lb-my-rank-number" style={{ color: getRankStyle(myEntry.rank).color }}>
                {getRankStyle(myEntry.rank).emoji}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="lb-my-rank-label">CURRENT STREAK</div>
              <div className="lb-my-rank-streak">{fmtDays(myEntry.currentStreak)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="lb-my-rank-label">BEST STREAK</div>
              <div className="lb-my-rank-best">{fmtDays(myEntry.bestStreak)}</div>
            </div>
          </div>
          <div className="lb-my-name-row">
            <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
              Showing as: <strong style={{ color: "var(--text-primary)" }}>{myEntry.displayName}</strong>
            </span>
            <button
              className="lb-edit-name-btn"
              onClick={() => setEditingName(!editingName)}
            >
              {editingName ? "Cancel" : "✏️ Change Name"}
            </button>
          </div>
          {editingName && (
            <form onSubmit={handleSaveName} className="lb-edit-form">
              {msg.text && (
                <div
                  className="success-msg"
                  style={{
                    background: msg.type === "error" ? "rgba(239,68,68,0.1)" : "",
                    color: msg.type === "error" ? "var(--red)" : "",
                    borderColor: msg.type === "error" ? "rgba(239,68,68,0.2)" : "",
                    marginBottom: "12px",
                  }}
                >
                  {msg.text}
                </div>
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your warrior name"
                  maxLength={20}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)",
                    color: "var(--text-primary)", fontFamily: "inherit", fontSize: "14px", outline: "none",
                  }}
                />
                <button type="submit" disabled={saving} className="btn-save" style={{ padding: "10px 20px" }}>
                  {saving ? "..." : "Save"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {entries.length === 0 ? (
        <div className="empty-state" style={{ marginTop: "20px" }}>
          <div className="emoji">🏜️</div>
          <p>No warriors yet. You will be the first!</p>
        </div>
      ) : (
        <>
          {/* Podium for Top 3 */}
          {entries.length >= 3 && (
            <div className="lb-podium">
              {[entries[1], entries[0], entries[2]].map((entry) => {
                const rs = getRankStyle(entry.rank);
                const isMe = entry.userId === user?.id;
                return (
                  <div
                    key={entry.rank}
                    className={`lb-podium-card ${entry.rank === 1 ? "first" : entry.rank === 2 ? "second" : "third"} ${isMe ? "is-me" : ""}`}
                    style={{ "--rank-color": rs.color } as React.CSSProperties}
                  >
                    <div className="lb-podium-emoji">{rs.emoji}</div>
                    <div className="lb-podium-name">
                      {entry.displayName}
                      {isMe && <span className="lb-you-badge" style={{ marginLeft: "6px" }}>YOU</span>}
                    </div>
                    <div className="lb-podium-streak">{fmtDays(entry.currentStreak)}</div>
                    <div className="lb-podium-label">Current Streak</div>
                    <div className="lb-podium-best">Best: {fmtDays(entry.bestStreak)}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Remaining List */}
          <div className="lb-list">
            {entries.slice(entries.length >= 3 ? 3 : 0).map((entry) => {
              const rs = getRankStyle(entry.rank);
              const isMe = entry.userId === user?.id;
              return (
                <div key={entry.rank} className={`lb-row ${isMe ? "is-me" : ""}`}>
                  <div className="lb-rank" style={{ color: rs.color }}>{rs.emoji}</div>
                  <div className="lb-info">
                    <div className="lb-name">
                      {entry.displayName}
                      {isMe && <span className="lb-you-badge">YOU</span>}
                    </div>
                    <div className="lb-meta">
                      Best: {fmtDays(entry.bestStreak)} · Joined {entry.joinedDaysAgo}d ago
                    </div>
                  </div>
                  <div className="lb-streak-value">{fmtDays(entry.currentStreak)}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
