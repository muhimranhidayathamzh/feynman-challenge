import { describe, expect, it } from "vitest";

import {
  applyMasteryDecay,
  computeMasteryAfterAttempt,
  type MasteryInput,
} from "./mastery";

const NOW = new Date("2026-09-18T12:00:00Z");
const DAY_MS = 86_400_000;

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * DAY_MS).toISOString();
}

function run(
  overrides: Partial<MasteryInput>,
): ReturnType<typeof computeMasteryAfterAttempt> {
  return computeMasteryAfterAttempt({
    current: "not_started",
    score: 0,
    previousScore: null,
    masteryUpdatedAt: daysAgo(0),
    now: NOW,
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

  it("mastered + score >= 8 after two weeks reaches solidified", () => {
    expect(
      run({
        current: "mastered",
        score: 8,
        previousScore: 8,
        masteryUpdatedAt: daysAgo(14),
      }),
    ).toBe("solidified");
  });

  it("mastered + score >= 8 before two weeks stays mastered", () => {
    expect(
      run({
        current: "mastered",
        score: 9,
        previousScore: 9,
        masteryUpdatedAt: daysAgo(13),
      }),
    ).toBe("mastered");
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
    expect(
      run({
        current: "proficient",
        score: 9,
        previousScore: 9,
        masteryUpdatedAt: daysAgo(30),
      }),
    ).toBe("mastered");
  });

  it("never demotes on a low score", () => {
    expect(run({ current: "proficient", score: 2 })).toBe("proficient");
    expect(run({ current: "mastered", score: 1 })).toBe("mastered");
    expect(run({ current: "solidified", score: 0 })).toBe("solidified");
  });
});

describe("applyMasteryDecay", () => {
  it("mastered decays to developing after 30 days without review", () => {
    expect(applyMasteryDecay("mastered", daysAgo(30), NOW)).toBe("developing");
  });

  it("mastered does not decay before 30 days", () => {
    expect(applyMasteryDecay("mastered", daysAgo(29), NOW)).toBe("mastered");
  });

  it("only mastered decays; other states are untouched", () => {
    expect(applyMasteryDecay("proficient", daysAgo(90), NOW)).toBe("proficient");
    expect(applyMasteryDecay("solidified", daysAgo(90), NOW)).toBe("solidified");
    expect(applyMasteryDecay("developing", daysAgo(90), NOW)).toBe("developing");
  });

  it.todo(
    "decay is only computed for display; the stored state is never updated, so the next attempt starts from the stale 'mastered' state (fixed in Prompt 1.5)",
  );
});
