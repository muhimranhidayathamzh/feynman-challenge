import { NextResponse } from "next/server";
import { z } from "zod";

import { GEMINI_MODEL, getGeminiClient } from "@/lib/gemini/client";
import { buildOutlinePrompt, OUTLINE_SYSTEM_INSTRUCTION } from "@/lib/gemini/prompts";
import {
  MAX_DURATION_SEC,
  MIN_DURATION_SEC,
  OUTLINE_RESPONSE_SCHEMA,
  OutlineGenerationSchema,
} from "@/lib/gemini/schemas";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const RequestSchema = z.object({
  topic: z.string().trim().min(3, "Topik terlalu pendek.").max(200),
});

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export async function POST(request: Request) {
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

    // --- Call Gemini ---
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildOutlinePrompt(parsed.data.topic),
      config: {
        systemInstruction: OUTLINE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: OUTLINE_RESPONSE_SCHEMA,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json(
        { error: "AI tidak memberikan respons. Coba lagi." },
        { status: 502 },
      );
    }

    // --- Parse + validate the model output ---
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Respons AI tidak dapat dibaca. Coba lagi." },
        { status: 502 },
      );
    }

    const result = OutlineGenerationSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { error: "Format respons AI tidak sesuai. Coba lagi." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      outline: result.data.outline,
      sources: result.data.sources,
      estimated_duration_sec: clamp(
        result.data.estimated_duration_sec,
        MIN_DURATION_SEC,
        MAX_DURATION_SEC,
      ),
    });
  } catch (error) {
    console.error("[challenge/generate] failed:", error);
    return NextResponse.json(
      { error: "Gagal membuat learning plan. Coba lagi sebentar." },
      { status: 500 },
    );
  }
}
