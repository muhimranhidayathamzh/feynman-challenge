import { describe, expect, it } from "vitest";

import {
  MASTERY_LEVELS,
  SOLIDIFIED_BOX,
  computeMasteryAfterAttempt,
  effectiveMasteryState,
  masteryLevel,
  type MasteryInput,
} from "./mastery";

function run(
  overrides: Partial<MasteryInput>,
): ReturnType<typeof computeMasteryAfterAttempt> {
  return computeMasteryAfterAttempt({
    current: "not_started",
    score: 0,
    previousScore: null,
    reviewBox: 0,
    ...overrides,
  });
}

describe("computeMasteryAfterAttempt — spec §6.6 transitions", () => {
  it("first submit moves not_started to attempted, even with a low score", () => {
    expect(run({ current: "not_started", score: 3 })).toBe("attempted");
  });

  it("score >= 5 reaches developing", () => {
    expect(run({ current: "attempted", score: 5 })).toBe("developing");
  });

  it("score >= 7 reaches proficient", () => {
    expect(run({ current: "developing", score: 7 })).toBe("proficient");
  });

  it("score >= 8 twice in a row reaches mastered", () => {
    expect(run({ current: "proficient", score: 8, previousScore: 8 })).toBe("mastered");
  });

  it("score >= 8 only once stays proficient", () => {
    expect(run({ current: "proficient", score: 8, previousScore: 7 })).toBe("proficient");
    expect(run({ current: "proficient", score: 8, previousScore: null })).toBe(
      "proficient",
    );
  });

  it("mastered + score >= 8 reaches solidified once the review box is high enough", () => {
    expect(run({ current: "mastered", score: 8, reviewBox: SOLIDIFIED_BOX })).toBe(
      "solidified",
    );
    expect(run({ current: "mastered", score: 9, reviewBox: SOLIDIFIED_BOX - 1 })).toBe(
      "mastered",
    );
  });
});

describe("computeMasteryAfterAttempt — jumping and guarding", () => {
  it("a high first score skips levels up to proficient", () => {
    expect(run({ current: "not_started", score: 7 })).toBe("proficient");
  });

  it("can jump straight to mastered when history supports it", () => {
    expect(run({ current: "attempted", score: 8, previousScore: 8 })).toBe("mastered");
  });

  it("cannot go from proficient to solidified in the same attempt", () => {
    expect(run({ current: "proficient", score: 9, previousScore: 9, reviewBox: 5 })).toBe(
      "mastered",
    );
  });

  it("never demotes on a low score", () => {
    expect(run({ current: "proficient", score: 2 })).toBe("proficient");
    expect(run({ current: "mastered", score: 1 })).toBe("mastered");
    expect(run({ current: "solidified", score: 0 })).toBe("solidified");
  });
});

describe("effectiveMasteryState — slipping when reviews lapse", () => {
  const TODAY = "2026-09-19";

  it("keeps the stored state while reviews are on time", () => {
    expect(
      effectiveMasteryState("mastered", { box: 2, nextReviewAt: "2026-09-25" }, TODAY),
    ).toBe("mastered");
    // Overdue, but not by more than one interval (box 2 = 7 days).
    expect(
      effectiveMasteryState("mastered", { box: 2, nextReviewAt: "2026-09-12" }, TODAY),
    ).toBe("mastered");
  });

  it("drops exactly one level once more than one interval overdue", () => {
    const lapsed = { box: 2, nextReviewAt: "2026-09-10" };
    expect(effectiveMasteryState("solidified", lapsed, TODAY)).toBe("mastered");
    expect(effectiveMasteryState("mastered", lapsed, TODAY)).toBe("proficient");
    expect(effectiveMasteryState("proficient", lapsed, TODAY)).toBe("developing");
  });

  it("early levels never slip, and nothing slips without a schedule", () => {
    const lapsed = { box: 0, nextReviewAt: "2026-01-01" };
    expect(effectiveMasteryState("developing", lapsed, TODAY)).toBe("developing");
    expect(effectiveMasteryState("attempted", lapsed, TODAY)).toBe("attempted");
    expect(effectiveMasteryState("mastered", { box: 0, nextReviewAt: null }, TODAY)).toBe(
      "mastered",
    );
  });

  it("a lapsed mastered challenge must re-earn mastery on the next attempt", () => {
    const current = effectiveMasteryState(
      "mastered",
      { box: 3, nextReviewAt: "2026-08-01" },
      TODAY,
    );
    expect(current).toBe("proficient");
    expect(run({ current, score: 9, previousScore: 5, reviewBox: 4 })).toBe("proficient");
  });
});

describe("masteryLevel", () => {
  it("maps the six states to 0..5 filled segments", () => {
    expect(masteryLevel("not_started")).toBe(0);
    expect(masteryLevel("attempted")).toBe(1);
    expect(masteryLevel("proficient")).toBe(3);
    expect(masteryLevel("solidified")).toBe(MASTERY_LEVELS);
  });
});
