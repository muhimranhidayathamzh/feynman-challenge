import { describe, expect, it } from "vitest";

import { AI_COST_UNITS, costUnitsFor, parseUsageMetadata, totalTokens } from "./usage";

describe("cost units", () => {
  it("charges an evaluation more than a hint", () => {
    expect(costUnitsFor("evaluate")).toBeGreaterThan(costUnitsFor("hints"));
  });

  it("gives every kind a positive weight", () => {
    for (const [kind, units] of Object.entries(AI_COST_UNITS)) {
      expect(units, kind).toBeGreaterThan(0);
      expect(Number.isInteger(units), kind).toBe(true);
    }
  });
});

describe("parseUsageMetadata", () => {
  it("reads the counts Gemini reports", () => {
    const usage = parseUsageMetadata(
      { promptTokenCount: 7200, candidatesTokenCount: 810, thoughtsTokenCount: 640 },
      "gemini-2.5-flash",
      1234.6,
    );
    expect(usage).toEqual({
      model: "gemini-2.5-flash",
      promptTokens: 7200,
      outputTokens: 810,
      thinkingTokens: 640,
      latencyMs: 1235,
    });
  });

  it("reports null rather than a misleading zero when a field is missing", () => {
    const usage = parseUsageMetadata({ promptTokenCount: 100 }, "m", 10);
    expect(usage.promptTokens).toBe(100);
    expect(usage.outputTokens).toBeNull();
    expect(usage.thinkingTokens).toBeNull();
  });

  it("survives metadata that is absent or the wrong shape", () => {
    for (const value of [undefined, null, "nope", 42, []]) {
      const usage = parseUsageMetadata(value, "m", 5);
      expect(usage.promptTokens).toBeNull();
      expect(usage.latencyMs).toBe(5);
    }
  });

  it("rejects nonsense counts", () => {
    const usage = parseUsageMetadata(
      { promptTokenCount: -1, candidatesTokenCount: Number.NaN },
      "m",
      0,
    );
    expect(usage.promptTokens).toBeNull();
    expect(usage.outputTokens).toBeNull();
  });

  it("never reports negative latency", () => {
    expect(parseUsageMetadata({}, "m", -20).latencyMs).toBe(0);
  });
});

describe("totalTokens", () => {
  const base = { model: "m", latencyMs: 0 };

  it("adds up whatever was reported", () => {
    expect(
      totalTokens({ ...base, promptTokens: 10, outputTokens: 5, thinkingTokens: 2 }),
    ).toBe(17);
  });

  it("ignores the fields that are missing", () => {
    expect(
      totalTokens({
        ...base,
        promptTokens: 10,
        outputTokens: null,
        thinkingTokens: null,
      }),
    ).toBe(10);
  });

  it("is null when nothing was reported, so a caller cannot store a fake zero", () => {
    expect(
      totalTokens({
        ...base,
        promptTokens: null,
        outputTokens: null,
        thinkingTokens: null,
      }),
    ).toBeNull();
  });
});
