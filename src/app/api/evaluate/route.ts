import { NextResponse, after } from "next/server";
import { z } from "zod";

import { evaluateExplanation } from "@/lib/ai/evaluate";
import { consumeAiQuota, recordAiUsage } from "@/lib/ai/quota";
import type { AiCallUsage } from "@/lib/ai/usage";
import type { EvaluateResponse } from "@/lib/api/contracts";
import {
  GEMINI_ERROR_RESPONSE,
  GeminiError,
  type GeminiErrorCode,
} from "@/lib/gemini/retry";
import { RECORDINGS_BUCKET, contentTypeForPath } from "@/lib/storage/recording-path";
import { createClient } from "@/lib/supabase/server";
import { computeMasteryAfterAttempt, effectiveMasteryState } from "@/lib/utils/mastery";
import { computeReviewAfterAttempt } from "@/lib/utils/review";
import { computeStreakOnActivity } from "@/lib/utils/streak";
import { getUserClock } from "@/lib/utils/user-day";
import { rateLimit } from "@/lib/api/rate-limit";
import { logError } from "@/lib/monitoring/report";
import { latencyBucket } from "@/lib/utils/error-scrub";
import type { Json } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Everything (retries included) must finish inside maxDuration. */
const ROUTE_BUDGET_MS = 55_000;

const RequestSchema = z.object({ attemptId: z.uuid() });

/** Stored in attempts.evaluation_error so the client can explain the failure. */
type EvaluationErrorCode = GeminiErrorCode | "storage";

class StorageFailure extends Error {}

const STORAGE_RESPONSE = { status: 500, message: "Gagal mengunduh audio dari storage." };

