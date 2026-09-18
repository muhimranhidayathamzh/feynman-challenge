// ============================================================================
// Streak — pure functions. A streak is the number of consecutive calendar
// days (in the user's timezone) with at least one completed evaluation.
//
//   last_active_date == today      -> no change (already counted today)
//   last_active_date == yesterday  -> streak_count + 1
//   otherwise (gap > 1 day / null) -> reset to 1
//   best_streak = max(best_streak, streak_count)
// ============================================================================
import { dayDiff, type CalendarDay } from "./date";

export interface StreakUpdate {
  streakCount: number;
  bestStreak: number;
  lastActiveDate: CalendarDay;
  changed: boolean;
}

/** New streak values after an evaluation completed on `today`. */
export function computeStreakOnActivity(params: {
  lastActiveDate: CalendarDay | null;
  currentStreak: number;
  bestStreak: number;
  today: CalendarDay;
}): StreakUpdate {
  const { lastActiveDate, currentStreak, bestStreak, today } = params;

  if (lastActiveDate) {
    const gap = dayDiff(lastActiveDate, today);
    if (gap === 0) {
      return { streakCount: currentStreak, bestStreak, lastActiveDate, changed: false };
    }
    const streakCount = gap === 1 ? currentStreak + 1 : 1;
    return {
      streakCount,
      bestStreak: Math.max(bestStreak, streakCount),
      lastActiveDate: today,
      changed: true,
    };
  }

  return {
    streakCount: 1,
    bestStreak: Math.max(bestStreak, 1),
    lastActiveDate: today,
    changed: true,
  };
}

/**
 * What to SHOW as the current streak. The stored count is only updated on
 * activity, so a streak that was broken yesterday would otherwise keep
 * displaying its old value until the next evaluation.
 */
export function displayStreak(
  streakCount: number,
  lastActiveDate: CalendarDay | null,
  today: CalendarDay,
): number {
  if (!lastActiveDate) return 0;
  return dayDiff(lastActiveDate, today) <= 1 ? streakCount : 0;
}
