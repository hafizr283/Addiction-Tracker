"use client";

import { useState, useRef, useEffect } from "react";
import { Relapse } from "@/hooks/useRelapses";
import { Urge } from "@/hooks/useUrges";
import { Mood } from "@/hooks/useMoods";

interface AiOverviewProps {
  relapses: Relapse[];
  urges: Urge[];
  moods: Mood[];
  userCreatedAt?: string;
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

// ===== HELPER: format days/hours from ms =====
function fmtDuration(ms: number): string {
  const totalHours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days}d ${hours}h`;
  return `${totalHours}h`;
}

// ===== CORE ANALYSIS ENGINE =====
function analyzeData(relapses: Relapse[], urges: Urge[], moods: Mood[], userCreatedAt?: string) {
  const now = new Date();
  const sorted = [...relapses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // === Streaks (gaps between relapses) ===
  const streaks: number[] = []; // in ms
  for (let i = 1; i < sorted.length; i++) {
    streaks.push(new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime());
  }

  const lastRelapseDate = sorted.length > 0 ? new Date(sorted[sorted.length - 1].date) : null;
  const currentStreakMs = lastRelapseDate ? now.getTime() - lastRelapseDate.getTime() : (userCreatedAt ? now.getTime() - new Date(userCreatedAt).getTime() : 0);
  const bestStreakMs = streaks.length > 0 ? Math.max(...streaks, currentStreakMs) : currentStreakMs;
  const avgStreakMs = streaks.length > 0 ? streaks.reduce((a, b) => a + b, 0) / streaks.length : currentStreakMs;

  // Previous relapse gap (the gap that was just broken, i.e. second-to-last gap)
  const previousStreakMs = streaks.length > 0 ? streaks[streaks.length - 1] : 0;

  // === Recent trend (last 7 days vs previous 7 days) ===
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);
  const recentCount = relapses.filter(r => new Date(r.date) >= sevenDaysAgo).length;
  const prevWeekCount = relapses.filter(r => {
    const d = new Date(r.date);
    return d >= fourteenDaysAgo && d < sevenDaysAgo;
  }).length;

  // Last 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const monthCount = relapses.filter(r => new Date(r.date) >= thirtyDaysAgo).length;

  // === Consecutive short relapses (pattern detection) ===
  let consecutiveShortRelapses = 0;
  const shortThresholdMs = 2 * 86400000; // 2 days
  for (let i = streaks.length - 1; i >= 0; i--) {
    if (streaks[i] < shortThresholdMs) consecutiveShortRelapses++;
    else break;
  }

  // === RISK LEVEL ===
  let riskLevel: "OK" | "RISK" | "HIGH RISK" = "OK";
  let riskReason = "";

  if (currentStreakMs > previousStreakMs && previousStreakMs > 0) {
    riskLevel = "OK";
    riskReason = "Your current streak is longer than the last gap. You are improving. Keep going.";
  } else if (consecutiveShortRelapses >= 3) {
    riskLevel = "HIGH RISK";
    riskReason = `You have had ${consecutiveShortRelapses} consecutive short relapses (under 2 days each). This is a binge pattern. You need to go on a complete digital fast — no phone, no laptop, nothing. Just survive the next 48 hours.`;
  } else if (previousStreakMs > 0 && currentStreakMs < previousStreakMs) {
    riskLevel = "RISK";
    riskReason = "Your current streak has not exceeded your previous gap yet. Stay vigilant. The danger zone is not over.";
  } else if (recentCount >= 3) {
    riskLevel = "HIGH RISK";
    riskReason = `${recentCount} relapses in the last 7 days. This is a dangerous frequency. Consider putting all devices away and going offline for 24-48 hours.`;
  } else if (recentCount >= 1) {
    riskLevel = "RISK";
    riskReason = `${recentCount} relapse(s) in the last 7 days. You're in the recovery window — the Chaser Effect is real. Stay away from triggers.`;
  }

  // === PRODUCTIVITY SCORE (0-100) ===
  // Based on: current streak length, trend improvement, type severity
  let productivityScore = 50; // baseline

  // Current streak contribution (up to +30)
  const currentDays = currentStreakMs / 86400000;
  if (currentDays >= 30) productivityScore += 30;
  else if (currentDays >= 14) productivityScore += 25;
  else if (currentDays >= 7) productivityScore += 20;
  else if (currentDays >= 3) productivityScore += 12;
  else if (currentDays >= 1) productivityScore += 5;
  else productivityScore -= 10;

  // Trend improvement contribution (+/- 15)
  if (recentCount < prevWeekCount) productivityScore += 15;
  else if (recentCount === 0 && prevWeekCount === 0) productivityScore += 10;
  else if (recentCount > prevWeekCount) productivityScore -= 15;

  // Monthly frequency penalty
  if (monthCount >= 10) productivityScore -= 15;
  else if (monthCount >= 5) productivityScore -= 8;
  else if (monthCount <= 1) productivityScore += 5;

  productivityScore = Math.max(0, Math.min(100, productivityScore));

  // === CONFIDENCE SCORE (0-100) ===
  // Based on: best streak achieved, consistency, improvement over time
  let confidenceScore = 40;

  // Best streak contribution
  const bestDays = bestStreakMs / 86400000;
  if (bestDays >= 90) confidenceScore += 30;
  else if (bestDays >= 30) confidenceScore += 25;
  else if (bestDays >= 14) confidenceScore += 18;
  else if (bestDays >= 7) confidenceScore += 12;
  else if (bestDays >= 3) confidenceScore += 5;

  // Current vs best ratio
  const ratio = bestStreakMs > 0 ? currentStreakMs / bestStreakMs : 0;
  if (ratio >= 0.8) confidenceScore += 15;
  else if (ratio >= 0.5) confidenceScore += 8;
  else if (ratio < 0.2) confidenceScore -= 5;

  // Trend
  if (recentCount < prevWeekCount) confidenceScore += 10;
  else if (recentCount > prevWeekCount + 1) confidenceScore -= 10;

  confidenceScore = Math.max(0, Math.min(100, confidenceScore));

  // === TYPE BREAKDOWN ===
  const typeMap: Record<string, number> = {};
  relapses.forEach(r => { typeMap[r.type] = (typeMap[r.type] || 0) + 1; });
  const dominantType = Object.entries(typeMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  // === Most dangerous time ===
  const hourBuckets = new Array(24).fill(0);
  relapses.forEach(r => hourBuckets[new Date(r.date).getHours()]++);
  const dangerousHour = hourBuckets.indexOf(Math.max(...hourBuckets));
  const dangerousTimeLabel = dangerousHour >= 0 ? `${dangerousHour}:00 - ${(dangerousHour + 1) % 24}:00` : "N/A";

  return {
    currentStreakMs,
    bestStreakMs,
    avgStreakMs,
    previousStreakMs,
    riskLevel,
    riskReason,
    productivityScore,
    confidenceScore,
    recentCount,
    prevWeekCount,
    monthCount,
    consecutiveShortRelapses,
    dominantType,
    dangerousTimeLabel,
    totalRelapses: relapses.length,
    currentDays,
    bestDays,
  };
}

