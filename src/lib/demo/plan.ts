// ============================================================================
// Demo seed plan — pure: turns the fixture into the exact values stored, using
// the same scoring, mastery, and review rules as a real evaluation.
// ============================================================================
import { addDays, type CalendarDay } from "@/lib/utils/date";
import { MAX_SCORE_BY_HINT } from "@/lib/utils/labels";
import { computeMasteryAfterAttempt } from "@/lib/utils/mastery";
import { computeReviewAfterAttempt } from "@/lib/utils/review";
import { computeOverallScore } from "@/lib/utils/scoring";
import type { MasteryState } from "@/types";

import { DEMO_ATTEMPT, DEMO_CHALLENGE } from "./fixture";

export interface DemoPlan {
  deadline: CalendarDay;
  overallScore: number;
  maxScore: number;
  masteryState: MasteryState;
  reviewBox: number;
  nextReviewAt: CalendarDay | null;
}

export function planDemo(today: CalendarDay): DemoPlan {
  const maxScore = MAX_SCORE_BY_HINT.none;
  const overallScore = computeOverallScore(DEMO_ATTEMPT.subScores, maxScore);
  const review = computeReviewAfterAttempt({
    state: { box: 0, nextReviewAt: null },
    score: overallScore,
    today,
  });
  const masteryState = computeMasteryAfterAttempt({
    current: "not_started",
    score: overallScore,
    previousScore: null,
    reviewBox: review.box,
  });
  return {
    deadline: addDays(today, DEMO_CHALLENGE.deadlineInDays),
    overallScore,
    maxScore,
    masteryState,
    reviewBox: review.box,
    nextReviewAt: review.nextReviewAt,
  };
}
