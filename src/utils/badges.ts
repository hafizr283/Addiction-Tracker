export interface Badge {
  id: string;
  name: string;
  daysRequired: number;
  icon: string;
  description: string;
  color: string;
}

export const BADGES: Badge[] = [
  {
    id: "bronze-3",
    name: "Warming Up",
    daysRequired: 3,
    icon: "🥉",
    description: "Reached 3 days! The hardest part is starting.",
    color: "#cd7f32"
  },
  {
    id: "silver-7",
    name: "One Week Clear",
    daysRequired: 7,
    icon: "🥈",
    description: "Survived an entire week. You're building momentum.",
    color: "#c0c0c0"
  },
  {
    id: "gold-14",
    name: "Fortnight Warrior",
    daysRequired: 14,
    icon: "🥇",
    description: "Two weeks clean. Habits are starting to break.",
    color: "#ffd700"
  },
  {
    id: "emerald-30",
    name: "One Month Strong",
    daysRequired: 30,
    icon: "💎",
    description: "A full month. Brain rewiring is in progress.",
    color: "#50c878"
  },
  {
    id: "amethyst-90",
    name: "Reboot Achieved",
    daysRequired: 90,
    icon: "💜",
    description: "90 Days! The standard reboot milestone.",
    color: "#9966cc"
  },
  {
    id: "diamond-365",
    name: "One Year Free",
    daysRequired: 365,
    icon: "👑",
    description: "A full year of freedom. An incredible achievement.",
    color: "#b9f2ff"
  }
];

export function getBadgesStatus(currentStreak: number, bestStreak: number) {
  return BADGES.map(badge => {
    const isUnlockedByBest = bestStreak >= badge.daysRequired;
    const isCurrentlyActive = currentStreak >= badge.daysRequired;
    // We base unlock primarily on best streak, but highlight if currently active
    return {
      ...badge,
      unlocked: isUnlockedByBest,
      active: isCurrentlyActive
    };
  });
}
