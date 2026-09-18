import { describe, expect, it } from "vitest";

import { clampScore, computeOverallScore, normalizeSubScores } from "./scoring";

describe("clampScore", () => {
  it("rounds and clamps", () => {
    expect(clampScore(7.4, 10)).toBe(7);
    expect(clampScore(7.5, 10)).toBe(8);
    expect(clampScore(-3, 10)).toBe(0);
    expect(clampScore(14, 10)).toBe(10);
    expect(clampScore(Number.NaN, 10)).toBe(0);
  });
});

describe("normalizeSubScores", () => {
  it("clamps each sub-score to 0–10", () => {
    expect(
      normalizeSubScores({ comprehensiveness: 12, accuracy: -1, clarity: 6.6 }),
    ).toEqual({ comprehensiveness: 10, accuracy: 0, clarity: 7 });
  });
});

describe("computeOverallScore — 40/35/25 weights + hint cap", () => {
  it("applies the rubric weights", () => {
    // 0.4*10 + 0.35*10 + 0.25*10 = 10
    expect(
      computeOverallScore({ comprehensiveness: 10, accuracy: 10, clarity: 10 }, 10),
    ).toBe(10);
    // 0.4*6 + 0.35*8 + 0.25*7 = 2.4 + 2.8 + 1.75 = 6.95 -> 7
    expect(
      computeOverallScore({ comprehensiveness: 6, accuracy: 8, clarity: 7 }, 10),
    ).toBe(7);
    // 0.4*3 + 0.35*4 + 0.25*5 = 1.2 + 1.4 + 1.25 = 3.85 -> 4
    expect(
      computeOverallScore({ comprehensiveness: 3, accuracy: 4, clarity: 5 }, 10),
    ).toBe(4);
  });

  it("caps at the hint-tier maximum", () => {
    const perfect = { comprehensiveness: 10, accuracy: 10, clarity: 10 };
    expect(computeOverallScore(perfect, 9)).toBe(9);
    expect(computeOverallScore(perfect, 8)).toBe(8);
    expect(computeOverallScore(perfect, 7)).toBe(7);
  });

  it("does not raise a low score to the cap", () => {
    expect(
      computeOverallScore({ comprehensiveness: 5, accuracy: 5, clarity: 5 }, 7),
    ).toBe(5);
  });

  it("tolerates out-of-range inputs from the model", () => {
    expect(
      computeOverallScore({ comprehensiveness: 15, accuracy: 15, clarity: 15 }, 10),
    ).toBe(10);
    expect(
      computeOverallScore({ comprehensiveness: 8, accuracy: 8, clarity: 8 }, 42),
    ).toBe(8);
  });
});
