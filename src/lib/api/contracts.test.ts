import { describe, expect, it } from "vitest";

import {
  ApiErrorSchema,
  AttemptCreateRequestSchema,
  EVALUATION_ERROR_MESSAGES,
  EvaluateResponseSchema,
  describeEvaluationError,
} from "./contracts";

describe("describeEvaluationError", () => {
  it("returns a specific message for every known code", () => {
    for (const code of Object.keys(EVALUATION_ERROR_MESSAGES)) {
      expect(describeEvaluationError(code)).toBe(EVALUATION_ERROR_MESSAGES[code]);
    }
  });

  it("falls back to the unknown message", () => {
    expect(describeEvaluationError(null)).toBe(EVALUATION_ERROR_MESSAGES.unknown);
    expect(describeEvaluationError("nope")).toBe(EVALUATION_ERROR_MESSAGES.unknown);
  });
});

describe("schemas", () => {
  it("accepts the two evaluate outcomes and rejects others", () => {
    expect(
      EvaluateResponseSchema.safeParse({ evaluation_status: "processing" }).success,
    ).toBe(true);
    expect(
      EvaluateResponseSchema.safeParse({
        evaluation_status: "completed",
        overall_score: 7,
      }).success,
    ).toBe(true);
    expect(EvaluateResponseSchema.safeParse({ evaluation_status: "error" }).success).toBe(
      false,
    );
  });

  it("rejects malformed attempt requests", () => {
    expect(
      AttemptCreateRequestSchema.safeParse({
        storage_path: "a/b/c.webm",
        hint_level_used: "none",
        duration_seconds: 12,
      }).success,
    ).toBe(true);
    expect(
      AttemptCreateRequestSchema.safeParse({
        storage_path: "",
        hint_level_used: "none",
        duration_seconds: 12,
      }).success,
    ).toBe(false);
    expect(
      AttemptCreateRequestSchema.safeParse({
        storage_path: "a/b/c.webm",
        hint_level_used: "cheat",
        duration_seconds: 12,
      }).success,
    ).toBe(false);
  });

  it("reads optional fields on error bodies", () => {
    const parsed = ApiErrorSchema.safeParse({
      error: "x",
      code: "quota",
      retryAfterSeconds: 30,
    });
    expect(parsed.success).toBe(true);
    expect(ApiErrorSchema.safeParse({ message: "x" }).success).toBe(false);
  });
});
