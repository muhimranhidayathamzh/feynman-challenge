/**
 * What one AI call costs, in units.
 *
 * The app-wide daily ceiling is spent in these units rather than in calls,
 * because the calls are not comparable: `evaluate` sends minutes of audio and
 * thinks hard about it, while `hints` sends a few lines of text. Counting them
 * equally let a flood of cheap calls stop evaluation for everybody.
 *
 * This file is the single source of truth for the weights — the SQL function
 * receives them as an argument rather than keeping its own copy, so the two
 * cannot drift apart.
 */

import type { AiUsageKind } from "./quota";

/**
 * Rough relative cost, anchored on `hints` = 1. Deliberately coarse: it only
 * has to stop one kind of call from starving the others. Once `ai_usage` holds
 * real token counts, re-derive these from the data instead of from intuition.
 */
export const AI_COST_UNITS: Record<AiUsageKind, number> = {
  evaluate: 5,
  followup: 3,
  generate: 2,
  hints: 1,
};

export function costUnitsFor(kind: AiUsageKind): number {
  return AI_COST_UNITS[kind];
}

/** What a finished Gemini call reports about itself. */
export interface AiCallUsage {
  model: string;
  promptTokens: number | null;
  outputTokens: number | null;
  thinkingTokens: number | null;
  latencyMs: number;
}

/**
 * Pulls the token counts out of a Gemini response's `usageMetadata`.
 * Every field is optional in the SDK's type and missing on some responses, so
 * anything unusable becomes null rather than a misleading zero.
 */
export function parseUsageMetadata(
  metadata: unknown,
  model: string,
  latencyMs: number,
): AiCallUsage {
  const source =
    metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>) : {};

  return {
    model,
    promptTokens: count(source.promptTokenCount),
    outputTokens: count(source.candidatesTokenCount),
    thinkingTokens: count(source.thoughtsTokenCount),
    latencyMs: Math.max(0, Math.round(latencyMs)),
  };
}

function count(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : null;
}

/** Total tokens billed for a call, or null when nothing usable was reported. */
export function totalTokens(usage: AiCallUsage): number | null {
  const parts = [usage.promptTokens, usage.outputTokens, usage.thinkingTokens].filter(
    (part): part is number => part !== null,
  );
  return parts.length > 0 ? parts.reduce((sum, part) => sum + part, 0) : null;
}
