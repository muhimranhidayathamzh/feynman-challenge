import { describe, expect, it } from "vitest";

import {
  EvaluationResultSchema,
  FollowupResultSchema,
  HintsGenerationSchema,
  OutlineGenerationSchema,
} from "@/lib/gemini/schemas";

import { aiMockEnabled, mockAnswer } from "./mock";

describe("aiMockEnabled", () => {
  it("is off unless AI_MOCK is exactly 1", () => {
    expect(aiMockEnabled({})).toBe(false);
    expect(aiMockEnabled({ AI_MOCK: "true" })).toBe(false);
    expect(aiMockEnabled({ AI_MOCK: "1" })).toBe(true);
    expect(aiMockEnabled({ AI_MOCK: "1", VERCEL_ENV: "preview" })).toBe(true);
  });

  it("refuses to run in production", () => {
    expect(() => aiMockEnabled({ AI_MOCK: "1", VERCEL_ENV: "production" })).toThrow(
      /not allowed in production/,
    );
    // Off in production is simply off.
    expect(aiMockEnabled({ VERCEL_ENV: "production" })).toBe(false);
  });
});

describe("mock answers", () => {
  it("pass the same schemas as real Gemini answers", () => {
    expect(OutlineGenerationSchema.safeParse(mockAnswer("outline")).success).toBe(true);
    expect(HintsGenerationSchema.safeParse(mockAnswer("hints")).success).toBe(true);
    expect(EvaluationResultSchema.safeParse(mockAnswer("evaluate")).success).toBe(true);
    expect(FollowupResultSchema.safeParse(mockAnswer("followup")).success).toBe(true);
  });

  it("quotes evidence that really appears in the transcript", () => {
    const evaluation = EvaluationResultSchema.parse(mockAnswer("evaluate"));
    for (const entry of evaluation.coverage) {
      if (entry.evidence) expect(evaluation.transcript).toContain(entry.evidence);
    }
  });

  it("hands out copies, never the fixture itself", () => {
    const first = mockAnswer("followup") as { verdict: string };
    first.verdict = "tepat";
    expect((mockAnswer("followup") as { verdict: string }).verdict).toBe("sebagian");
  });

  it("names a call it has no answer for", () => {
    expect(() => mockAnswer("something-else")).toThrow(/no fixture/);
  });
});
