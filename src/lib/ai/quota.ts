import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types";

/** Kinds of AI calls that count against a user's quota. */
export type AiUsageKind = "generate" | "evaluate" | "hints" | "followup";

type Limits = Record<AiUsageKind, { perDay: number; perMinute: number }>;

/** Per-user limits (decision D8 in prompts/improvement-plan.md). */
export const AI_QUOTA: Limits = {
  generate: { perDay: 20, perMinute: 3 },
  evaluate: { perDay: 30, perMinute: 3 },
  hints: { perDay: 30, perMinute: 3 },
  followup: { perDay: 40, perMinute: 5 },
};

/**
 * Tighter limits for anonymous demo accounts (decision D5): enough to try
 * every feature once or twice, not enough to burn the shared Gemini quota.
 */
export const ANONYMOUS_AI_QUOTA: Limits = {
  generate: { perDay: 3, perMinute: 2 },
  evaluate: { perDay: 3, perMinute: 2 },
  hints: { perDay: 5, perMinute: 2 },
  followup: { perDay: 5, perMinute: 2 },
};

export type QuotaResult =
  { allowed: true } | { allowed: false; retryAfterSeconds: number; message: string };

function formatWait(seconds: number): string {
  if (seconds < 90) return `${seconds} detik`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 90) return `${minutes} menit`;
  return `${Math.ceil(minutes / 60)} jam`;
}

/**
 * Atomically consumes one unit of `kind` for the signed-in user.
 * Backed by the `consume_ai_quota` SQL function (migration 003), so
 * concurrent requests from the same user cannot slip past the limit.
 * A database error is treated as "not allowed" to protect the Gemini quota.
 */
export async function consumeAiQuota(
  supabase: SupabaseClient<Database>,
  kind: AiUsageKind,
  options: { anonymous?: boolean } = {},
): Promise<QuotaResult> {
  const limits = (options.anonymous ? ANONYMOUS_AI_QUOTA : AI_QUOTA)[kind];
  const { data, error } = await supabase.rpc("consume_ai_quota", {
    p_kind: kind,
    p_per_day: limits.perDay,
    p_per_minute: limits.perMinute,
  });

  const row = data?.[0];
  if (error || !row) {
    console.error("[quota] consume_ai_quota failed:", error);
    return {
      allowed: false,
      retryAfterSeconds: 60,
      message: "Tidak bisa memeriksa kuota AI saat ini. Coba lagi sebentar.",
    };
  }

  if (row.allowed) return { allowed: true };

  const wait = Math.max(1, row.retry_after_seconds);
  return {
    allowed: false,
    retryAfterSeconds: wait,
    message: options.anonymous
      ? `Batas mode demo tercapai. Buat akun gratis untuk lanjut, atau tunggu ${formatWait(wait)}.`
      : `Batas pemakaian AI tercapai. Kuota pulih dalam ${formatWait(wait)}.`,
  };
}