// ===== AI CHAT RESPONSE ENGINE =====
function getAiResponse(
  query: string,
  analysis: ReturnType<typeof analyzeData>,
  relapses: Relapse[]
): string {
  const q = query.toLowerCase();

  if (q.includes("suggestion") || q.includes("tip") || q.includes("help") || q.includes("advice") || q.includes("ki korbo") || q.includes("what should")) {
    if (analysis.riskLevel === "HIGH RISK") {
      return `🚨 You are in HIGH RISK right now. Here is my suggestion:\n\n1. Put your phone and laptop in another room immediately.\n2. Go outside — walk, run, do pushups, anything physical.\n3. Do not negotiate with the urge. The Chaser Effect is active.\n4. Your next 48 hours are critical. Survive them and the urges will drop dramatically.\n\nYour brain is lying to you right now. The dopamine spike is NOT worth losing another ${fmtDuration(analysis.previousStreakMs)} streak.`;
    } else if (analysis.riskLevel === "RISK") {
      return `⚠️ You're in the RISK zone. Stay alert.\n\n1. Keep screens to a minimum today, especially after ${analysis.dangerousTimeLabel} (your most dangerous time).\n2. Your current streak is ${fmtDuration(analysis.currentStreakMs)} — don't throw it away.\n3. Channel your energy into something productive: exercise, study, social interaction.\n4. Remember: your best streak is ${fmtDuration(analysis.bestStreakMs)}. You can beat it.`;
    } else {
      return `✅ You're doing well! Your current streak is ${fmtDuration(analysis.currentStreakMs)} and you're in the OK zone.\n\n1. Keep building momentum. Every hour counts.\n2. Stay disciplined during ${analysis.dangerousTimeLabel} — that's historically your weakest time.\n3. Your productivity score is ${analysis.productivityScore}/100. Keep pushing it higher.\n4. You've survived ${analysis.totalRelapses} relapses and you're still here. That's strength.`;
    }
  }

  if (q.includes("risk") || q.includes("danger") || q.includes("status") || q.includes("obostha") || q.includes("condition")) {
    return `📊 Current Status:\n\n• Risk Level: ${analysis.riskLevel === "HIGH RISK" ? "🔴" : analysis.riskLevel === "RISK" ? "🟡" : "🟢"} ${analysis.riskLevel}\n• Reason: ${analysis.riskReason}\n• Current Streak: ${fmtDuration(analysis.currentStreakMs)}\n• Previous Gap: ${fmtDuration(analysis.previousStreakMs)}\n• This Week: ${analysis.recentCount} relapse(s)\n• Last Week: ${analysis.prevWeekCount} relapse(s)\n\n${analysis.riskLevel !== "OK" ? "⚠️ You need to be more careful. Avoid all triggers." : "✅ Keep it up. You're on the right track."}`;
  }

  if (q.includes("score") || q.includes("productivity") || q.includes("confidence")) {
    return `📈 Your Scores:\n\n• Productivity: ${analysis.productivityScore}/100 ${analysis.productivityScore >= 70 ? "🟢" : analysis.productivityScore >= 40 ? "🟡" : "🔴"}\n• Confidence: ${analysis.confidenceScore}/100 ${analysis.confidenceScore >= 70 ? "🟢" : analysis.confidenceScore >= 40 ? "🟡" : "🔴"}\n\nProductivity is based on your current streak, weekly trend, and monthly frequency.\nConfidence is based on your best streak, consistency, and improvement over time.\n\n${analysis.productivityScore < 50 ? "Your productivity is low. Focus on surviving each day without relapse." : "Your productivity is decent. Keep the momentum going."}`;
  }

  if (q.includes("streak") || q.includes("best") || q.includes("record")) {
    return `🏆 Streak Info:\n\n• Current: ${fmtDuration(analysis.currentStreakMs)}\n• Best Ever: ${fmtDuration(analysis.bestStreakMs)}\n• Average Gap: ${fmtDuration(analysis.avgStreakMs)}\n• Previous Gap: ${fmtDuration(analysis.previousStreakMs)}\n\n${analysis.currentStreakMs >= analysis.bestStreakMs ? "🎉 You are currently at your ALL-TIME BEST! Don't break it!" : `You need ${fmtDuration(analysis.bestStreakMs - analysis.currentStreakMs)} more to beat your record.`}`;
  }

  if (q.includes("pattern") || q.includes("trigger") || q.includes("type") || q.includes("when") || q.includes("time")) {
    return `🔍 Pattern Analysis:\n\n• Most Common Type: ${analysis.dominantType}\n• Most Dangerous Time: ${analysis.dangerousTimeLabel}\n• This Month: ${analysis.monthCount} relapses\n• Consecutive Short Relapses: ${analysis.consecutiveShortRelapses}\n\n${analysis.consecutiveShortRelapses >= 2 ? "⚠️ You have a binge pattern forming. Break the cycle NOW." : "Your patterns show specific time-based triggers. Be extra careful during your danger hours."}`;
  }

  // Default response
  return `🤖 I can help you with:\n\n• "suggestion" — Get personalized advice based on your current state\n• "risk" or "status" — Check your current risk level\n• "score" — See your productivity & confidence scores\n• "streak" — Compare your streaks\n• "pattern" — Analyze your relapse patterns\n\nJust type any of these keywords and I'll analyze your data!`;
}

