import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const PutSchema = z.object({
  content: z.string().max(20000),
});

export async function PUT(request: Request, context: RouteContext) {
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
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!challenge) {
      return NextResponse.json({ error: "Challenge tidak ditemukan." }, { status: 404 });
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = PutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Catatan tidak valid." }, { status: 400 });
    }

    // One note row per challenge (UNIQUE challenge_id) — upsert on conflict.
    const { data: note, error } = await supabase
      .from("challenge_notes")
      .upsert(
        { challenge_id: id, content: parsed.data.content },
        { onConflict: "challenge_id" },
      )
      .select("*")
      .single();

    if (error || !note) {
      console.error("[notes PUT] failed:", error);
      return NextResponse.json({ error: "Gagal menyimpan catatan." }, { status: 500 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error("[notes PUT] failed:", error);
    return NextResponse.json({ error: "Gagal menyimpan catatan." }, { status: 500 });
  }
}
