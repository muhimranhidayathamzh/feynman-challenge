// ============================================================================
// Scoring — pure functions. The overall score is computed HERE, never by the
// model, so the rubric weights (spec §6.3) are always honoured and the hint
// cap (spec §6.2) is always applied.
// ============================================================================

export interface SubScores {
  comprehensiveness: number;
  accuracy: number;
  clarity: number;
}

export const SCORE_WEIGHTS: Readonly<SubScores> = {
  comprehensiveness: 0.4,
  accuracy: 0.35,
  clarity: 0.25,
};

export const MAX_SUB_SCORE = 10;

/** Rounds to an integer and clamps to [0, max]. */
export function clampScore(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(max, Math.round(value)));
}

/** Each sub-score rounded + clamped to 0–10 (the model may return floats). */
export function normalizeSubScores(raw: SubScores): SubScores {
  return {
    comprehensiveness: clampScore(raw.comprehensiveness, MAX_SUB_SCORE),
    accuracy: clampScore(raw.accuracy, MAX_SUB_SCORE),
    clarity: clampScore(raw.clarity, MAX_SUB_SCORE),
  };
}

/**
 * overall = round(0.40·comprehensiveness + 0.35·accuracy + 0.25·clarity),
 * then capped at `maxScore` (10 without hints, 9/8/7 per hint tier).
 */
export function computeOverallScore(subScores: SubScores, maxScore: number): number {
  const normalized = normalizeSubScores(subScores);
  const weighted =
    normalized.comprehensiveness * SCORE_WEIGHTS.comprehensiveness +
    normalized.accuracy * SCORE_WEIGHTS.accuracy +
    normalized.clarity * SCORE_WEIGHTS.clarity;
  return clampScore(weighted, clampScore(maxScore, MAX_SUB_SCORE));
}
