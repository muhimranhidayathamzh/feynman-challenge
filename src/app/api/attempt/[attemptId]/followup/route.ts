import { NextResponse, after } from "next/server";
import { createPartFromBase64 } from "@google/genai";
import { z } from "zod";

import { consumeAiQuota, recordAiUsage } from "@/lib/ai/quota";
import type { AiCallUsage } from "@/lib/ai/usage";
import {
  AUDIO_ISSUE_MESSAGES,
  FollowupRequestSchema,
  type FollowupAnswer,
  type FollowupResponse,
} from "@/lib/api/contracts";
import { generateJson } from "@/lib/gemini/generate";
import { FOLLOWUP_SYSTEM_INSTRUCTION, buildFollowupPrompt } from "@/lib/gemini/prompts";
import { GEMINI_ERROR_RESPONSE, GeminiError } from "@/lib/gemini/retry";
import { FOLLOWUP_RESPONSE_SCHEMA, FollowupResultSchema } from "@/lib/gemini/schemas";
import {
  RECORDINGS_BUCKET,
  contentTypeForPath,
  isOwnFollowupPath,
  splitRecordingPath,
} from "@/lib/storage/recording-path";
import { createClient } from "@/lib/supabase/server";
import { parseStoredFollowUps } from "@/lib/utils/followups";
import { rateLimit } from "@/lib/api/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const ROUTE_BUDGET_MS = 50_000;
const GEMINI_TIMEOUT_MS = 40_000;

type RouteContext = { params: Promise<{ attemptId: string }> };

/**
 * Grades a short spoken answer to one Socratic follow-up question.
 * Never touches scores, mastery, reviews, or the streak.
 */
export async function POST(request: Request, context: RouteContext) {
  const limited = rateLimit(request, "ai");
  if (limited) return limited;
  const started = Date.now();
  const { attemptId } = await context.params;
  if (!z.uuid().safeParse(attemptId).success) {
    return NextResponse.json({ error: "ID percobaan tidak valid." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = FollowupRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data jawaban tidak valid." }, { status: 400 });
  }
  const { question_index, storage_path: path } = parsed.data;

  const storage = supabase.storage.from(RECORDINGS_BUCKET);
  const discardAudio = () => storage.remove([path]).catch(() => undefined);

  try {
    // Attempt + its questions (RLS-scoped to the owner).
    const { data: attempt } = await supabase
      .from("attempts")
      .select("id, challenge_id, follow_up_questions")
      .eq("id", attemptId)
      .maybeSingle();
    if (!attempt) {
      return NextResponse.json({ error: "Percobaan tidak ditemukan." }, { status: 404 });
    }
    const question = parseStoredFollowUps(attempt.follow_up_questions)[question_index];
    if (!question) {
      return NextResponse.json({ error: "Pertanyaan tidak ditemukan." }, { status: 404 });
    }
    if (!isOwnFollowupPath(path, user.id, attempt.challenge_id)) {
      return NextResponse.json({ error: "Lokasi audio tidak valid." }, { status: 400 });
    }

    const { folder, name } = splitRecordingPath(path);
    const { data: objects } = await storage.list(folder, { search: name, limit: 1 });
    if (!objects?.some((object) => object.name === name)) {
      return NextResponse.json(
        { error: "Audio belum terunggah. Coba kirim ulang." },
        { status: 400 },
      );
    }

    const quota = await consumeAiQuota(supabase, "followup", {
      anonymous: user.is_anonymous ?? false,
    });
    if (!quota.allowed) {
      await discardAudio();
      return NextResponse.json(
        {
          error: quota.message,
          code: "quota",
          retryAfterSeconds: quota.retryAfterSeconds,
        },
        { status: quota.status },
      );
    }

    const [{ data: challenge }, { data: outline }] = await Promise.all([
      supabase.from("challenges").select("title").eq("id", attempt.challenge_id).single(),
      supabase
        .from("challenge_outlines")
        .select("title, description")
        .eq("challenge_id", attempt.challenge_id)
        .order("order_index"),
    ]);
    const point =
      question.outline_index !== null
        ? (outline?.[question.outline_index - 1] ?? null)
        : null;

    const { data: audioFile, error: downloadError } = await storage.download(path);
    if (downloadError || !audioFile) {
      return NextResponse.json(
        { error: "Audio jawaban tidak bisa diambil. Coba kirim ulang." },
        { status: 500 },
      );
    }
    const base64 = Buffer.from(await audioFile.arrayBuffer()).toString("base64");

    // Accounting only: recorded after the response, never in the hot path.
    let usage: AiCallUsage | null = null;

    const result = await generateJson({
      onUsage: (value) => {
        usage = value;
      },
      label: "followup",
      contents: [
        {
          text: buildFollowupPrompt({
            topic: challenge?.title ?? "",
            point,
            question: question.question,
          }),
        },
        createPartFromBase64(base64, contentTypeForPath(path)),
      ],
      systemInstruction: FOLLOWUP_SYSTEM_INSTRUCTION,
      responseSchema: FOLLOWUP_RESPONSE_SCHEMA,
      zodSchema: FollowupResultSchema,
      temperature: 0.2,
      thinkingBudget: 256,
      timeoutMs: GEMINI_TIMEOUT_MS,
      budgetMs: ROUTE_BUDGET_MS - (Date.now() - started),
    });

    after(() => recordAiUsage(supabase, quota.usageId, usage));

    // Unusable audio: store the explanation instead of a verdict.
    const issue = result.audio_issue;
    const graded = issue === "none";
    const row = {
      attempt_id: attemptId,
      question_index,
      question: question.question,
      outline_index: question.outline_index,
      audio_storage_path: path,
      transcript: result.transcript,
      verdict: graded ? result.verdict : null,
      feedback: issue === "none" ? result.feedback : AUDIO_ISSUE_MESSAGES[issue],
      hint: graded ? result.hint || null : null,
    };

    // Answering again replaces the previous answer (and its audio).
    const { data: previous } = await supabase
      .from("attempt_followups")
      .select("audio_storage_path")
      .eq("attempt_id", attemptId)
      .eq("question_index", question_index)
      .maybeSingle();

    const { data: saved, error: saveError } = await supabase
      .from("attempt_followups")
      .upsert(row, { onConflict: "attempt_id,question_index" })
      .select("question_index, transcript, verdict, feedback, hint")
      .single();
    if (saveError || !saved) {
      console.error("[followup] save failed:", saveError);
      return NextResponse.json({ error: "Gagal menyimpan jawaban." }, { status: 500 });
    }

    if (previous?.audio_storage_path && previous.audio_storage_path !== path) {
      await storage.remove([previous.audio_storage_path]).catch(() => undefined);
    }

    const answer: FollowupAnswer = saved;
    const payload: FollowupResponse = { answer };
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[followup] failed:", error);
    await discardAudio();
    if (error instanceof GeminiError) {
      const response = GEMINI_ERROR_RESPONSE[error.code];
      return NextResponse.json(
        { error: response.message, code: error.code },
        { status: response.status },
      );
    }
    return NextResponse.json(
      { error: "Gagal menilai jawaban. Coba lagi." },
      { status: 500 },
    );
  }
}
