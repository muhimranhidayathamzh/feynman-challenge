import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getUserClock } from "@/lib/utils/user-day";
import type { Database } from "@/types";

import {
  DEMO_ATTEMPT,
  DEMO_CHALLENGE,
  DEMO_NOTES,
  DEMO_OUTLINE,
  DEMO_SOURCES,
} from "./fixture";
import { planDemo } from "./plan";

export type DemoSeedResult =
  | { ok: true; challengeId: string; attemptId: string | null; seeded: boolean }
  | { ok: false };

/**
 * Creates the example challenge for a demo account: outline with hints,
 * sources, notes, and one evaluated attempt. No Gemini call. Idempotent: an
 * account that already has a challenge gets that one back. Runs with the
 * user's own client, so RLS applies to every write. If any step fails, the
 * half-built challenge is deleted (children cascade).
 */
export async function seedDemoChallenge(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<DemoSeedResult> {
  const { data: existing } = await supabase
    .from("challenges")
    .select("id")
    .eq("user_id", userId)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (existing) {
    return { ok: true, challengeId: existing.id, attemptId: null, seeded: false };
  }

  const { today } = await getUserClock(supabase, userId);
  const plan = planDemo(today);
  const now = new Date().toISOString();

  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .insert({
      user_id: userId,
      title: DEMO_CHALLENGE.title,
      recording_duration_sec: DEMO_CHALLENGE.recordingDurationSec,
      deadline: plan.deadline,
      mastery_state: plan.masteryState,
      mastery_updated_at: now,
      latest_score: plan.overallScore,
      best_score: plan.overallScore,
      last_attempt_at: now,
      review_box: plan.reviewBox,
      next_review_at: plan.nextReviewAt,
    })
    .select("id")
    .single();
  if (challengeError || !challenge) {
    console.error("[demo] challenge insert failed:", challengeError);
    return { ok: false };
  }
  const challengeId = challenge.id;

  const [outlineResult, sourcesResult, notesResult, attemptResult] = await Promise.all([
    supabase.from("challenge_outlines").insert(
      DEMO_OUTLINE.map((item, index) => ({
        challenge_id: challengeId,
        order_index: index,
        title: item.title,
        description: item.description,
        keywords: item.keywords,
        guiding_question: item.guiding_question,
      })),
    ),
    supabase.from("challenge_sources").insert(
      DEMO_SOURCES.map((source) => ({
        challenge_id: challengeId,
        title: source.title,
        url: source.url,
        source_type: source.source_type,
        is_ai_suggested: true,
      })),
    ),
    supabase
      .from("challenge_notes")
      .insert({ challenge_id: challengeId, content: DEMO_NOTES }),
    supabase
      .from("attempts")
      .insert({
        challenge_id: challengeId,
        attempt_number: 1,
        audio_storage_path: null,
        duration_seconds: DEMO_ATTEMPT.durationSeconds,
        hint_level_used: "none",
        max_possible_score: plan.maxScore,
        transcript: DEMO_ATTEMPT.transcript,
        overall_score: plan.overallScore,
        comprehensiveness_score: DEMO_ATTEMPT.subScores.comprehensiveness,
        accuracy_score: DEMO_ATTEMPT.subScores.accuracy,
        clarity_score: DEMO_ATTEMPT.subScores.clarity,
        feedback: DEMO_ATTEMPT.feedback,
        strengths: DEMO_ATTEMPT.strengths,
        improvements: DEMO_ATTEMPT.improvements,
        coverage: DEMO_ATTEMPT.coverage,
        unexplained_jargon: DEMO_ATTEMPT.unexplainedJargon,
        follow_up_questions: DEMO_ATTEMPT.followUpQuestions,
        audio_issue: "none",
        evaluation_status: "completed",
      })
      .select("id")
      .single(),
  ]);

  const error =
    outlineResult.error ??
    sourcesResult.error ??
    notesResult.error ??
    attemptResult.error;
  if (error || !attemptResult.data) {
    console.error("[demo] seed failed:", error);
    await supabase.from("challenges").delete().eq("id", challengeId);
    return { ok: false };
  }
  return { ok: true, challengeId, attemptId: attemptResult.data.id, seeded: true };
}
