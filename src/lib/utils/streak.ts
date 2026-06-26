// ============================================================================
// Streak — pure function. Updated when an attempt is successfully evaluated.
//
//   last_active_date == today      -> no change (already counted today)
//   last_active_date == yesterday  -> streak_count + 1
//   otherwise (gap > 1 day / null) -> reset to 1
//   best_streak = max(best_streak, streak_count)
//
// Dates compared as whole UTC calendar days.
// ============================================================================

export interface StreakUpdate {
  streakCount: number;
  bestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  changed: boolean;
}

function dayNumber(date: Date): number {
  return Math.floor(date.getTime() / 86_400_000);
}

export function computeStreakOnActivity(params: {
  lastActiveDate: string | null;
  currentStreak: number;
  bestStreak: number;
  today?: Date;
}): StreakUpdate {
  const today = params.today ?? new Date();
  const todayStr = today.toISOString().slice(0, 10);

  if (params.lastActiveDate) {
    const diff = dayNumber(today) - dayNumber(new Date(params.lastActiveDate));
    if (diff === 0) {
      // Already active today — leave everything as-is.
      return {
        streakCount: params.currentStreak,
        bestStreak: params.bestStreak,
        lastActiveDate: params.lastActiveDate,
        changed: false,
      };
    }
    const streakCount = diff === 1 ? params.currentStreak + 1 : 1;
    return {
      streakCount,
      bestStreak: Math.max(params.bestStreak, streakCount),
      lastActiveDate: todayStr,
      changed: true,
    };
  }

  // No prior activity — start the streak.
  return {
    streakCount: 1,
    bestStreak: Math.max(params.bestStreak, 1),
    lastActiveDate: todayStr,
    changed: true,
  };
}
