// ============================================================================
// Spaced repetition — a small Leitner system, pure functions.
//
// Each challenge sits in a box 0..5. The box sets how long until the next
// review. A strong explanation ON or AFTER the due day moves it up a box;
// a weak one sends it back to box 0. Reviewing early never promotes, so the
// schedule can't be gamed by re-recording five times in one evening.
// ============================================================================
import { addDays, dayDiff, formatDay, type CalendarDay } from "./date";

/** Days until the next review, per box. */
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60] as const;
export const MAX_BOX = REVIEW_INTERVALS.length - 1;

export const PROMOTE_SCORE = 8; // >= : move up a box (when due)
export const KEEP_SCORE = 5; // >= : stay in the box; below: back to box 0

export function intervalForBox(box: number): number {
  const index = Math.min(MAX_BOX, Math.max(0, Math.floor(box)));
  return REVIEW_INTERVALS[index] ?? REVIEW_INTERVALS[0];
}

export interface ReviewState {
  box: number;
  /** Calendar day of the next review, or null before the first attempt. */
  nextReviewAt: CalendarDay | null;
}

/** True when a review is due today (or has never been scheduled). */
export function isReviewDue(
  nextReviewAt: CalendarDay | null,
  today: CalendarDay,
): boolean {
  return nextReviewAt === null || dayDiff(nextReviewAt, today) >= 0;
}

/** New box + next review day after an attempt scored `score` on `today`. */
export function computeReviewAfterAttempt(input: {
  state: ReviewState;
  score: number;
  today: CalendarDay;
}): ReviewState {
  const { state, score, today } = input;

  if (score >= PROMOTE_SCORE) {
    if (!isReviewDue(state.nextReviewAt, today)) {
      // Early review: good, but it doesn't earn a promotion. Keep the schedule.
      return { box: state.box, nextReviewAt: state.nextReviewAt };
    }
    const box = Math.min(MAX_BOX, state.box + 1);
    return { box, nextReviewAt: addDays(today, intervalForBox(box)) };
  }

  if (score >= KEEP_SCORE) {
    return { box: state.box, nextReviewAt: addDays(today, intervalForBox(state.box)) };
  }

  return { box: 0, nextReviewAt: addDays(today, intervalForBox(0)) };
}

/**
 * Days past the review day (0 when due today, negative when not yet due),
 * or null when nothing is scheduled.
 */
export function daysOverdue(
  nextReviewAt: CalendarDay | null,
  today: CalendarDay,
): number | null {
  return nextReviewAt === null ? null : dayDiff(nextReviewAt, today);
}

/**
 * Seriously overdue: more than one full interval past the review day. This is
 * when mastery visibly slips (see effectiveMasteryState).
 */
export function isLapsed(state: ReviewState, today: CalendarDay): boolean {
  const overdue = daysOverdue(state.nextReviewAt, today);
  return overdue !== null && overdue > intervalForBox(state.box);
}

/** Human label for the notebook, e.g. "Review hari ini" or "Review berikutnya: 22 Sep". */
export function nextReviewLabel(
  nextReviewAt: CalendarDay | null,
  today: CalendarDay,
): string | null {
  if (nextReviewAt === null) return null;
  const days = dayDiff(today, nextReviewAt);
  if (days < 0) return `Review terlambat ${-days} hari`;
  if (days === 0) return "Review hari ini";
  if (days === 1) return "Review besok";
  return `Review berikutnya: ${formatDay(nextReviewAt)}`;
}
