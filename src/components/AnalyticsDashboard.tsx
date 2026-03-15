"use client";

import { Relapse } from "@/hooks/useRelapses";
import { Urge } from "@/hooks/useUrges";
import { Mood } from "@/hooks/useMoods";

function getTimeOfDay(dateStr: string) {
  const h = new Date(dateStr).getHours();
  if (h >= 0 && h < 5) return { label: '🌑 Deep Night (12-5 AM)', key: 'deep_night' };
  if (h >= 5 && h < 9) return { label: '🌅 Early Morning (5-9 AM)', key: 'morning' };
  if (h >= 9 && h < 12) return { label: '☀️ Late Morning (9-12 PM)', key: 'late_morning' };
  if (h >= 12 && h < 17) return { label: '🌤️ Afternoon (12-5 PM)', key: 'afternoon' };
  if (h >= 17 && h < 21) return { label: '🌆 Evening (5-9 PM)', key: 'evening' };
  return { label: '🌙 Late Night (9-12 AM)', key: 'late_night' };
}

interface AnalyticsDashboardProps {
  relapses: Relapse[];
  urges: Urge[];
  moods: Mood[];
}

export default function AnalyticsDashboard({ relapses, urges, moods }: AnalyticsDashboardProps) {
  const getStreaks = () => {
    if (relapses.length === 0) return [];
    const sorted = [...relapses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const streaks = [];
    for (let i = 1; i < sorted.length; i++) {
        const gap = new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime();
        streaks.push(gap / (1000 * 60 * 60 * 24)); // in days
    }
    return streaks;
  };

  const streaks = getStreaks();
  const lastRelapseDate = relapses.length > 0 ? new Date(relapses[0].date) : null;
  const currentDays = lastRelapseDate ? Math.max(0, new Date().getTime() - lastRelapseDate.getTime()) / 86400000 : 0;
  const total = relapses.length;

  const best = streaks.length > 0 ? Math.max(...streaks) : 0;
  const worst = streaks.length > 0 ? Math.min(...streaks) : 0;
  const avg = streaks.length > 0 ? streaks.reduce((a, b) => a + b, 0) / streaks.length : 0;
  const median = streaks.length > 0 ? [...streaks].sort((a, b) => a - b)[Math.floor(streaks.length / 2)] : 0;

  function fmtDays(d: number) {
    if (d >= 1) return Math.floor(d) + 'd ' + Math.floor((d % 1) * 24) + 'h';
    return Math.floor(d * 24) + 'h ' + Math.floor((d * 24 % 1) * 60) + 'm';
  }

  // Time distribution
  const timeMap: Record<string, number> = {};
  relapses.forEach(r => {
      const tod = getTimeOfDay(r.date);
      timeMap[tod.label] = (timeMap[tod.label] || 0) + 1;
  });
  const maxTime = Math.max(...Object.values(timeMap), 1);
  const colors = ['#8b5cf6', '#3b82f6', '#22c55e', '#fbbf24', '#f97316', '#ef4444'];
  const timeDistData = Object.entries(timeMap).sort((a, b) => b[1] - a[1]);

  // Type distribution
  const typeMap: Record<string, number> = {};
  relapses.forEach(r => { typeMap[r.type] = (typeMap[r.type] || 0) + 1; });
  const maxType = Math.max(...Object.values(typeMap), 1);
  const typeColors: Record<string, string> = { 'Porn + Masturbation': '#ef4444', 'Light Porn + Masturbation': '#fbbf24', 'Only Masturbation': '#3b82f6', 'Only Porn': '#8b5cf6' };
  const typeDistData = Object.entries(typeMap).sort((a, b) => b[1] - a[1]);

  // Monthly trend
  const monthMap: Record<string, number> = {};
  relapses.forEach(r => {
      const d = new Date(r.date);
      const key = d.toLocaleString('en-US', { year: 'numeric', month: 'short' });
      monthMap[key] = (monthMap[key] || 0) + 1;
  });
  const maxMonth = Math.max(...Object.values(monthMap), 1);
  const monthlyTrendData = Object.entries(monthMap);

  // 24H Heatmap logic
  const sortedForFreq = [...relapses].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let maxFreq = 0;
  let maxFreqWindow: { start: Date | null, end: Date | null, events: Relapse[] } = { start: null, end: null, events: [] };
  for (let i = 0; i < sortedForFreq.length; i++) {
      const windowStart = new Date(sortedForFreq[i].date);
      const windowEnd = new Date(windowStart.getTime() + 24*3600*1000);
      const inWindow = sortedForFreq.filter(r => {
          const d = new Date(r.date);
          return d >= windowStart && d < windowEnd;
      });
      if (inWindow.length > maxFreq) {
          maxFreq = inWindow.length;
          maxFreqWindow = { start: windowStart, end: windowEnd, events: inWindow };
      }
  }

  let avgPerDay = 0;
  if (sortedForFreq.length >= 2) {
      const totalSpanDays = (new Date(sortedForFreq[sortedForFreq.length-1].date).getTime() - new Date(sortedForFreq[0].date).getTime()) / 86400000;
      avgPerDay = totalSpanDays > 0 ? sortedForFreq.length / totalSpanDays : 0;
  }

  const hourBuckets = new Array(24).fill(0);
  relapses.forEach(r => {
      const h = new Date(r.date).getHours();
      hourBuckets[h]++;
  });
  const maxHourCount = Math.max(...hourBuckets, 1);
  const worstDay = maxFreqWindow.start ? maxFreqWindow.start.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : 'N/A';
  const worstEvents = maxFreqWindow.events.map(r => new Date(r.date).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})).join(', ');
  return (
    <div className="page stats-page active">
      <div className="section-title">⚡ Streak Statistics</div>
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">{fmtDays(currentDays)}</div>
          <div className="stat-label">Current Streak</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon">🏆</div>
          <div className="stat-value">{fmtDays(best)}</div>
          <div className="stat-label">Best Streak</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{fmtDays(avg)}</div>
          <div className="stat-label">Average Gap</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">📐</div>
          <div className="stat-value">{fmtDays(median)}</div>
          <div className="stat-label">Median Gap</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">⚡</div>
          <div className="stat-value">{fmtDays(worst)}</div>
          <div className="stat-label">Shortest Gap</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total Relapses</div>
        </div>
        <div className="stat-card" style={{ border: "1px solid rgba(34, 197, 94, 0.3)", background: "rgba(34, 197, 94, 0.05)" }}>
          <div className="stat-icon">🌊</div>
          <div className="stat-value" style={{ color: "var(--green)" }}>{urges?.length || 0}</div>
          <div className="stat-label">Urges Survived</div>
        </div>
      </div>

      <div className="section-title">🕐 Time-of-Day Distribution</div>
      <div className="dist-section">
        {timeDistData.map(([label, count], i) => (
          <div className="dist-row" key={label}>
            <div className="dist-label">{label}</div>
            <div className="dist-bar-bg">
              <div className="dist-bar-fill" style={{ width: `${(count / maxTime) * 100}%`, background: colors[i % colors.length] }}></div>
            </div>
            <div className="dist-count">{count} ({total ? Math.round((count / total) * 100) : 0}%)</div>
          </div>
        ))}
      </div>

      <div className="section-title">📅 Relapse Type Breakdown</div>
      <div className="dist-section">
        {typeDistData.map(([label, count]) => (
          <div className="dist-row" key={label}>
            <div className="dist-label">{label}</div>
            <div className="dist-bar-bg">
              <div className="dist-bar-fill" style={{ width: `${(count / maxType) * 100}%`, background: typeColors[label] || '#8b5cf6' }}></div>
            </div>
            <div className="dist-count">{count} ({total ? Math.round((count / total) * 100) : 0}%)</div>
          </div>
        ))}
      </div>

      {urges && urges.length > 0 && (
        <>
          <div className="section-title">🌊 Top Urge Triggers</div>
          <div className="dist-section">
            {Object.entries(
              urges.reduce((acc, u) => {
                const t = u.trigger_note ? u.trigger_note.trim().toLowerCase() : "Unknown";
                acc[t] = (acc[t] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            )
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5) // top 5
            .map(([label, count], idx) => {
               const maxTrigger = Math.max(...Object.values(urges.reduce((acc, u) => { const t = u.trigger_note ? u.trigger_note.trim().toLowerCase() : "Unknown"; acc[t] = (acc[t] || 0) + 1; return acc; }, {} as Record<string, number>)));
               return (
                <div className="dist-row" key={label}>
                  <div className="dist-label" style={{ textTransform: 'capitalize' }}>{label}</div>
                  <div className="dist-bar-bg">
                    <div className="dist-bar-fill" style={{ width: `${(count / maxTrigger) * 100}%`, background: '#22c55e' }}></div>
                  </div>
                  <div className="dist-count">{count}</div>
                </div>
               );
            })}
          </div>
        </>
      )}

      {moods && moods.length > 0 && relapses.length > 0 && (
        <>
          <div className="section-title">🧠 Mood Before Relapse</div>
          <div className="dist-section">
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
              Identifies the mood you logged on the same day as a relapse.
            </p>
            {Object.entries(
              relapses.reduce((acc, r) => {
                const rDateStr = new Date(r.date).toDateString();
                const precedingMood = moods.find(m => new Date(m.created_at).toDateString() === rDateStr);
                const mLabel = precedingMood ? precedingMood.mood_type : "No Mood Logged";
                acc[mLabel] = (acc[mLabel] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            )
            .sort((a, b) => b[1] - a[1])
            .map(([label, count], idx) => {
               const maxMoodCor = Math.max(...Object.values(relapses.reduce((acc, r) => { const rDateStr = new Date(r.date).toDateString(); const precedingMood = moods.find(m => new Date(m.created_at).toDateString() === rDateStr); const mLabel = precedingMood ? precedingMood.mood_type : "No Mood Logged"; acc[mLabel] = (acc[mLabel] || 0) + 1; return acc; }, {} as Record<string, number>)));
               return (
                <div className="dist-row" key={label}>
                  <div className="dist-label">{label}</div>
                  <div className="dist-bar-bg">
                    <div className="dist-bar-fill" style={{ width: `${(count / maxMoodCor) * 100}%`, background: '#ef4444' }}></div>
                  </div>
                  <div className="dist-count">{count}</div>
                </div>
               );
            })}
          </div>
        </>
      )}

      <div className="section-title">📈 Monthly Trend</div>
      <div className="dist-section">
        {monthlyTrendData.map(([label, count]) => (
          <div className="dist-row" key={label}>
            <div className="dist-label">{label}</div>
            <div className="dist-bar-bg">
              <div className="dist-bar-fill" style={{ width: `${(count / maxMonth) * 100}%`, background: 'linear-gradient(90deg,#8b5cf6,#c4b5fd)' }}></div>
            </div>
            <div className="dist-count">{count}</div>
          </div>
        ))}
      </div>

      <div className="section-title">⏱️ 24-Hour Frequency Heatmap</div>
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px", marginBottom: "20px" }}>
            <div className="stat-card red" style={{ textAlign: "center", padding: "16px" }}>
                <div className="stat-icon">🔴</div>
                <div className="stat-value" style={{ fontSize: "36px", color: "var(--red)" }}>{maxFreq}</div>
                <div className="stat-label">Max in 24 Hours</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>{worstDay}</div>
            </div>
            <div className="stat-card gold" style={{ textAlign: "center", padding: "16px" }}>
                <div className="stat-icon">📊</div>
                <div className="stat-value" style={{ fontSize: "36px", color: "var(--gold)" }}>{avgPerDay.toFixed(2)}</div>
                <div className="stat-label">Avg Per Day</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>Over entire period</div>
            </div>
        </div>
        <div style={{ marginBottom: "10px", fontSize: "12px", color: "var(--text-muted)" }}>⏰ Hourly distribution (which hour of day is most dangerous)</div>
        <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: "60px", marginBottom: "6px" }}>
            {hourBuckets.map((cnt, h) => {
                const heightPct = (cnt / maxHourCount) * 100;
                const isHigh = cnt === maxHourCount && cnt > 0;
                const color = isHigh ? '#ef4444' : (cnt > 0 ? '#8b5cf6' : 'rgba(255,255,255,0.06)');
                return <div key={h} title={`${h}:00 - ${cnt} relapse(s)`} style={{ flex: 1, height: `${Math.max(heightPct, 3)}%`, background: color, borderRadius: '3px 3px 0 0', transition: 'all 0.3s', cursor: 'default' }}></div>;
            })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
            <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>12 AM</span>
        </div>
        {maxFreqWindow.start && (
          <div style={{ marginTop: "14px", padding: "12px 14px", borderRadius: "10px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", fontSize: "12px", color: "var(--text-muted)" }}>
              🔴 <strong style={{ color: "rgba(239,68,68,0.8)" }}>Worst 24h window:</strong> {worstDay} — {maxFreq} relapses at [{worstEvents}]
          </div>
        )}
      </div>
    </div>
  );
}
