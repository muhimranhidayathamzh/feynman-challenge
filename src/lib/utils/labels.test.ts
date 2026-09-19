import { describe, expect, it } from "vitest";

import {
  HINT_TIERS,
  MAX_SCORE_BY_HINT,
  MAX_SCORE_NO_HINT,
  effectiveHint,
  formatDuration,
  scorePhrase,
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
});

describe("scorePhrase", () => {
  it("names each score band (DESIGN.md §9)", () => {
    expect(scorePhrase(0)).toBe("Baru mulai");
    expect(scorePhrase(3)).toBe("Baru mulai");
    expect(scorePhrase(4)).toBe("Mulai paham");
    expect(scorePhrase(5)).toBe("Mulai paham");
    expect(scorePhrase(6)).toBe("Sudah paham intinya");
    expect(scorePhrase(7)).toBe("Sudah paham intinya");
    expect(scorePhrase(8)).toBe("Paham betul");
    expect(scorePhrase(9)).toBe("Paham betul");
    expect(scorePhrase(10)).toBe("Bisa mengajarkannya");
  });
});
