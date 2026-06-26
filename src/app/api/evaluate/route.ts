import { NextResponse } from "next/server";
import { createPartFromBase64 } from "@google/genai";
import { z } from "zod";

import { GEMINI_MODEL, getGeminiClient } from "@/lib/gemini/client";
import {
  buildEvaluationPrompt,
  EVALUATION_SYSTEM_INSTRUCTION,
} from "@/lib/gemini/prompts";
import {
  EVALUATION_RESPONSE_SCHEMA,
  EvaluationResultSchema,
} from "@/lib/gemini/schemas";
import { computeMasteryAfterAttempt } from "@/lib/utils/mastery";
import { computeStreakOnActivity } from "@/lib/utils/streak";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({ attemptId: z.string().uuid() });

function clampScore(value: number, max: number): number {
  return Math.max(0, Math.min(max, Math.round(value)));
}

function mimeFromPath(path: string): string {
  if (path.endsWith(".mp4")) return "audio/mp4";
  if (path.endsWith(".ogg")) return "audio/ogg";
  return "audio/webm";
}

export async function POST(request: Request) {
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
    return NextResponse.json({ error: "attemptId tidak valid." }, { status: 400 });
  }
  const { attemptId } = parsed.data;

  // --- Fetch attempt (RLS scopes to the owner's challenges) ---
  const { data: attempt } = await supabase
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt) {
    return NextResponse.json({ error: "Attempt tidak ditemukan." }, { status: 404 });
  }

  // Idempotent: don't re-charge Gemini if it's already done.
  if (attempt.evaluation_status === "completed") {
    return NextResponse.json({
      ok: true,
      evaluation_status: "completed",
      overall_score: attempt.overall_score,
    });
  }

  if (!attempt.audio_storage_path) {
    return NextResponse.json({ error: "Audio attempt tidak ada." }, { status: 400 });
  }

  try {
    await supabase
      .from("attempts")
      .update({ evaluation_status: "processing" })
      .eq("id", attemptId);

    // --- Gather context: challenge + outline + notes ---
    const { data: challenge } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", attempt.challenge_id)
      .maybeSingle();
    if (!challenge) {
      return NextResponse.json({ error: "Challenge tidak ditemukan." }, { status: 404 });
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

    // --- Download audio from Storage and base64-encode for Gemini ---
    const { data: audioFile, error: downloadError } = await supabase.storage
      .from("recordings")
      .download(attempt.audio_storage_path);
    if (downloadError || !audioFile) {
      throw new Error("Gagal mengunduh audio dari storage.");
    }
    const base64 = Buffer.from(await audioFile.arrayBuffer()).toString("base64");
    const mime = mimeFromPath(attempt.audio_storage_path);

    // --- Call Gemini (multimodal: prompt + inline audio) ---
    const maxScore = attempt.max_possible_score ?? 10;
    const prompt = buildEvaluationPrompt({
      outline: outline ?? [],
      notes: note?.content ?? null,
      hintLevel: attempt.hint_level_used,
      maxScore,
    });

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ text: prompt }, createPartFromBase64(base64, mime)],
      config: {
        systemInstruction: EVALUATION_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: EVALUATION_RESPONSE_SCHEMA,
        temperature: 0.4,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Gemini tidak memberikan respons.");

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error("Respons AI tidak dapat dibaca.");
    }

    const result = EvaluationResultSchema.safeParse(json);
    if (!result.success) {
      throw new Error("Format respons AI tidak sesuai.");
    }
    const data = result.data;

    // --- Cap + persist on the attempt ---
    const overall = clampScore(data.overall_score, maxScore);
    const comprehensiveness = clampScore(data.sub_scores.comprehensiveness, 10);
    const accuracy = clampScore(data.sub_scores.accuracy, 10);
    const clarity = clampScore(data.sub_scores.clarity, 10);

    await supabase
      .from("attempts")
      .update({
        transcript: data.transcript,
        overall_score: overall,
        comprehensiveness_score: comprehensiveness,
        accuracy_score: accuracy,
        clarity_score: clarity,
        feedback: data.feedback,
        strengths: data.strengths as Json,
        improvements: data.improvements as Json,
        coverage: data.coverage as Json,
        evaluation_status: "completed",
      })
      .eq("id", attemptId);

    // --- Update challenge: scores + mastery state ---
    const { data: prevAttempts } = await supabase
      .from("attempts")
      .select("overall_score")
      .eq("challenge_id", attempt.challenge_id)
      .neq("id", attemptId)
      .not("overall_score", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);
    const previousScore = prevAttempts?.[0]?.overall_score ?? null;

    const newState = computeMasteryAfterAttempt({
      current: challenge.mastery_state,
      score: overall,
      previousScore,
      masteryUpdatedAt: challenge.mastery_updated_at,
    });
    const stateChanged = newState !== challenge.mastery_state;

    await supabase
      .from("challenges")
      .update({
        latest_score: overall,
        best_score: Math.max(challenge.best_score ?? 0, overall),
        mastery_state: newState,
        mastery_updated_at: stateChanged
          ? new Date().toISOString()
          : challenge.mastery_updated_at,
      })
      .eq("id", challenge.id);

    // --- Streak: count this completed evaluation as today's activity ---
    const { data: profile } = await supabase
      .from("profiles")
      .select("streak_count, best_streak, last_active_date")
      .eq("id", user.id)
      .maybeSingle();
    if (profile) {
      const streak = computeStreakOnActivity({
        lastActiveDate: profile.last_active_date,
        currentStreak: profile.streak_count,
        bestStreak: profile.best_streak,
      });
      if (streak.changed) {
        await supabase
          .from("profiles")
          .update({
            streak_count: streak.streakCount,
            best_streak: streak.bestStreak,
            last_active_date: streak.lastActiveDate,
          })
          .eq("id", user.id);
      }
    }

    return NextResponse.json({
      ok: true,
      evaluation_status: "completed",
      overall_score: overall,
      mastery_state: newState,
    });
  } catch (error) {
    console.error("[evaluate] failed:", error);
    await supabase
      .from("attempts")
      .update({ evaluation_status: "error" })
      .eq("id", attemptId);
    return NextResponse.json(
      { error: "Gagal mengevaluasi rekaman. Coba lagi.", evaluation_status: "error" },
      { status: 500 },
    );
  }
}
