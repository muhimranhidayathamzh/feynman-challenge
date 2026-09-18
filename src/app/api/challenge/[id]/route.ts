import { NextResponse } from "next/server";
import { z } from "zod";

import { RECORDINGS_BUCKET } from "@/lib/storage/recording-path";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const STORAGE_PAGE = 100;

/**
 * Removes every object directly under `folder` in the recordings bucket, in
 * pages of 100. Errors are logged, never thrown.
 */
async function removeRecordingsFolder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  folder: string,
): Promise<void> {
  const storage = supabase.storage.from(RECORDINGS_BUCKET);
  try {
    for (;;) {
      // Always page from offset 0: each removed batch shifts the rest forward.
      const { data: objects, error } = await storage.list(folder, {
        limit: STORAGE_PAGE,
      });
      if (error) throw error;
      const paths = (objects ?? [])
        .filter((object) => object.id !== null) // folders have no id
        .map((object) => `${folder}/${object.name}`);
      if (paths.length === 0) return;
      const { error: removeError } = await storage.remove(paths);
      if (removeError) throw removeError;
      if (paths.length < STORAGE_PAGE) return;
    }
  } catch (error) {
    console.error(`[challenge DELETE] storage cleanup failed for ${folder}:`, error);
  }
}

const PatchSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    deadline: z.iso.date().nullable().optional(),
    status: z.enum(["active", "parked", "completed"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Tidak ada perubahan.",
  });

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const { data: challenge } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!challenge) {
      return NextResponse.json({ error: "Tantangan tidak ditemukan." }, { status: 404 });
    }

    const [{ data: outline }, { data: sources }, { data: note }] = await Promise.all([
      supabase
        .from("challenge_outlines")
        .select("*")
        .eq("challenge_id", id)
        .order("order_index"),
      supabase
        .from("challenge_sources")
        .select("*")
        .eq("challenge_id", id)
        .order("created_at"),
      supabase.from("challenge_notes").select("*").eq("challenge_id", id).maybeSingle(),
    ]);

    return NextResponse.json({
      challenge,
      outline: outline ?? [],
      sources: sources ?? [],
      note: note ?? null,
    });
  } catch (error) {
    console.error("[challenge/:id GET] failed:", error);
    return NextResponse.json({ error: "Gagal memuat tantangan." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from("challenges")
      .update(parsed.data)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("[challenge/:id PATCH] update failed:", error);
      return NextResponse.json({ error: "Gagal menyimpan perubahan." }, { status: 500 });
    }
    if (!updated) {
      return NextResponse.json({ error: "Tantangan tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ challenge: updated });
  } catch (error) {
    console.error("[challenge/:id PATCH] failed:", error);
    return NextResponse.json({ error: "Gagal menyimpan perubahan." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    // Database first: it is the source of truth and cascades to attempts.
    const { error } = await supabase.from("challenges").delete().eq("id", id);
    if (error) {
      console.error("[challenge/:id DELETE] failed:", error);
      return NextResponse.json({ error: "Gagal menghapus tantangan." }, { status: 500 });
    }

    // Then the recordings, best-effort: a leftover file must never block the
    // delete, it only costs storage quota.
    await removeRecordingsFolder(supabase, `${user.id}/${id}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[challenge/:id DELETE] failed:", error);
    return NextResponse.json({ error: "Gagal menghapus tantangan." }, { status: 500 });
  }
}
