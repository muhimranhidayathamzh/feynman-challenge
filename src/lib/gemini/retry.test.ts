import { describe, expect, it } from "vitest";

import {
  GEMINI_ERROR_RESPONSE,
  GeminiError,
  backoffDelayMs,
  canRetryWithinBudget,
  classifyGeminiError,
  isRetryable,
} from "./retry";

class FakeApiError extends Error {
  status: number;
  constructor(status: number) {
    super(`api ${status}`);
    this.status = status;
  }
}

describe("classifyGeminiError", () => {
  it("maps our abort to timeout", () => {
    const abort = new Error("This operation was aborted");
    abort.name = "AbortError";
    expect(classifyGeminiError(abort).code).toBe("timeout");
  });

  it("maps 429 to quota and 5xx to unavailable", () => {
    expect(classifyGeminiError(new FakeApiError(429)).code).toBe("quota");
    expect(classifyGeminiError(new FakeApiError(500)).code).toBe("unavailable");
    expect(classifyGeminiError(new FakeApiError(503)).code).toBe("unavailable");
    expect(classifyGeminiError(new FakeApiError(503)).status).toBe(503);
  });

  it("maps other 4xx to unknown (not retryable)", () => {
    const error = classifyGeminiError(new FakeApiError(400));
    expect(error.code).toBe("unknown");
    expect(isRetryable(error.code)).toBe(false);
  });

  it("maps network failures (TypeError) to unavailable", () => {
    expect(classifyGeminiError(new TypeError("fetch failed")).code).toBe("unavailable");
  });

  it("passes GeminiError through untouched", () => {
    const original = new GeminiError("invalid_response", "bad json");
    expect(classifyGeminiError(original)).toBe(original);
  });

  it("has a response mapping for every code", () => {
    expect(GEMINI_ERROR_RESPONSE.quota.status).toBe(429);
    expect(GEMINI_ERROR_RESPONSE.timeout.status).toBe(504);
    expect(GEMINI_ERROR_RESPONSE.unavailable.status).toBe(503);
    expect(GEMINI_ERROR_RESPONSE.invalid_response.status).toBe(502);
    expect(GEMINI_ERROR_RESPONSE.unknown.status).toBe(500);
  });
});

describe("retry policy", () => {
  it("retries only quota and unavailable", () => {
    expect(isRetryable("quota")).toBe(true);
    expect(isRetryable("unavailable")).toBe(true);
    expect(isRetryable("timeout")).toBe(false);
    expect(isRetryable("invalid_response")).toBe(false);
    expect(isRetryable("unknown")).toBe(false);
  });

  it("backs off exponentially with jitter in [0.5, 1] of the base", () => {
    expect(backoffDelayMs(0, 1000, () => 0)).toBe(500);
    expect(backoffDelayMs(0, 1000, () => 1)).toBe(1000);
    expect(backoffDelayMs(1, 1000, () => 1)).toBe(2000);
    expect(backoffDelayMs(2, 1000, () => 0.5)).toBe(3000);
  });

  it("only retries when delay + a minimal call still fit the budget", () => {
    expect(canRetryWithinBudget(1000, 10_000, 5000)).toBe(true);
    expect(canRetryWithinBudget(1000, 5500, 5000)).toBe(false);
    expect(canRetryWithinBudget(0, 0, 1)).toBe(false);
  });
});
