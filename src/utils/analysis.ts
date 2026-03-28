import { Relapse } from "@/hooks/useRelapses";
import { Urge } from "@/hooks/useUrges";
import { Mood } from "@/hooks/useMoods";

// ===== HELPER: format days/hours from ms =====
export function fmtDuration(ms: number): string {
  const totalHours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days}d ${hours}h`;
  return `${totalHours}h`;
}

// ===== CORE ANALYSIS ENGINE (SAVAGE AI RULES) =====
export function analyzeData(relapses: Relapse[], urges: Urge[], moods: Mood[], userCreatedAt?: string) {
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

  // === RISK LEVEL (Strict Days Based) ===
  const currentDays = currentStreakMs / 86400000;
  
  let riskLevel = "";
  let riskIcon = "";
  let nextTargetDays = 0;
  let nextTargetRisk = "";
  
  if (currentDays < 1) {
    riskLevel = "High Risk"; riskIcon = "🔴"; nextTargetDays = 1; nextTargetRisk = "Risk";
  } else if (currentDays < 3) {
    riskLevel = "Risk"; riskIcon = "🟠"; nextTargetDays = 3; nextTargetRisk = "Low Risk";
  } else if (currentDays < 7) {
    riskLevel = "Low Risk"; riskIcon = "🟡"; nextTargetDays = 7; nextTargetRisk = "OK";
  } else if (currentDays < 30) {
    riskLevel = "OK"; riskIcon = "🟢"; nextTargetDays = 30; nextTargetRisk = "Better";
  } else if (currentDays < 60) {
    riskLevel = "Better"; riskIcon = "🔵"; nextTargetDays = 60; nextTargetRisk = "Very Good";
  } else if (currentDays < 90) {
    riskLevel = "Very Good"; riskIcon = "💜"; nextTargetDays = 90; nextTargetRisk = "100% OK";
  } else {
    riskLevel = "100% OK"; riskIcon = "✅"; nextTargetDays = 90; nextTargetRisk = "100% OK";
  }

  // === PRODUCTIVITY SCORE & CONFIDENCE SCORE ===
  const productivityScore = Math.min(100, (currentDays / 90) * 100);
  const confidenceScore = Math.min(100, (currentDays / 10) * 100);

  // === TYPE AND TIME BREAKDOWN ===
  const typeMap: Record<string, number> = {};
  relapses.forEach(r => { typeMap[r.type] = (typeMap[r.type] || 0) + 1; });
  const dominantType = Object.entries(typeMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  const hourBuckets = new Array(24).fill(0);
  relapses.forEach(r => hourBuckets[new Date(r.date).getHours()]++);
  const dangerousHour = hourBuckets.indexOf(Math.max(...hourBuckets));
  const dangerousTimeLabel = dangerousHour >= 0 ? `${dangerousHour}:00 - ${(dangerousHour + 1) % 24}:00` : "N/A";

  // Today relapses count
  const startOfToday = new Date();
  startOfToday.setHours(0,0,0,0);
  const relapsesToday = relapses.filter(r => new Date(r.date).getTime() >= startOfToday.getTime()).length;
  
  // Find worst day count
  const dayBuckets: Record<string, number> = {};
  relapses.forEach(r => {
    const dStr = new Date(r.date).toDateString();
    dayBuckets[dStr] = (dayBuckets[dStr] || 0) + 1;
  });
  const maxRelapsesInOneDay = Object.keys(dayBuckets).length > 0 ? Math.max(...Object.values(dayBuckets)) : 0;

  return {
    currentStreakMs, bestStreakMs, avgStreakMs, previousStreakMs,
    riskLevel, riskIcon, nextTargetDays, nextTargetRisk,
    productivityScore, confidenceScore,
    recentCount, prevWeekCount, monthCount, consecutiveShortRelapses,
    dominantType, dangerousTimeLabel,
    totalRelapses: relapses.length, currentDays, bestDays: bestStreakMs / 86400000,
    relapsesToday, maxRelapsesInOneDay
  };
}
