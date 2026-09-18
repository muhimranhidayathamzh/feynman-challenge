import { NextResponse } from "next/server";
import { z } from "zod";

import type { AttemptStatusResponse } from "@/lib/api/contracts";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ attemptId: string }> };

/** Lightweight status probe used by the results page while polling. */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { attemptId } = await context.params;
    if (!z.uuid().safeParse(attemptId).success) {
      return NextResponse.json({ error: "ID percobaan tidak valid." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const { data: attempt } = await supabase
      .from("attempts")
      .select("evaluation_status, evaluation_error")
      .eq("id", attemptId)
      .maybeSingle();
    if (!attempt) {
      return NextResponse.json({ error: "Percobaan tidak ditemukan." }, { status: 404 });
    }

    const payload: AttemptStatusResponse = {
      evaluation_status: attempt.evaluation_status,
      evaluation_error: attempt.evaluation_error,
    };
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[attempt GET] failed:", error);
    return NextResponse.json({ error: "Gagal memuat status." }, { status: 500 });
  }
}
