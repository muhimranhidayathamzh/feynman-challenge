// ============================================================================
// Deadline system — pure functions. Gentle accountability per master spec §6.5.
//
// A deadline is a calendar day in the user's timezone. Missing it does not
// punish: the effective deadline silently becomes deadline + AUTO_EXTEND_DAYS.
// That extension is DERIVED here on every read; nothing is written back.
// ============================================================================
import { addDays, dayDiff, type CalendarDay } from "./date";

export const AUTO_EXTEND_DAYS = 2;

export type DeadlineStatus =
  | "none"
  | "upcoming"
  | "due_soon"
  | "due_today"
  | "overdue" // original day passed; inside the automatic +2-day grace
  | "extended_overdue"; // grace passed too

export interface DeadlineInfo {
  status: DeadlineStatus;
  /** The day that currently counts (original, or original + grace). */
  effectiveDate: CalendarDay | null;
  /** Days from today to effectiveDate (negative = past). */
  daysUntil: number | null;
  nudge: string | null;
  isExtended: boolean;
}

export const NO_DEADLINE: DeadlineInfo = {
  status: "none",
  effectiveDate: null,
  daysUntil: null,
  nudge: null,
  isExtended: false,
};

/** Deadline status + a supportive nudge, given the user's current day. */
export function getDeadlineInfo(
  deadline: CalendarDay | null,
  today: CalendarDay,
): DeadlineInfo {
  if (!deadline) return NO_DEADLINE;

  const days = dayDiff(today, deadline);

  if (days >= 0) {
    if (days === 0) {
      return {
        status: "due_today",
        effectiveDate: deadline,
        daysUntil: 0,
        nudge: "Hari ini! Kamu pasti bisa 💪",
        isExtended: false,
      };
    }
    if (days === 1) {
      return {
        status: "due_soon",
        effectiveDate: deadline,
        daysUntil: 1,
        nudge: "Besok! Sudah siap? 🎙️",
        isExtended: false,
      };
    }
    if (days <= 3) {
      return {
        status: "due_soon",
        effectiveDate: deadline,
        daysUntil: days,
        nudge: `${days} hari lagi ⏰`,
        isExtended: false,
      };
    }
    return {
      status: "upcoming",
      effectiveDate: deadline,
      daysUntil: days,
      nudge: null,
      isExtended: false,
    };
  }

  // Original day has passed: grace period applies automatically.
  const extended = addDays(deadline, AUTO_EXTEND_DAYS);
  const daysExtended = dayDiff(today, extended);
  if (daysExtended >= 0) {
    return {
      status: "overdue",
      effectiveDate: extended,
      daysUntil: daysExtended,
      nudge: "Nggak apa-apa, waktu ditambah!",
      isExtended: true,
    };
  }
  return {
    status: "extended_overdue",
    effectiveDate: extended,
    daysUntil: daysExtended,
    nudge: "Mau reschedule atau istirahat dulu?",
    isExtended: true,
  };
}
