import "server-only";

import type { ContentListUnion, Schema } from "@google/genai";
import type { ZodType } from "zod";

import { mockAnswer } from "@/lib/ai/mock";
import { parseUsageMetadata, type AiCallUsage } from "@/lib/ai/usage";
import { aiMock } from "@/lib/env";
import { GEMINI_MODEL, getGeminiClient } from "@/lib/gemini/client";
import {
  GeminiError,
  backoffDelayMs,
  canRetryWithinBudget,
  classifyGeminiError,
  isRetryable,
} from "@/lib/gemini/retry";

/**
 * Thinking budgets (tokens) for Gemini 2.5 Flash, which thinks by default.
 * Thinking adds latency on every call, so it is capped per use case:
 * - outline: a structured list; a small budget keeps generation snappy.
 * - evaluation: grading benefits from some reasoning, but must stay well
 *   inside the 60 s route limit for a 3-minute recording.
 * Not benchmarked yet: compare the "[gemini] ... ms" log lines across a few
 * real recordings and adjust. 0 disables thinking, -1 lets the model decide.
 */
export const THINKING_BUDGET = {
  outline: 512,
  evaluation: 1024,
} as const;

/** A realistic floor for one Gemini call; used to decide if a retry fits. */
const MIN_CALL_MS = 4000;

export interface GenerateJsonParams<T> {
  /** Log label, e.g. "outline" or "evaluate". */
  label: string;
  contents: ContentListUnion;
  systemInstruction: string;
  responseSchema: Schema;
  /** Validates the parsed JSON; failures become `invalid_response`. */
  zodSchema: ZodType<T>;
  temperature: number;
  thinkingBudget: number;
  /** Abort a single attempt after this long. */
  timeoutMs: number;
  /** Hard ceiling for all attempts + backoff combined (stay under maxDuration). */
  budgetMs: number;
  /** Extra tries after the first one. Default 2. */
  maxRetries?: number;
  /**
   * Called once, after the attempt that succeeded, with what that call cost.
   * Never called when every attempt failed. Purely for accounting: throwing
   * from here would fail a request that already worked, so it must not throw.
   */
  onUsage?: (usage: AiCallUsage) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * One place for every Gemini call: JSON mode + schema, per-attempt timeout,
 * overall time budget, retry with backoff on transient errors, Zod
 * validation, and a latency log line. Throws GeminiError only.
 */
export async function generateJson<T>(params: GenerateJsonParams<T>): Promise<T> {
  if (aiMock()) return mockedJson(params);

  const { maxRetries = 2 } = params;
  const started = Date.now();
  const ai = getGeminiClient();

  for (let attempt = 0; ; attempt += 1) {
    const remaining = params.budgetMs - (Date.now() - started);
    if (remaining <= 0) {
      throw new GeminiError("timeout", `${params.label}: time budget exhausted`);
    }

    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      Math.min(params.timeoutMs, remaining),
    );
    const callStarted = Date.now();

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: "application/json",
          responseSchema: params.responseSchema,
          temperature: params.temperature,
          thinkingConfig: { thinkingBudget: params.thinkingBudget },
          abortSignal: controller.signal,
        },
      });
      clearTimeout(timer);

      const ms = Date.now() - callStarted;
      if (params.onUsage) {
        try {
          params.onUsage(parseUsageMetadata(response.usageMetadata, GEMINI_MODEL, ms));
        } catch (usageError) {
          console.warn(`[gemini] ${params.label}: onUsage threw`, usageError);
        }
      }
      console.info(`[gemini] ${params.label} attempt=${attempt + 1} ${ms}ms`);

      const text = response.text;
      if (!text)
        throw new GeminiError("invalid_response", `${params.label}: empty response`);

      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        throw new GeminiError(
          "invalid_response",
          `${params.label}: response is not JSON`,
        );
      }

      const parsed = params.zodSchema.safeParse(json);
      if (!parsed.success) {
        throw new GeminiError(
          "invalid_response",
          `${params.label}: schema mismatch: ${parsed.error.issues[0]?.message ?? "?"}`,
        );
      }
      return parsed.data;
    } catch (caught) {
      clearTimeout(timer);
      const error = classifyGeminiError(caught);
      const ms = Date.now() - callStarted;
      console.warn(
        `[gemini] ${params.label} attempt=${attempt + 1} failed code=${error.code} status=${error.status ?? "-"} ${ms}ms`,
      );

      if (!isRetryable(error.code) || attempt >= maxRetries) throw error;

      const delay = backoffDelayMs(attempt);
      const left = params.budgetMs - (Date.now() - started);
      if (!canRetryWithinBudget(delay, left, MIN_CALL_MS)) throw error;

      await sleep(delay);
    }
  }
}

/**
 * AI_MOCK=1: the fixture for this call, validated by the same schema and
 * accounted like a real call (zero tokens), so quotas behave as in use.
 */
function mockedJson<T>(params: GenerateJsonParams<T>): T {
  const parsed = params.zodSchema.safeParse(mockAnswer(params.label));
  if (!parsed.success) {
    throw new GeminiError("invalid_response", `${params.label}: mock fixture mismatch`);
  }
  params.onUsage?.({
    model: "mock",
    promptTokens: 0,
    outputTokens: 0,
    thinkingTokens: 0,
    latencyMs: 0,
  });
  console.info(`[gemini] ${params.label} mocked (AI_MOCK=1)`);
  return parsed.data;
}
