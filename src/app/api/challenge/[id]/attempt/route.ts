import { NextResponse } from "next/server";

import {
  AttemptCreateRequestSchema,
  type AttemptCreateResponse,
} from "@/lib/api/contracts";

import {
  RECORDINGS_BUCKET,
  isOwnRecordingPath,
  splitRecordingPath,
} from "@/lib/storage/recording-path";
import { MAX_SCORE_BY_HINT } from "@/lib/utils/labels";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * The audio itself is uploaded by the browser straight to Storage
 * (see src/lib/audio/upload.ts). This route only registers the attempt.
 */

const UNIQUE_VIOLATION = "23505";
const MAX_INSERT_RETRIES = 3;

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = AttemptCreateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Metadata rekaman tidak valid." }, { status: 400 });
  }
  const { storage_path: path, hint_level_used, duration_seconds } = parsed.data;

  // The path must be exactly {user.id}/{id}/{uuid}.{ext}. Anything else is
  // rejected before we touch Storage or the database.
  if (!isOwnRecordingPath(path, user.id, id)) {
    return NextResponse.json({ error: "Lokasi audio tidak valid." }, { status: 400 });
  }

  const storage = supabase.storage.from(RECORDINGS_BUCKET);

  try {
    // Ownership (RLS-scoped).
    const { data: challenge } = await supabase
      .from("challenges")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!challenge) {
      return NextResponse.json({ error: "Challenge tidak ditemukan." }, { status: 404 });
    }

    // The object must really exist (RLS lets the user list only their own folder).
    const { folder, name } = splitRecordingPath(path);
    const { data: objects, error: listError } = await storage.list(folder, {
      search: name,
      limit: 1,
    });
    if (listError || !objects?.some((object) => object.name === name)) {
      return NextResponse.json(
        { error: "Audio belum terunggah. Coba kirim ulang." },
        { status: 400 },
      );
    }

    // attempt_number = max + 1, guarded by the unique constraint from 003.
    let attemptId: string | null = null;
    let lastError: unknown = null;
    for (let retry = 0; retry < MAX_INSERT_RETRIES && !attemptId; retry += 1) {
      const { data: last } = await supabase
        .from("attempts")
        .select("attempt_number")
        .eq("challenge_id", id)
        .order("attempt_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      const attemptNumber = (last?.attempt_number ?? 0) + 1;

      const { data: attempt, error: insertError } = await supabase
        .from("attempts")
        .insert({
          challenge_id: id,
          attempt_number: attemptNumber,
          audio_storage_path: path,
          duration_seconds,
          hint_level_used,
          max_possible_score: MAX_SCORE_BY_HINT[hint_level_used],
          evaluation_status: "pending",
        })
        .select("id")
        .single();

      if (attempt) {
        attemptId = attempt.id;
      } else {
        lastError = insertError;
        if (insertError?.code !== UNIQUE_VIOLATION) break;
      }
    }

    if (!attemptId) {
      // Don't orphan the upload.
      await storage.remove([path]);
      console.error("[attempt POST] insert failed:", lastError);
      return NextResponse.json({ error: "Gagal menyimpan attempt." }, { status: 500 });
    }

    const payload: AttemptCreateResponse = { attemptId };
    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    console.error("[attempt POST] failed:", error);
    return NextResponse.json(
      { error: "Gagal mengirim rekaman. Coba lagi." },
      { status: 500 },
    );
  }
}
