// ============================================================================
// Calendar days in the user's timezone — pure helpers.
//
// Everything that asks "what day is it?" (streaks, deadlines, decay display)
// goes through here so a user in Asia/Jakarta at 05:00 is never credited to
// yesterday just because the server runs in UTC.
// ============================================================================

/** "YYYY-MM-DD" — a calendar day with no time or zone attached. */
export type CalendarDay = string;

export const DEFAULT_TIMEZONE = "Asia/Jakarta";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

export function isCalendarDay(value: unknown): value is CalendarDay {
  return (
    typeof value === "string" && DAY_RE.test(value) && !Number.isNaN(Date.parse(value))
  );
}

/** True when `timeZone` is an IANA name this runtime understands. */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * The calendar day of `date` as seen in `timeZone`.
 * Falls back to DEFAULT_TIMEZONE for unknown zones rather than throwing.
 */
export function calendarDay(date: Date, timeZone: string): CalendarDay {
  const zone = isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIMEZONE;
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function dayNumber(day: CalendarDay): number {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

/** Whole days from `fromDay` to `toDay` (positive when `toDay` is later). */
export function dayDiff(fromDay: CalendarDay, toDay: CalendarDay): number {
  return dayNumber(toDay) - dayNumber(fromDay);
}

/** Short Indonesian date for a calendar day, e.g. "22 Sep 2026" (year optional). */
export function formatDay(day: CalendarDay, withYear = false): string {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** `day` shifted by `days` (may be negative). */
export function addDays(day: CalendarDay, days: number): CalendarDay {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
