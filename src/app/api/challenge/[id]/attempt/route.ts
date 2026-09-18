import { NextResponse } from "next/server";
import { z } from "zod";

import { MAX_SCORE_BY_HINT } from "@/lib/utils/labels";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string }> };

const MetaSchema = z.object({
  hint_level_used: z.enum(["none", "keywords", "guiding_questions", "outline"]),
  duration_seconds: z.coerce.number().int().nonnegative().max(36_000),
});

function extensionFor(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    // Ownership (RLS-scoped).
    const { data: challenge } = await supabase
      .from("challenges")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!challenge) {
      return NextResponse.json({ error: "Challenge tidak ditemukan." }, { status: 404 });
    }

    const form = await request.formData().catch(() => null);
    const audio = form?.get("audio");
    if (!form || !(audio instanceof File) || audio.size === 0) {
      return NextResponse.json({ error: "Audio tidak ditemukan." }, { status: 400 });
    }

    const meta = MetaSchema.safeParse({
      hint_level_used: form.get("hint_level_used"),
      duration_seconds: form.get("duration_seconds"),
    });
    if (!meta.success) {
      return NextResponse.json(
        { error: "Metadata rekaman tidak valid." },
        { status: 400 },
      );
    }

    // attempt_number = existing count + 1
    const { count } = await supabase
      .from("attempts")
      .select("id", { count: "exact", head: true })
      .eq("challenge_id", id);
    const attemptNumber = (count ?? 0) + 1;

    const mime = audio.type || "audio/webm";
    const ext = extensionFor(mime);
    const path = `${user.id}/${id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("recordings")
      .upload(path, audio, { contentType: mime, upsert: false });
    if (uploadError) {
      console.error("[attempt POST] upload failed:", uploadError);
      return NextResponse.json({ error: "Gagal mengunggah audio." }, { status: 500 });
    }

    const { data: attempt, error: insertError } = await supabase
      .from("attempts")
      .insert({
        challenge_id: id,
        attempt_number: attemptNumber,
        audio_storage_path: path,
        duration_seconds: meta.data.duration_seconds,
        hint_level_used: meta.data.hint_level_used,
        max_possible_score: MAX_SCORE_BY_HINT[meta.data.hint_level_used],
        evaluation_status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !attempt) {
      // Roll back the uploaded file so we don't orphan storage.
      await supabase.storage.from("recordings").remove([path]);
      console.error("[attempt POST] insert failed:", insertError);
      return NextResponse.json({ error: "Gagal menyimpan attempt." }, { status: 500 });
    }

    return NextResponse.json({ attemptId: attempt.id }, { status: 201 });
  } catch (error) {
    console.error("[attempt POST] failed:", error);
    return NextResponse.json(
      { error: "Gagal mengirim rekaman. Coba lagi." },
      { status: 500 },
    );
  }
}
