import type { MasteryState } from "@/types";

import type { CalendarDay } from "./date";
import { isLapsed, type ReviewState } from "./review";

// ============================================================================
// Mastery state machine — pure functions. Master spec §6.6, with spaced
// repetition (src/lib/utils/review.ts) replacing the old fixed timers:
//
//   not_started --(first submit)------------------------> attempted
//   attempted   --(score >= 5)--------------------------> developing
//   developing  --(score >= 7)--------------------------> proficient
//   proficient  --(score >= 8, 2x consecutive)----------> mastered
//   mastered    --(score >= 8 and review box >= 4)------> solidified
//
// A box >= 4 means four strong, ON-TIME reviews spread over weeks, so
// "solidified" really is long-term retention, not one good evening.
//
// Progression never moves down on a low score. Slipping is derived at read
// time: a review more than one full interval overdue drops the displayed
// state by one level (effectiveMasteryState).
// ============================================================================

const ORDER: MasteryState[] = [
  "not_started",
  "attempted",
  "developing",
  "proficient",
  "mastered",
  "solidified",
];

/** Review box needed for "solidified". */
export const SOLIDIFIED_BOX = 4;

function rank(state: MasteryState): number {
  return ORDER.indexOf(state);
}

export interface MasteryInput {
  /** Current (effective) mastery state of the challenge. */
  current: MasteryState;
  /** Capped overall score of the new attempt (0–10). */
  score: number;
  /** Overall score of the immediately previous completed attempt, if any. */
  previousScore: number | null;
  /** Review box AFTER this attempt (see computeReviewAfterAttempt). */
  reviewBox: number;
}

/**
 * Returns the new mastery state after an attempt. Advances through the chain
 * as far as the new score + history allow; never demotes.
 */
export function computeMasteryAfterAttempt(input: MasteryInput): MasteryState {
  const { current, score, previousScore, reviewBox } = input;

  // Any submitted attempt moves a fresh challenge to "attempted".
  let state: MasteryState = current === "not_started" ? "attempted" : current;

  // Cumulative score thresholds (a high score can advance multiple levels).
  if (rank(state) < rank("developing") && score >= 5) state = "developing";
  if (rank(state) < rank("proficient") && score >= 7) state = "proficient";

  // proficient -> mastered: score >= 8 with the previous attempt also >= 8.
  if (
    rank(state) === rank("proficient") &&
    score >= 8 &&
    previousScore !== null &&
    previousScore >= 8
  ) {
    state = "mastered";
  }

  // mastered -> solidified: only from an already-mastered challenge, and only
  // once spaced reviews have climbed to box 4.
  if (current === "mastered" && score >= 8 && reviewBox >= SOLIDIFIED_BOX) {
    state = "solidified";
  }

  return state;
}

/** Levels that can visibly slip when reviews lapse. */
const CAN_SLIP: ReadonlySet<MasteryState> = new Set([
  "proficient",
  "mastered",
  "solidified",
]);

/**
 * The state to reason and display with. The database keeps the last EARNED
 * state; when the review is more than one full interval overdue, the shown
 * state drops one level (solidified -> mastered -> proficient -> developing).
 * Used as the starting point for the next evaluation too, so a lapsed
 * challenge has to earn its way back.
 */
export function effectiveMasteryState(
  stored: MasteryState,
  review: ReviewState,
  today: CalendarDay,
): MasteryState {
  if (!CAN_SLIP.has(stored) || !isLapsed(review, today)) return stored;
  return ORDER[rank(stored) - 1] ?? stored;
}
