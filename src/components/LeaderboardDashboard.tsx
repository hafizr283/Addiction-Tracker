"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/utils/supabase/client";

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  currentStreak: number;
  bestStreak: number;
  joinedDaysAgo: number;
}

interface UserProfile {
  display_name: string;
  show_on_leaderboard: boolean;
}

export default function LeaderboardDashboard() {
  const { user } = useAuth();
  const supabase = createClient();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

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
        setShowOnLeaderboard(data.profile.show_on_leaderboard);
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (displayName.trim().length < 2) {
      setMsg({ text: "Display name must be at least 2 characters.", type: "error" });
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
        body: JSON.stringify({ displayName: displayName.trim(), showOnLeaderboard }),
      });

      const data = await res.json();
      if (data.error) {
        setMsg({ text: data.error, type: "error" });
      } else {
        setProfile(data.profile);
        setMsg({ text: showOnLeaderboard ? "You're now on the leaderboard! 🎉" : "Profile saved.", type: "success" });
        await fetchLeaderboard();
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { emoji: "🥇", gradient: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)", color: "#fbbf24" };
    if (rank === 2) return { emoji: "🥈", gradient: "linear-gradient(135deg, #cbd5e1, #94a3b8, #64748b)", color: "#cbd5e1" };
    if (rank === 3) return { emoji: "🥉", gradient: "linear-gradient(135deg, #f97316, #ea580c, #c2410c)", color: "#f97316" };
    return { emoji: `#${rank}`, gradient: "none", color: "var(--text-muted)" };
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

      {/* Opt-in Card */}
      <div className="lb-optin-card">
        <h3 className="lb-optin-title">
          {profile?.show_on_leaderboard ? "⚙️ Your Leaderboard Settings" : "🚀 Join the Leaderboard"}
        </h3>
        {!profile?.show_on_leaderboard && (
          <p className="lb-optin-desc">
            Choose a display name and compete with others. Your email stays private.
          </p>
        )}
        <form onSubmit={handleSaveProfile}>
          {msg.text && (
            <div
              className="success-msg"
              style={{
                background: msg.type === "error" ? "rgba(239, 68, 68, 0.1)" : "",
                color: msg.type === "error" ? "var(--red)" : "",
                borderColor: msg.type === "error" ? "rgba(239, 68, 68, 0.2)" : "",
                marginBottom: "16px",
              }}
            >
              {msg.text}
            </div>
          )}
          <div className="lb-optin-fields">
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your warrior name"
                maxLength={20}
                required
              />
            </div>
            <div className="lb-toggle-group">
              <label>Show on Leaderboard</label>
              <button
                type="button"
                className={`lb-toggle ${showOnLeaderboard ? "active" : ""}`}
                onClick={() => setShowOnLeaderboard(!showOnLeaderboard)}
              >
                <span className="lb-toggle-knob" />
              </button>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-save" style={{ marginTop: "16px", width: "100%" }}>
            {saving ? "Saving..." : profile ? "Update Profile" : "Join Leaderboard"}
          </button>
        </form>
      </div>

      {/* Leaderboard Table */}
      {entries.length === 0 ? (
        <div className="empty-state" style={{ marginTop: "20px" }}>
          <div className="emoji">🏜️</div>
          <p>No one has joined the leaderboard yet. Be the first!</p>
        </div>
      ) : (
        <>
          {/* Podium for Top 3 */}
          {entries.length >= 3 && (
            <div className="lb-podium">
              {[entries[1], entries[0], entries[2]].map((entry) => {
                const rs = getRankStyle(entry.rank);
                return (
                  <div
                    key={entry.rank}
                    className={`lb-podium-card ${entry.rank === 1 ? "first" : entry.rank === 2 ? "second" : "third"}`}
                    style={{ "--rank-color": rs.color } as React.CSSProperties}
                  >
                    <div className="lb-podium-emoji">{rs.emoji}</div>
                    <div className="lb-podium-name">{entry.displayName}</div>
                    <div className="lb-podium-streak">{fmtDays(entry.currentStreak)}</div>
                    <div className="lb-podium-label">Current Streak</div>
                    <div className="lb-podium-best">Best: {fmtDays(entry.bestStreak)}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Remaining Entries */}
          <div className="lb-list">
            {entries.slice(entries.length >= 3 ? 3 : 0).map((entry) => {
              const rs = getRankStyle(entry.rank);
              const isCurrentUser = profile?.display_name === entry.displayName && profile?.show_on_leaderboard;
              return (
                <div key={entry.rank} className={`lb-row ${isCurrentUser ? "is-me" : ""}`}>
                  <div className="lb-rank" style={{ color: rs.color }}>
                    {rs.emoji}
                  </div>
                  <div className="lb-info">
                    <div className="lb-name">
                      {entry.displayName}
                      {isCurrentUser && <span className="lb-you-badge">YOU</span>}
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
