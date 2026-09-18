import { NextResponse } from "next/server";
import { z } from "zod";

import { consumeAiQuota } from "@/lib/ai/quota";
import type { GenerateResponse } from "@/lib/api/contracts";
import { THINKING_BUDGET, generateJson } from "@/lib/gemini/generate";
import { OUTLINE_SYSTEM_INSTRUCTION, buildOutlinePrompt } from "@/lib/gemini/prompts";
import { GEMINI_ERROR_RESPONSE, GeminiError } from "@/lib/gemini/retry";
import {
  MAX_DURATION_SEC,
  MIN_DURATION_SEC,
  OUTLINE_RESPONSE_SCHEMA,
  OutlineGenerationSchema,
} from "@/lib/gemini/schemas";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const ROUTE_BUDGET_MS = 26_000;
const GEMINI_TIMEOUT_MS = 20_000;

const RequestSchema = z.object({
  topic: z.string().trim().min(3, "Topik terlalu pendek.").max(200),
});

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export async function POST(request: Request) {
  const started = Date.now();
  try {
    // --- Auth: only signed-in users may generate plans ---
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    // --- Validate request body ---
    const body: unknown = await request.json().catch(() => null);
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Topik tidak valid. Masukkan minimal 3 karakter." },
        { status: 400 },
      );
    }

    // --- Quota ---
    const quota = await consumeAiQuota(supabase, "generate");
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: quota.message,
          code: "quota",
          retryAfterSeconds: quota.retryAfterSeconds,
        },
        { status: 429, headers: { "Retry-After": String(quota.retryAfterSeconds) } },
      );
    }

    // --- Gemini ---
    const result = await generateJson({
      label: "outline",
      contents: buildOutlinePrompt(parsed.data.topic),
      systemInstruction: OUTLINE_SYSTEM_INSTRUCTION,
      responseSchema: OUTLINE_RESPONSE_SCHEMA,
      zodSchema: OutlineGenerationSchema,
      temperature: 0.7,
      thinkingBudget: THINKING_BUDGET.outline,
      timeoutMs: GEMINI_TIMEOUT_MS,
      budgetMs: ROUTE_BUDGET_MS - (Date.now() - started),
    });

    const payload: GenerateResponse = {
      outline: result.outline,
      sources: result.sources,
      estimated_duration_sec: clamp(
        result.estimated_duration_sec,
        MIN_DURATION_SEC,
        MAX_DURATION_SEC,
      ),
    };
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[challenge/generate] failed:", error);
    if (error instanceof GeminiError) {
      const response = GEMINI_ERROR_RESPONSE[error.code];
      return NextResponse.json(
        { error: response.message, code: error.code },
        { status: response.status },
      );
    }
    return NextResponse.json(
      { error: "Gagal membuat learning plan. Coba lagi sebentar." },
      { status: 500 },
    );
  }
}
