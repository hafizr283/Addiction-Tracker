"use client";

import { useState, useRef, useEffect } from "react";
import { Relapse } from "@/hooks/useRelapses";
import { Urge } from "@/hooks/useUrges";
import { Mood } from "@/hooks/useMoods";
import { analyzeData, fmtDuration } from "@/utils/analysis";

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

// (Removed static getAiResponse to rely entirely on Gemini via API)

export default function AiOverview({ relapses, urges, moods, userCreatedAt }: AiOverviewProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const analysis = analyzeData(relapses, urges, moods, userCreatedAt);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleChat = async () => {
    const q = chatInput.trim();
    if (!q || isAiLoading) return;

    const userMsg: ChatMessage = { role: "user", text: q };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsAiLoading(true);

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          stats: analysis,
          chatHistory: chatMessages
        })
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      setChatMessages(prev => [...prev, { role: "ai", text: data.response }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: "ai", text: `⚠️ Error connecting to Gemini: ${err.message}` }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Derive styling colors based on strict risks
  const isDanger = analysis.riskLevel === "High Risk" || analysis.riskLevel === "Risk";
  const riskColor = isDanger ? "#ef4444" : analysis.riskLevel === "Low Risk" ? "#eab308" : analysis.riskLevel === "OK" ? "#22c55e" : analysis.riskLevel === "Better" ? "#3b82f6" : "#a855f7";
  const riskBg = isDanger ? "rgba(239,68,68,0.08)" : analysis.riskLevel === "Low Risk" ? "rgba(234,179,8,0.08)" : "rgba(34,197,94,0.08)";
  const riskBorder = isDanger ? "rgba(239,68,68,0.25)" : analysis.riskLevel === "Low Risk" ? "rgba(234,179,8,0.25)" : "rgba(34,197,94,0.25)";

  const prodColor = analysis.productivityScore >= 70 ? "#22c55e" : analysis.productivityScore >= 30 ? "#eab308" : "#ef4444";
  const confColor = analysis.confidenceScore >= 100 ? "#22c55e" : analysis.confidenceScore >= 50 ? "#eab308" : "#ef4444";

  // Savage dynamic overview message
  let overviewMessage = "";
  if (analysis.relapsesToday > 0) {
    const isWorst = analysis.relapsesToday >= analysis.maxRelapsesInOneDay;
    overviewMessage = `${analysis.riskIcon} ${analysis.riskLevel} | Productivity: ${analysis.productivityScore.toFixed(1)}% | Confidence: ${analysis.confidenceScore.toFixed(1)}% — You failed ${analysis.relapsesToday} time(s) today. ${isWorst ? "This is your WORST DAY in the data." : ""} Shut down your phone and laptop RIGHT NOW. You have zero discipline left. Survive the next hour without crying about it.`;
  } else if (analysis.currentDays < 10) {
    const pTarget = ((analysis.nextTargetDays / 90) * 100).toFixed(1);
    const cTarget = (Math.min(100, (analysis.nextTargetDays / 10) * 100)).toFixed(1);
    overviewMessage = `If you manage to survive ${analysis.nextTargetDays} days, your Productivity will rise to ${pTarget}%, and Confidence to ${cTarget}%. That is your ONLY target right now. Hit ${analysis.nextTargetDays} days to get to "${analysis.nextTargetRisk}". You currently sit at Productivity ${analysis.productivityScore.toFixed(1)}%. Stop being weak.`;
  } else if (analysis.currentDays < analysis.bestDays) {
    const daysToRecord = Math.ceil(analysis.bestDays - analysis.currentDays);
    const pAtRecord = ((analysis.bestDays / 90) * 100).toFixed(1);
    overviewMessage = `Your absolute best was ${analysis.bestDays.toFixed(1)} days. You threw it away. You need exactly ${daysToRecord} more days to beat it, which will push your Productivity to ${pAtRecord}%. Until then, you are just recovering lost ground. Stop celebrating mediocrity and hit your record.`;
  } else if (analysis.currentDays < 90) {
    const daysTo90 = Math.ceil(90 - analysis.currentDays);
    overviewMessage = `You passed your old records. Good. But the job isn't done. You have ${daysTo90} days left to reach the 90-day 100% OK milestone. At 90 days, your Productivity will be 100%. Don't ruin it now by thinking you are "cured". Keep pushing.`;
  } else {
    overviewMessage = `✅ You hit 90+ days. 100% Productivity. 100% Confidence. You conquered your worst self. Keep the standard here. Do not look back at the filth you left behind.`;
  }

  return (
    <div className="page ai-overview-page active">
      <div className="section-title">🧠 AI Overview</div>

      {/* === Score Cards === */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        {/* Productivity */}
        <div className="stat-card" style={{ textAlign: "center", padding: "20px 12px", border: `1px solid ${prodColor}30`, background: `${prodColor}08` }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Productivity</div>
          <div style={{ fontSize: "36px", fontWeight: 800, color: prodColor, lineHeight: 1 }}>{analysis.productivityScore.toFixed(1)}<span style={{ fontSize: "16px" }}>%</span></div>
        </div>

        {/* Confidence */}
        <div className="stat-card" style={{ textAlign: "center", padding: "20px 12px", border: `1px solid ${confColor}30`, background: `${confColor}08` }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Confidence</div>
          <div style={{ fontSize: "36px", fontWeight: 800, color: confColor, lineHeight: 1 }}>{analysis.confidenceScore.toFixed(0)}<span style={{ fontSize: "16px" }}>%</span></div>
        </div>

        {/* Risk Level */}
        <div className="stat-card" style={{ textAlign: "center", padding: "20px 12px", border: `1px solid ${riskBorder}`, background: riskBg }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Risk Level</div>
          <div style={{ fontSize: "28px", marginBottom: "2px" }}>{analysis.riskIcon}</div>
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

      {/* === Risk Reason Detail (removed as we use auto-assessment only now) === */}
      <div style={{ padding: "0" }}></div>

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
              Powered by <strong>Gemini 2.5 Flash</strong>.<br/>I know everything about your streak.<br/>Ask me anything and prepare for the truth.
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
          {isAiLoading && (
            <div style={{ alignSelf: "flex-start", opacity: 0.5, fontSize: "13px", color: "#e2e8f0" }}>
              AI is typing...
            </div>
          )}
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
            placeholder={isAiLoading ? "AI is typing..." : "Talk to Savage AI..."}
            disabled={isAiLoading}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "12px",
              border: "1px solid rgba(139,92,246,0.2)",
              background: "rgba(255,255,255,0.03)",
              color: "#e2e8f0",
              fontSize: "13px",
              outline: "none",
              opacity: isAiLoading ? 0.6 : 1,
            }}
          />
          <button
            onClick={handleChat}
            disabled={isAiLoading}
            style={{
              padding: "10px 18px",
              borderRadius: "12px",
              border: "none",
              background: isAiLoading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              color: isAiLoading ? "rgba(255,255,255,0.3)" : "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: isAiLoading ? "not-allowed" : "pointer",
            }}
          >
            {isAiLoading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