export default function AiOverview({ relapses, urges, moods, userCreatedAt }: AiOverviewProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const analysis = analyzeData(relapses, urges, moods, userCreatedAt);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleChat = () => {
    const q = chatInput.trim();
    if (!q) return;

    const userMsg: ChatMessage = { role: "user", text: q };
    const aiResponse = getAiResponse(q, analysis, relapses);
    const aiMsg: ChatMessage = { role: "ai", text: aiResponse };

    setChatMessages(prev => [...prev, userMsg, aiMsg]);
    setChatInput("");
  };

  const riskColor = analysis.riskLevel === "HIGH RISK" ? "#ef4444" : analysis.riskLevel === "RISK" ? "#fbbf24" : "#22c55e";
  const riskBg = analysis.riskLevel === "HIGH RISK" ? "rgba(239,68,68,0.08)" : analysis.riskLevel === "RISK" ? "rgba(251,191,36,0.08)" : "rgba(34,197,94,0.08)";
  const riskBorder = analysis.riskLevel === "HIGH RISK" ? "rgba(239,68,68,0.25)" : analysis.riskLevel === "RISK" ? "rgba(251,191,36,0.25)" : "rgba(34,197,94,0.25)";
  const riskIcon = analysis.riskLevel === "HIGH RISK" ? "🔴" : analysis.riskLevel === "RISK" ? "🟡" : "🟢";

  const prodColor = analysis.productivityScore >= 70 ? "#22c55e" : analysis.productivityScore >= 40 ? "#fbbf24" : "#ef4444";
  const confColor = analysis.confidenceScore >= 70 ? "#22c55e" : analysis.confidenceScore >= 40 ? "#fbbf24" : "#ef4444";

  // Auto overview message
  let overviewMessage = "";
  if (analysis.riskLevel === "HIGH RISK") {
    overviewMessage = `🚨 CRITICAL: Your situation is dangerous. ${analysis.riskReason} Your productivity is at ${analysis.productivityScore}/100. You MUST take immediate action — go completely offline and remove all devices from your environment.`;
  } else if (analysis.riskLevel === "RISK") {
    overviewMessage = `⚠️ CAUTION: ${analysis.riskReason} Your productivity score is ${analysis.productivityScore}/100 and confidence is ${analysis.confidenceScore}/100. Stay disciplined and avoid your trigger times around ${analysis.dangerousTimeLabel}.`;
  } else {
    overviewMessage = `✅ GOOD: You're in a stable state. Current streak: ${fmtDuration(analysis.currentStreakMs)}. Productivity: ${analysis.productivityScore}/100, Confidence: ${analysis.confidenceScore}/100. Keep building momentum. Your best streak is ${fmtDuration(analysis.bestStreakMs)} — ${analysis.currentStreakMs >= analysis.bestStreakMs ? "you're at your best right now!" : "keep pushing to beat it."}`;
  }

  return (
    <div className="page ai-overview-page active">
      <div className="section-title">🧠 AI Overview</div>

      {/* === Score Cards === */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        {/* Productivity */}
        <div className="stat-card" style={{ textAlign: "center", padding: "20px 12px", border: `1px solid ${prodColor}30`, background: `${prodColor}08` }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Productivity</div>
          <div style={{ fontSize: "36px", fontWeight: 800, color: prodColor, lineHeight: 1 }}>{analysis.productivityScore}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>/100</div>
        </div>

        {/* Confidence */}
        <div className="stat-card" style={{ textAlign: "center", padding: "20px 12px", border: `1px solid ${confColor}30`, background: `${confColor}08` }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Confidence</div>
          <div style={{ fontSize: "36px", fontWeight: 800, color: confColor, lineHeight: 1 }}>{analysis.confidenceScore}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>/100</div>
        </div>

        {/* Risk Level */}
        <div className="stat-card" style={{ textAlign: "center", padding: "20px 12px", border: `1px solid ${riskBorder}`, background: riskBg }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Risk Level</div>
          <div style={{ fontSize: "28px", marginBottom: "2px" }}>{riskIcon}</div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: riskColor }}>{analysis.riskLevel}</div>
        </div>
      </div>

      {/* === Auto AI Overview Message === */}
      <div style={{
        padding: "20px",
        borderRadius: "16px",
        background: riskBg,
        border: `1px solid ${riskBorder}`,
        marginBottom: "24px",
      }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: riskColor, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
          AI Assessment
        </div>
        <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.7, color: "var(--text-secondary, #cbd5e1)" }}>
          {overviewMessage}
        </p>
      </div>

      {/* === Quick Stats Row === */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
        <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Current Streak</div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#c4b5fd", marginTop: "4px" }}>{fmtDuration(analysis.currentStreakMs)}</div>
        </div>
        <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Best Streak</div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#fbbf24", marginTop: "4px" }}>{fmtDuration(analysis.bestStreakMs)}</div>
        </div>
        <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>This Week</div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#ef4444", marginTop: "4px" }}>{analysis.recentCount} relapses</div>
        </div>
        <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Most Dangerous</div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#22c55e", marginTop: "4px" }}>{analysis.dangerousTimeLabel}</div>
        </div>
      </div>

      {/* === Risk Reason Detail === */}
      {analysis.riskReason && (
        <div style={{
          padding: "16px",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          marginBottom: "24px",
        }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>📋 Risk Analysis</div>
          <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, color: "var(--text-secondary, #94a3b8)" }}>
            {analysis.riskReason}
          </p>
        </div>
      )}

      {/* === Chat Section === */}
      <div className="section-title">💬 Ask AI</div>
      <div style={{
        borderRadius: "16px",
        border: "1px solid rgba(139,92,246,0.15)",
        background: "rgba(139,92,246,0.04)",
        overflow: "hidden",
      }}>
        {/* Chat Messages */}
        <div style={{
          maxHeight: "300px",
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}>
          {chatMessages.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 16px", color: "var(--text-muted)", fontSize: "13px" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>🤖</div>
              Ask me about your <strong>risk</strong>, <strong>scores</strong>, <strong>suggestions</strong>, <strong>streaks</strong>, or <strong>patterns</strong>.
            </div>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              padding: "10px 14px",
              borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: msg.role === "user" ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.05)",
              border: msg.role === "user" ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(255,255,255,0.08)",
              fontSize: "13px",
              lineHeight: 1.6,
              color: "#e2e8f0",
              whiteSpace: "pre-line",
            }}>
              {msg.text}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div style={{
          display: "flex",
          gap: "8px",
          padding: "12px 16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.2)",
        }}>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleChat()}
            placeholder="Ask about risk, scores, suggestions..."
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "12px",
              border: "1px solid rgba(139,92,246,0.2)",
              background: "rgba(255,255,255,0.03)",
              color: "#e2e8f0",
              fontSize: "13px",
              outline: "none",
            }}
          />
          <button
            onClick={handleChat}
            style={{
              padding: "10px 18px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
