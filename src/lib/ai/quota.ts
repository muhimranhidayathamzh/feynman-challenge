import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types";

import { costUnitsFor, type AiCallUsage } from "./usage";
import { logError } from "@/lib/monitoring/report";

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

/**
 * Why a call was refused, as returned by `consume_ai_quota` (migration 007).
 * `disabled` and `global` are app-wide brakes; the rest are per-user limits.
 */
export type QuotaReason = "ok" | "disabled" | "global" | "minute" | "day" | "anon";

export type QuotaResult =
  | {
      allowed: true;
      /**
       * The `ai_usage` row this call just claimed. Pass it to recordAiUsage
       * once Gemini answers, to complete it with what the call actually cost.
       */
      usageId: string | null;
    }
  | {
      allowed: false;
      reason: QuotaReason;
      retryAfterSeconds: number;
      message: string;
      /** 503 when the brake is ours, 429 when the user hit their own limit. */
      status: 429 | 503;
    };

function formatWait(seconds: number): string {
  if (seconds < 90) return `${seconds} detik`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 90) return `${minutes} menit`;
  return `${Math.ceil(minutes / 60)} jam`;
}

/** Copy shown to the learner. Never blames them for an app-wide brake. */
function refusal(
  reason: QuotaReason,
  wait: number,
  anonymous: boolean,
): { message: string; status: 429 | 503 } {
  switch (reason) {
    case "disabled":
      return {
        message:
          "Fitur AI sedang dimatikan sementara. Catatan dan rekamanmu aman, coba lagi nanti.",
        status: 503,
      };
    case "global":
      return {
        message:
          "Pemakaian AI hari ini sudah mencapai batas aman aplikasi. Coba lagi beberapa jam lagi.",
        status: 503,
      };
    default:
      return {
        message: anonymous
          ? `Batas mode demo tercapai. Buat akun gratis untuk lanjut, atau tunggu ${formatWait(wait)}.`
          : `Batas pemakaian AI tercapai. Kuota pulih dalam ${formatWait(wait)}.`,
        status: 429,
      };
  }
}

/**
 * Atomically consumes one unit of `kind` for the signed-in user.
 * Backed by the `consume_ai_quota` SQL function (migrations 003 and 007), so
 * concurrent requests from the same user cannot slip past the limit. It also
 * enforces the app-wide kill switch and daily ceiling in `app_settings`.
 * A database error is treated as "not allowed" to protect the Gemini quota.
 */
export async function consumeAiQuota(
  supabase: SupabaseClient<Database>,
  kind: AiUsageKind,
  options: { anonymous?: boolean } = {},
): Promise<QuotaResult> {
  const anonymous = options.anonymous ?? false;
  const limits = (anonymous ? ANONYMOUS_AI_QUOTA : AI_QUOTA)[kind];
  const { data, error } = await supabase.rpc("consume_ai_quota", {
    p_kind: kind,
    p_per_day: limits.perDay,
    p_per_minute: limits.perMinute,
    p_cost_units: costUnitsFor(kind),
  });

  const row = data?.[0];
  if (error || !row) {
    logError("[quota] consume_ai_quota failed:", error);
    return {
      allowed: false,
      reason: "disabled",
      retryAfterSeconds: 60,
      message: "Tidak bisa memeriksa kuota AI saat ini. Coba lagi sebentar.",
      status: 503,
    };
  }

  if (row.allowed) return { allowed: true, usageId: row.usage_id ?? null };

  const reason = (row.reason ?? "day") as QuotaReason;
  const wait = Math.max(1, row.retry_after_seconds);
  const { message, status } = refusal(reason, wait, anonymous);

  if (reason === "disabled" || reason === "global") {
    console.warn(`[quota] app-wide brake engaged (${reason}) for kind=${kind}`);
  }

  return { allowed: false, reason, retryAfterSeconds: wait, message, status };
}

/**
 * Completes the `ai_usage` row that consumeAiQuota claimed with what the call
 * actually cost. Call it from `after()`, so accounting never adds to the time
 * the learner waits.
 *
 * Accounting must never break a request that already succeeded, so every
 * failure here is swallowed after being logged.
 */
export async function recordAiUsage(
  supabase: SupabaseClient<Database>,
  usageId: string | null,
  usage: AiCallUsage | null,
): Promise<void> {
  if (!usageId || !usage) return;

  const { error } = await supabase.rpc("record_ai_usage", {
    p_usage_id: usageId,
    p_model: usage.model,
    p_prompt_tokens: usage.promptTokens,
    p_output_tokens: usage.outputTokens,
    p_thinking_tokens: usage.thinkingTokens,
    p_latency_ms: usage.latencyMs,
  });

  if (error) console.warn("[quota] record_ai_usage failed:", error.message);
}
