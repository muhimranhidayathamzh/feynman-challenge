import { describe, expect, it } from "vitest";

import {
  HINT_TIERS,
  MAX_SCORE_BY_HINT,
  MAX_SCORE_NO_HINT,
  effectiveHint,
  formatDuration,
  scoreColor,
} from "./labels";
import type { HintLevel } from "@/types";

describe("hint tiers", () => {
  it("no revealed hint means level none with the full cap", () => {
    expect(effectiveHint(new Set())).toEqual({ level: "none", cap: MAX_SCORE_NO_HINT });
    expect(MAX_SCORE_NO_HINT).toBe(10);
  });

  it("each single tier applies its own cap", () => {
    expect(effectiveHint(new Set<HintLevel>(["keywords"]))).toEqual({
      level: "keywords",
      cap: 9,
    });
    expect(effectiveHint(new Set<HintLevel>(["guiding_questions"]))).toEqual({
      level: "guiding_questions",
      cap: 8,
    });
    expect(effectiveHint(new Set<HintLevel>(["outline"]))).toEqual({
      level: "outline",
      cap: 7,
    });
  });

  it("the most helpful revealed tier wins, regardless of reveal order", () => {
    expect(effectiveHint(new Set<HintLevel>(["outline", "keywords"]))).toEqual({
      level: "outline",
      cap: 7,
    });
    expect(effectiveHint(new Set<HintLevel>(["keywords", "guiding_questions"]))).toEqual({
      level: "guiding_questions",
      cap: 8,
    });
  });

  it("MAX_SCORE_BY_HINT (server) agrees with HINT_TIERS (client)", () => {
    for (const tier of HINT_TIERS) {
      expect(MAX_SCORE_BY_HINT[tier.level]).toBe(tier.cap);
    }
    expect(MAX_SCORE_BY_HINT.none).toBe(MAX_SCORE_NO_HINT);
  });

  it("tiers are ordered from least to most helpful (caps strictly decreasing)", () => {
    const caps = HINT_TIERS.map((tier) => tier.cap);
    for (let i = 1; i < caps.length; i += 1) {
      expect(caps[i]).toBeLessThan(caps[i - 1] ?? Infinity);
    }
  });
});

describe("formatting helpers", () => {
  it("formatDuration rounds to minutes with a minimum of 1", () => {
    expect(formatDuration(180)).toBe("± 3 menit");
    expect(formatDuration(150)).toBe("± 3 menit");
    expect(formatDuration(20)).toBe("± 1 menit");
  });

  it("scoreColor thresholds follow the mastery ladder", () => {
    expect(scoreColor(8)).toBe("var(--mastery-mastered)");
    expect(scoreColor(7)).toBe("var(--mastery-proficient)");
    expect(scoreColor(5)).toBe("var(--mastery-developing)");
    expect(scoreColor(4)).toBe("var(--mastery-attempted)");
  });
});
