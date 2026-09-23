import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { consumeAiQuota } from "@/lib/ai/quota";
import { generateJson } from "@/lib/gemini/generate";
import { HINTS_SYSTEM_INSTRUCTION, buildHintsPrompt } from "@/lib/gemini/prompts";
import { GeminiError, type GeminiErrorCode } from "@/lib/gemini/retry";
import { HINTS_RESPONSE_SCHEMA, HintsGenerationSchema } from "@/lib/gemini/schemas";
import { isHintMissing, sanitizeKeywords } from "@/lib/utils/hints";
import type { Database } from "@/types";

export type HintsRegenResult =
  | { status: "ok"; updated: number }
  | { status: "none-missing" }
  | { status: "not-found" }
  | { status: "quota"; message: string; retryAfterSeconds: number; httpStatus: 429 | 503 }
  | { status: "error"; code: GeminiErrorCode | "db" };

/**
 * Generates AI hints for every outline point of a challenge that has none
 * (new points, edited points, or challenges created before hints existed),
 * in ONE Gemini call. Writes are guarded on the point's current title so a
 * concurrent edit is never overwritten with hints for the old wording.
 */
export async function regenerateMissingHints(
  supabase: SupabaseClient<Database>,
  challengeId: string,
  options: { budgetMs?: number; anonymous?: boolean } = {},
): Promise<HintsRegenResult> {
  const [{ data: challenge }, { data: items, error: itemsError }] = await Promise.all([
    supabase.from("challenges").select("title").eq("id", challengeId).maybeSingle(),
    supabase
      .from("challenge_outlines")
      .select("id, title, description, keywords, guiding_question")
      .eq("challenge_id", challengeId)
      .order("order_index"),
  ]);

  if (!challenge) return { status: "not-found" };
  if (itemsError || !items) return { status: "error", code: "db" };

  const targets = items
    .map((item, index) => ({ item, position: index + 1 }))
    .filter(({ item }) => isHintMissing(item));
  if (targets.length === 0) return { status: "none-missing" };

  const quota = await consumeAiQuota(supabase, "hints", {
    anonymous: options.anonymous ?? false,
  });
  if (!quota.allowed) {
    return {
      status: "quota",
      message: quota.message,
      retryAfterSeconds: quota.retryAfterSeconds,
      httpStatus: quota.status,
    };
  }

  let result;
  try {
    result = await generateJson({
      label: "hints",
      contents: buildHintsPrompt({
        topic: challenge.title,
        outline: items.map((item) => ({
          title: item.title,
          description: item.description,
        })),
        targets: targets.map((target) => target.position),
      }),
      systemInstruction: HINTS_SYSTEM_INSTRUCTION,
      responseSchema: HINTS_RESPONSE_SCHEMA,
      zodSchema: HintsGenerationSchema,
      temperature: 0.5,
      thinkingBudget: 256,
      timeoutMs: 20_000,
      budgetMs: options.budgetMs ?? 25_000,
    });
  } catch (error) {
    console.error("[hints] generation failed:", error);
    return {
      status: "error",
      code: error instanceof GeminiError ? error.code : "unknown",
    };
  }

  let updated = 0;
  for (const { item, position } of targets) {
    const generated = result.items.find((entry) => entry.index === position);
    if (!generated) continue;
    const keywords = sanitizeKeywords(item.title, generated.keywords);
    const question = generated.guiding_question.trim();
    if (keywords.length === 0 || question.length === 0) continue;

    const { data, error } = await supabase
      .from("challenge_outlines")
      .update({ keywords, guiding_question: question })
      .eq("id", item.id)
      .eq("title", item.title)
      .select("id");
    if (error) {
      console.error("[hints] update failed:", error);
      continue;
    }
    updated += data?.length ?? 0;
  }

  return { status: "ok", updated };
}
