// ============================================================================
// The core of an evaluation (Prompt 4.4): prompt, one multimodal Gemini call,
// coverage normalised to OUR outline, and scores computed by the server.
// Shared by /api/evaluate and the eval-golden runner (eval/golden.ts), so the
// consistency report measures exactly what learners get.
// ============================================================================
import { createPartFromBase64 } from "@google/genai";

import type { AiCallUsage } from "@/lib/ai/usage";
import { THINKING_BUDGET, generateJson } from "@/lib/gemini/generate";
import {
  EVALUATION_SYSTEM_INSTRUCTION,
  buildEvaluationPrompt,
} from "@/lib/gemini/prompts";
import {
  EVALUATION_RESPONSE_SCHEMA,
  EvaluationResultSchema,
  type EvaluationResult,
} from "@/lib/gemini/schemas";
import { normalizeCoverage, normalizeJargon } from "@/lib/utils/coverage";
import { normalizeFollowUpQuestions } from "@/lib/utils/followups";
import { computeOverallScore, normalizeSubScores } from "@/lib/utils/scoring";
import type { AudioIssue, Coverage, HintLevel } from "@/types";

/** One Gemini attempt on a few minutes of audio. */
export const EVALUATION_TIMEOUT_MS = 45_000;

/**
 * Low temperature: the same explanation should get the same score. Tuned by
 * the eval-golden report (eval/reports), not by feel.
 */
export const EVALUATION_TEMPERATURE = 0.2;

export interface EvaluationInput {
  audioBase64: string;
  mimeType: string;
  outline: readonly { title: string; description: string | null }[];
  notes: string | null;
  hintLevel: HintLevel;
  /** Cap from the hints used: 10, 9, 8 or 7. */
  maxScore: number;
  /** Ceiling for every attempt and backoff together. */
  budgetMs: number;
  onUsage?: (usage: AiCallUsage) => void;
}

export type EvaluationOutcome =
  | {
      /** The audio could not be judged (silence, noise, another topic...). */
      kind: "rejected";
      result: EvaluationResult;
      audioIssue: Exclude<AudioIssue, "none">;
    }
  | {
      kind: "scored";
      result: EvaluationResult;
      coverage: Coverage[];
      jargon: string[];
      followUps: ReturnType<typeof normalizeFollowUpQuestions>;
      subScores: ReturnType<typeof normalizeSubScores>;
      overall: number;
    };

/** Throws GeminiError (see lib/gemini/retry.ts) when the call fails. */
export async function evaluateExplanation(
  input: EvaluationInput,
): Promise<EvaluationOutcome> {
  const prompt = buildEvaluationPrompt({
    outline: [...input.outline],
    notes: input.notes,
    hintLevel: input.hintLevel,
    maxScore: input.maxScore,
  });

  const result = await generateJson({
    ...(input.onUsage && { onUsage: input.onUsage }),
    label: "evaluate",
    contents: [{ text: prompt }, createPartFromBase64(input.audioBase64, input.mimeType)],
    systemInstruction: EVALUATION_SYSTEM_INSTRUCTION,
    responseSchema: EVALUATION_RESPONSE_SCHEMA,
    zodSchema: EvaluationResultSchema,
    temperature: EVALUATION_TEMPERATURE,
    thinkingBudget: THINKING_BUDGET.evaluation,
    timeoutMs: EVALUATION_TIMEOUT_MS,
    budgetMs: input.budgetMs,
  });

  if (result.audio_issue !== "none") {
    return { kind: "rejected", result, audioIssue: result.audio_issue };
  }

  // One entry per OUR outline point; jargon cleaned.
  const titles = input.outline.map((item) => item.title);
  const subScores = normalizeSubScores(result.sub_scores);
  return {
    kind: "scored",
    result,
    coverage: normalizeCoverage(result.coverage, titles),
    jargon: normalizeJargon(result.unexplained_jargon),
    followUps: normalizeFollowUpQuestions(result.follow_up_questions, titles.length),
    subScores,
    // Computed by the server, never by the model.
    overall: computeOverallScore(subScores, input.maxScore),
  };
}
