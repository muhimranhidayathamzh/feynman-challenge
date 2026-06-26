import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };
type DB = SupabaseClient<Database>;

const AddSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
});

const UpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
});

const ReorderSchema = z.object({
  reorder: z.array(z.string().uuid()).min(1),
});

/** Returns true when the signed-in user owns the challenge (RLS-scoped). */
async function ownsChallenge(supabase: DB, id: string): Promise<boolean> {
  const { data } = await supabase
    .from("challenges")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  return Boolean(data);
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
    if (!(await ownsChallenge(supabase, id))) {
      return NextResponse.json({ error: "Challenge tidak ditemukan." }, { status: 404 });
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = AddSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Poin outline tidak valid." }, { status: 400 });
    }

    const { data: last } = await supabase
      .from("challenge_outlines")
      .select("order_index")
      .eq("challenge_id", id)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextIndex = (last?.order_index ?? -1) + 1;

    const { data: created, error } = await supabase
      .from("challenge_outlines")
      .insert({
        challenge_id: id,
        order_index: nextIndex,
        title: parsed.data.title,
        description: parsed.data.description?.length
          ? parsed.data.description
          : null,
        is_user_added: true,
      })
      .select("*")
      .single();

    if (error || !created) {
      console.error("[outline POST] failed:", error);
      return NextResponse.json({ error: "Gagal menambah poin." }, { status: 500 });
    }

    return NextResponse.json({ item: created }, { status: 201 });
  } catch (error) {
    console.error("[outline POST] failed:", error);
    return NextResponse.json({ error: "Gagal menambah poin." }, { status: 500 });
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
    if (!(await ownsChallenge(supabase, id))) {
      return NextResponse.json({ error: "Challenge tidak ditemukan." }, { status: 404 });
    }

    const body: unknown = await request.json().catch(() => null);

    // Mode 1: reorder
    const reorder = ReorderSchema.safeParse(body);
    if (reorder.success) {
      const updates = reorder.data.reorder.map((itemId, index) =>
        supabase
          .from("challenge_outlines")
          .update({ order_index: index })
          .eq("id", itemId)
          .eq("challenge_id", id),
      );
      const results = await Promise.all(updates);
      const failed = results.find((r) => r.error);
      if (failed?.error) {
        console.error("[outline PATCH reorder] failed:", failed.error);
        return NextResponse.json({ error: "Gagal mengurutkan." }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    // Mode 2: update a single item
    const update = UpdateSchema.safeParse(body);
    if (!update.success) {
      return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
    }

    const { id: itemId, ...fields } = update.data;
    const { data: updated, error } = await supabase
      .from("challenge_outlines")
      .update(fields)
      .eq("id", itemId)
      .eq("challenge_id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("[outline PATCH update] failed:", error);
      return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
    }
    if (!updated) {
      return NextResponse.json({ error: "Poin tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("[outline PATCH] failed:", error);
    return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
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
    const parsed = z.object({ id: z.string().uuid() }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
    }

    const { error } = await supabase
      .from("challenge_outlines")
      .delete()
      .eq("id", parsed.data.id)
      .eq("challenge_id", id);

    if (error) {
      console.error("[outline DELETE] failed:", error);
      return NextResponse.json({ error: "Gagal menghapus poin." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[outline DELETE] failed:", error);
    return NextResponse.json({ error: "Gagal menghapus poin." }, { status: 500 });
  }
}
