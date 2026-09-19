// ============================================================================
// Streak — pure functions. A streak is the number of consecutive calendar
// days (in the user's timezone) with at least one completed evaluation.
//
//   last_active_date == today      -> no change (already counted today)
//   last_active_date == yesterday  -> streak_count + 1
//   otherwise (gap > 1 day / null) -> reset to 1
//   best_streak = max(best_streak, streak_count)
// ============================================================================
import { addDays, dayDiff, type CalendarDay } from "./date";

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

export interface WeekDay {
  day: CalendarDay;
  /** One-letter label, Monday first: S S R K J S M. */
  short: string;
  /** Full name for screen readers. */
  name: string;
  /** Part of the current streak (a completed evaluation that day). */
  active: boolean;
  isToday: boolean;
  isFuture: boolean;
}

const WEEKDAYS = [
  { short: "S", name: "Senin" },
  { short: "S", name: "Selasa" },
  { short: "R", name: "Rabu" },
  { short: "K", name: "Kamis" },
  { short: "J", name: "Jumat" },
  { short: "S", name: "Sabtu" },
  { short: "M", name: "Minggu" },
] as const;

/** 0 = Monday ... 6 = Sunday, for a calendar day. */
function mondayIndex(day: CalendarDay): number {
  const sundayFirst = new Date(`${day}T00:00:00Z`).getUTCDay();
  return (sundayFirst + 6) % 7;
}

/**
 * The current week (Monday to Sunday) for the streak strip. Only the streak
 * length and its last day are stored, so the active days are the last
 * `streakCount` days ending on `lastActiveDate` (a broken streak shows none).
 */
export function weekStrip(
  today: CalendarDay,
  lastActiveDate: CalendarDay | null,
  streakCount: number,
): WeekDay[] {
  const live = displayStreak(streakCount, lastActiveDate, today);
  const monday = addDays(today, -mondayIndex(today));
  return WEEKDAYS.map((meta, index) => {
    const day = addDays(monday, index);
    const back = lastActiveDate ? dayDiff(day, lastActiveDate) : -1;
    return {
      day,
      short: meta.short,
      name: meta.name,
      active: live > 0 && back >= 0 && back < live,
      isToday: day === today,
      isFuture: dayDiff(today, day) > 0,
    };
  });
}
