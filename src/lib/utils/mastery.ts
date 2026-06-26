import type { MasteryState } from "@/types";

// ============================================================================
// Mastery state machine — pure functions. Logic per master spec §6.6:
//
//   not_started --(first submit)--------------------> attempted
//   attempted   --(score >= 5)----------------------> developing
//   developing  --(score >= 7)----------------------> proficient
//   proficient  --(score >= 8, 2x consecutive)------> mastered
//   mastered    --(score >= 8, >= 2 weeks later)----> solidified
//   decay: mastered --(30 days w/o review)----------> developing
//
// Progression never moves *down* on a low score (only the time-based decay
// does, handled separately by applyMasteryDecay).
// ============================================================================

const ORDER: MasteryState[] = [
  "not_started",
  "attempted",
  "developing",
  "proficient",
  "mastered",
  "solidified",
];

function rank(state: MasteryState): number {
  return ORDER.indexOf(state);
}

const TWO_WEEKS_MS = 14 * 86_400_000;
const THIRTY_DAYS_MS = 30 * 86_400_000;

export interface MasteryInput {
  /** Current mastery state of the challenge. */
  current: MasteryState;
  /** Capped overall score of the new attempt (0–10). */
  score: number;
  /** Overall score of the immediately previous completed attempt, if any. */
  previousScore: number | null;
  /** ISO timestamp of when the current mastery state was set. */
  masteryUpdatedAt: string;
  /** Override "now" (for testing). */
  now?: Date;
}

/**
 * Returns the new mastery state after an attempt. Advances through the chain
 * as far as the new score + history allow; never demotes.
 */
export function computeMasteryAfterAttempt(input: MasteryInput): MasteryState {
  const { current, score, previousScore, masteryUpdatedAt } = input;
  const now = input.now ?? new Date();

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

  // mastered -> solidified: score >= 8 at least two weeks after *being* mastered.
  // Gated on `current === "mastered"` so a same-attempt promotion to mastered
  // can't immediately jump to solidified (masteryUpdatedAt would be stale).
  if (
    current === "mastered" &&
    score >= 8 &&
    now.getTime() - new Date(masteryUpdatedAt).getTime() >= TWO_WEEKS_MS
  ) {
    state = "solidified";
  }

  return state;
}

/**
 * Time-based decay: a "mastered" challenge slips to "developing" after 30 days
 * without a review. Used by the dashboard (Phase 5); harmless elsewhere.
 */
export function applyMasteryDecay(
  state: MasteryState,
  lastReviewedAt: string,
  now: Date = new Date(),
): MasteryState {
  if (
    state === "mastered" &&
    now.getTime() - new Date(lastReviewedAt).getTime() >= THIRTY_DAYS_MS
  ) {
    return "developing";
  }
  return state;
}
