import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const PatchSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    deadline: z.string().datetime({ offset: true }).nullable().optional(),
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
      return NextResponse.json({ error: "Challenge tidak ditemukan." }, { status: 404 });
    }

    const [{ data: outline }, { data: sources }, { data: note }] =
      await Promise.all([
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
        supabase
          .from("challenge_notes")
          .select("*")
          .eq("challenge_id", id)
          .maybeSingle(),
      ]);

    return NextResponse.json({
      challenge,
      outline: outline ?? [],
      sources: sources ?? [],
      note: note ?? null,
    });
  } catch (error) {
    console.error("[challenge/:id GET] failed:", error);
    return NextResponse.json({ error: "Gagal memuat challenge." }, { status: 500 });
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
      return NextResponse.json({ error: "Challenge tidak ditemukan." }, { status: 404 });
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

    const { error } = await supabase.from("challenges").delete().eq("id", id);
    if (error) {
      console.error("[challenge/:id DELETE] failed:", error);
      return NextResponse.json({ error: "Gagal menghapus challenge." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[challenge/:id DELETE] failed:", error);
    return NextResponse.json({ error: "Gagal menghapus challenge." }, { status: 500 });
  }
}