export async function POST(request: Request) {
  const limited = rateLimit(request, "ai");
  if (limited) return limited;
  const started = Date.now();
  const supabase = await createClient();

  // --- Auth ---
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  // --- Validate body ---
  const body: unknown = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ID percobaan tidak valid." }, { status: 400 });
  }
  const { attemptId } = parsed.data;

  // --- Fetch attempt (RLS scopes to the owner's challenges) ---
  const { data: existing } = await supabase
    .from("attempts")
    .select("id, evaluation_status, overall_score, audio_storage_path")
    .eq("id", attemptId)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Percobaan tidak ditemukan." }, { status: 404 });
  }
  if (existing.evaluation_status === "completed") {
    return NextResponse.json({
      ok: true,
      evaluation_status: "completed",
      overall_score: existing.overall_score,
    });
  }
  if (!existing.audio_storage_path) {
    return NextResponse.json({ error: "Audio percobaan tidak ada." }, { status: 400 });
  }

  // --- Claim: exactly one worker may evaluate this attempt ---
  const { data: claimedRows, error: claimError } = await supabase.rpc(
    "claim_attempt_evaluation",
    { p_attempt_id: attemptId },
  );
  if (claimError) {
    logError("[evaluate] claim failed:", claimError);
    return NextResponse.json({ error: "Gagal memulai evaluasi." }, { status: 500 });
  }
  const attempt = claimedRows?.[0];
  if (!attempt) {
    // Someone else holds a fresh claim (or just finished). Never call Gemini.
    const { data: current } = await supabase
      .from("attempts")
      .select("evaluation_status, overall_score")
      .eq("id", attemptId)
      .maybeSingle();
    if (current?.evaluation_status === "completed") {
      return NextResponse.json({
        ok: true,
        evaluation_status: "completed",
        overall_score: current.overall_score,
      });
    }
    const processing: EvaluateResponse = { evaluation_status: "processing" };
    return NextResponse.json(processing, { status: 202 });
  }

  const markError = async (code: EvaluationErrorCode) => {
    await supabase
      .from("attempts")
      .update({ evaluation_status: "error", evaluation_error: code })
      .eq("id", attemptId)
      .eq("evaluation_status", "processing");
  };

  // --- Quota: counted only after the claim, so retries aren't double-charged ---
  const quota = await consumeAiQuota(supabase, "evaluate", {
    anonymous: user.is_anonymous ?? false,
  });
  if (!quota.allowed) {
    await markError("quota");
    return NextResponse.json(
      {
        error: quota.message,
        evaluation_status: "error",
        code: "quota",
        retryAfterSeconds: quota.retryAfterSeconds,
      },
      {
        status: quota.status,
        headers: { "Retry-After": String(quota.retryAfterSeconds) },
      },
    );
  }

  try {
    // --- Context: challenge + outline + notes ---
    const { data: challenge } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", attempt.challenge_id)
      .maybeSingle();
    if (!challenge) {
      await markError("unknown");
      return NextResponse.json({ error: "Tantangan tidak ditemukan." }, { status: 404 });
    }

    const [{ data: outline }, { data: note }] = await Promise.all([
      supabase
        .from("challenge_outlines")
        .select("title, description")
        .eq("challenge_id", attempt.challenge_id)
        .order("order_index"),
      supabase
        .from("challenge_notes")
        .select("content")
        .eq("challenge_id", attempt.challenge_id)
        .maybeSingle(),
    ]);

    // --- Audio from Storage, inline as base64 ---
    const audioPath = attempt.audio_storage_path ?? existing.audio_storage_path;
    const { data: audioFile, error: downloadError } = await supabase.storage
      .from(RECORDINGS_BUCKET)
      .download(audioPath);
    if (downloadError || !audioFile) {
      throw new StorageFailure(downloadError?.message ?? "download failed");
    }
    const base64 = Buffer.from(await audioFile.arrayBuffer()).toString("base64");

    // --- Gemini (multimodal): prompt, call, coverage, server-side scores ---
    // The same core the eval-golden runner measures (src/lib/ai/evaluate.ts).
    const maxScore = attempt.max_possible_score ?? 10;

    // Accounting only: recorded after the response, never in the hot path.
    let usage: AiCallUsage | null = null;

    const outcome = await evaluateExplanation({
      audioBase64: base64,
      mimeType: contentTypeForPath(audioPath),
      outline: outline ?? [],
      notes: note?.content ?? null,
      hintLevel: attempt.hint_level_used,
      maxScore,
      budgetMs: ROUTE_BUDGET_MS - (Date.now() - started),
      onUsage: (value) => {
        usage = value;
      },
    });
    const { result } = outcome;

    after(() => recordAiUsage(supabase, quota.usageId, usage));

    // --- Audio could not be judged: complete WITHOUT scores ---
    // No mastery, latest_score, last_attempt_at, or streak change.
    if (outcome.kind === "rejected") {
      const { error: rejectError } = await supabase.rpc("finalize_attempt_rejected", {
        p_attempt_id: attemptId,
        p_transcript: result.transcript,
        p_audio_issue: outcome.audioIssue,
        p_feedback: result.feedback,
      });
      if (rejectError) {
        logError("[evaluate] finalize_rejected failed:", rejectError);
        throw new Error("finalize rejected failed");
      }
      const rejected: EvaluateResponse = {
        evaluation_status: "completed",
        overall_score: null,
        audio_issue: outcome.audioIssue,
      };
      return NextResponse.json(rejected);
    }

    const { coverage, jargon, followUps, subScores, overall } = outcome;

    // --- Mastery ---
    const { data: prevAttempts } = await supabase
      .from("attempts")
      .select("overall_score")
      .eq("challenge_id", attempt.challenge_id)
      .neq("id", attemptId)
      .not("overall_score", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);
    const previousScore = prevAttempts?.[0]?.overall_score ?? null;

    const { today } = await getUserClock(supabase, user.id);

    // --- Spaced repetition: next box + review day ---
    const reviewBefore = {
      box: challenge.review_box,
      nextReviewAt: challenge.next_review_at,
    };
    const review = computeReviewAfterAttempt({
      state: reviewBefore,
      score: overall,
      today,
    });

    // Start from the effective (possibly slipped) state so a lapsed challenge
    // has to earn its way back instead of jumping ahead.
    const currentState = effectiveMasteryState(
      challenge.mastery_state,
      reviewBefore,
      today,
    );
    const newState = computeMasteryAfterAttempt({
      current: currentState,
      score: overall,
      previousScore,
      reviewBox: review.box,
    });

    // --- Streak ---
    const { data: profile } = await supabase
      .from("profiles")
      .select("streak_count, best_streak, last_active_date")
      .eq("id", user.id)
      .maybeSingle();
    const streak = computeStreakOnActivity({
      lastActiveDate: profile?.last_active_date ?? null,
      currentStreak: profile?.streak_count ?? 0,
      bestStreak: profile?.best_streak ?? 0,
      today,
    });

    // --- Persist everything in one transaction ---
    const { error: finalizeError } = await supabase.rpc("finalize_attempt_evaluation", {
      p_attempt_id: attemptId,
      p_transcript: result.transcript,
      p_overall_score: overall,
      p_comprehensiveness_score: subScores.comprehensiveness,
      p_accuracy_score: subScores.accuracy,
      p_clarity_score: subScores.clarity,
      p_feedback: result.feedback,
      p_strengths: result.strengths as Json,
      p_improvements: result.improvements as Json,
      p_coverage: coverage as Json,
      p_unexplained_jargon: jargon,
      p_follow_up_questions: followUps,
      p_mastery_state: newState,
      p_mastery_changed: newState !== challenge.mastery_state,
      p_review_box: review.box,
      p_next_review_at: review.nextReviewAt ?? today,
      p_streak_count: streak.streakCount,
      p_best_streak: streak.bestStreak,
      p_last_active_date: streak.changed ? streak.lastActiveDate : null,
    });
    if (finalizeError) {
      logError("[evaluate] finalize failed:", finalizeError);
      throw new Error("finalize failed");
    }

    const done: EvaluateResponse = {
      evaluation_status: "completed",
      overall_score: overall,
      mastery_state: newState,
    };
    return NextResponse.json(done);
  } catch (error) {
    let code: EvaluationErrorCode = "unknown";
    if (error instanceof GeminiError) code = error.code;
    else if (error instanceof StorageFailure) code = "storage";
    logError("[evaluate] failed:", error, {
      ai_kind: "evaluate",
      gemini_code: code,
      latency: latencyBucket(Date.now() - started),
    });
    await markError(code);

    const response = code === "storage" ? STORAGE_RESPONSE : GEMINI_ERROR_RESPONSE[code];
    return NextResponse.json(
      { error: response.message, evaluation_status: "error", code },
      { status: response.status },
    );
  }
}
