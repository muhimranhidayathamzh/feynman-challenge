import { NextResponse } from "next/server";
import { z } from "zod";

import {
  GeneratedSourceSchema,
  MAX_DURATION_SEC,
  MIN_DURATION_SEC,
  OutlineItemSchema,
} from "@/lib/gemini/schemas";
import type { CreateChallengeResponse } from "@/lib/api/contracts";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CreateChallengeSchema = z.object({
  topic: z.string().trim().min(3).max(200),
  deadline: z.iso.date().nullable().optional(),
  estimated_duration_sec: z
    .number()
    .int()
    .positive()
    .transform((value) => Math.min(MAX_DURATION_SEC, Math.max(MIN_DURATION_SEC, value))),
  outline: z.array(OutlineItemSchema).min(1),
  sources: z.array(GeneratedSourceSchema).default([]),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = CreateChallengeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data challenge tidak valid." }, { status: 400 });
    }

    const { topic, deadline, estimated_duration_sec, outline, sources } = parsed.data;

    // 1. Create the challenge (RLS enforces user_id = auth.uid()).
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .insert({
        user_id: user.id,
        title: topic,
        deadline: deadline ?? null,
        recording_duration_sec: estimated_duration_sec,
      })
      .select("id")
      .single();

    if (challengeError || !challenge) {
      console.error("[challenge] create failed:", challengeError);
      return NextResponse.json({ error: "Gagal menyimpan challenge." }, { status: 500 });
    }

    // 2. Outline items — order preserved, all AI-generated.
    const outlineRows = outline.map((item, index) => ({
      challenge_id: challenge.id,
      order_index: index,
      title: item.title,
      description: item.description.length > 0 ? item.description : null,
      is_user_added: false,
    }));

    const { error: outlineError } = await supabase
      .from("challenge_outlines")
      .insert(outlineRows);

    if (outlineError) {
      // No transactions over the REST API — undo the challenge so we don't
      // leave an orphan (cascade removes any partial children).
      await supabase.from("challenges").delete().eq("id", challenge.id);
      console.error("[challenge] outline insert failed:", outlineError);
      return NextResponse.json({ error: "Gagal menyimpan outline." }, { status: 500 });
    }

    // 3. Sources (optional) — all AI-suggested.
    if (sources.length > 0) {
      const sourceRows = sources.map((source) => ({
        challenge_id: challenge.id,
        title: source.title,
        url: source.url,
        source_type: source.type,
        is_ai_suggested: true,
      }));

      const { error: sourceError } = await supabase
        .from("challenge_sources")
        .insert(sourceRows);

      if (sourceError) {
        await supabase.from("challenges").delete().eq("id", challenge.id);
        console.error("[challenge] source insert failed:", sourceError);
        return NextResponse.json(
          { error: "Gagal menyimpan sumber belajar." },
          { status: 500 },
        );
      }
    }

    const payload: CreateChallengeResponse = { id: challenge.id };
    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    console.error("[challenge] POST failed:", error);
    return NextResponse.json(
      { error: "Gagal membuat challenge. Coba lagi." },
      { status: 500 },
    );
  }
}
