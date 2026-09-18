import { describe, expect, it } from "vitest";

import { normalizeCoverage, parseStoredCoverage } from "@/lib/utils/coverage";
import { matchCoverageToOutline } from "@/lib/utils/coverage-progress";
import { normalizeFollowUpQuestions } from "@/lib/utils/followups";
import { computeOverallScore } from "@/lib/utils/scoring";

import { DEMO_ATTEMPT, DEMO_OUTLINE } from "./fixture";
import { planDemo } from "./plan";

describe("demo fixture", () => {
  it("has exactly one coverage entry per outline point, in order", () => {
    const titles = DEMO_OUTLINE.map((item) => item.title);
    const normalized = normalizeCoverage(DEMO_ATTEMPT.coverage, titles);
    expect(normalized).toEqual(DEMO_ATTEMPT.coverage);
    expect(parseStoredCoverage(DEMO_ATTEMPT.coverage)).toEqual(DEMO_ATTEMPT.coverage);
  });

  it("links every coverage entry to its outline point", () => {
    const outline = DEMO_OUTLINE.map((item, index) => ({
      id: `p${index}`,
      title: item.title,
    }));
    expect(matchCoverageToOutline(DEMO_ATTEMPT.coverage, outline)).toEqual([
      "p0",
      "p1",
      "p2",
      "p3",
    ]);
  });

  it("shows every results-page section: partial, missing, jargon, follow-ups", () => {
    const statuses = DEMO_ATTEMPT.coverage.map((entry) => entry.status);
    expect(statuses).toContain("partial");
    expect(statuses).toContain("missing");
    expect(DEMO_ATTEMPT.unexplainedJargon.length).toBeGreaterThan(0);
    expect(
      normalizeFollowUpQuestions(DEMO_ATTEMPT.followUpQuestions, DEMO_OUTLINE.length),
    ).toEqual(DEMO_ATTEMPT.followUpQuestions);
  });

  it("keeps evidence only where something was said", () => {
    for (const entry of DEMO_ATTEMPT.coverage) {
      if (entry.status === "missing") expect(entry.evidence).toBe("");
      else expect(DEMO_ATTEMPT.transcript).toContain(entry.evidence);
    }
  });
});

describe("planDemo", () => {
  const plan = planDemo("2026-09-19");

  it("scores with the real weighting and the no-hint cap", () => {
    expect(plan.maxScore).toBe(10);
    expect(plan.overallScore).toBe(computeOverallScore(DEMO_ATTEMPT.subScores, 10));
  });

  it("derives mastery and review like a real first attempt", () => {
    expect(plan.masteryState).not.toBe("not_started");
    expect(plan.reviewBox).toBe(0);
    expect(plan.nextReviewAt).not.toBeNull();
  });

  it("sets the deadline a few days ahead", () => {
    expect(plan.deadline).toBe("2026-09-24");
  });
});
