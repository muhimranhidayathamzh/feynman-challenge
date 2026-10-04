import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeHttpUrl } from "@/lib/gemini/schemas";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/api/rate-limit";
import { logError } from "@/lib/monitoring/report";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const AddSchema = z.object({
  title: z.string().trim().min(1).max(300),
  // Only http(s) links are stored; anything else (including "") becomes null.
  url: z.string().nullish().transform(normalizeHttpUrl),
  type: z.enum(["video", "article", "book", "paper", "other"]).default("other"),
});

export async function POST(request: Request, context: RouteContext) {
  const limited = rateLimit(request, "write");
  if (limited) return limited;
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    // Ownership (RLS-scoped): challenge must belong to the user.
    const { data: challenge } = await supabase
      .from("challenges")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!challenge) {
      return NextResponse.json({ error: "Tantangan tidak ditemukan." }, { status: 404 });
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = AddSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Sumber tidak valid." }, { status: 400 });
    }

    const { data: created, error } = await supabase
      .from("challenge_sources")
      .insert({
        challenge_id: id,
        title: parsed.data.title,
        url: parsed.data.url,
        source_type: parsed.data.type,
        is_ai_suggested: false,
      })
      .select("*")
      .single();

    if (error || !created) {
      logError("[sources POST] failed:", error);
      return NextResponse.json({ error: "Gagal menambah sumber." }, { status: 500 });
    }

    return NextResponse.json({ source: created }, { status: 201 });
  } catch (error) {
    logError("[sources POST] failed:", error);
    return NextResponse.json({ error: "Gagal menambah sumber." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const limited = rateLimit(request, "write");
  if (limited) return limited;
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
    const parsed = z.object({ id: z.uuid() }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
    }

    const { error } = await supabase
      .from("challenge_sources")
      .delete()
      .eq("id", parsed.data.id)
      .eq("challenge_id", id);

    if (error) {
      logError("[sources DELETE] failed:", error);
      return NextResponse.json({ error: "Gagal menghapus sumber." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logError("[sources DELETE] failed:", error);
    return NextResponse.json({ error: "Gagal menghapus sumber." }, { status: 500 });
  }
}
