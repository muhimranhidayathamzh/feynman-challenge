import { NextResponse } from "next/server";
import { z } from "zod";

import { regenerateMissingHints } from "@/lib/ai/hints";
import type { HintsResponse } from "@/lib/api/contracts";
import { GEMINI_ERROR_RESPONSE } from "@/lib/gemini/retry";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/api/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Fills in AI hints for outline points that have none. Called by the
 * recording screen before recording starts; a no-op when nothing is missing.
 */
export async function POST(request: Request, context: RouteContext) {
  const limited = rateLimit(request, "ai");
  if (limited) return limited;
  try {
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) {
      return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const result = await regenerateMissingHints(supabase, id, {
      anonymous: user.is_anonymous ?? false,
    });
    switch (result.status) {
      case "ok": {
        const payload: HintsResponse = { updated: result.updated };
        return NextResponse.json(payload);
      }
      case "none-missing": {
        const payload: HintsResponse = { updated: 0 };
        return NextResponse.json(payload);
      }
      case "not-found":
        return NextResponse.json(
          { error: "Tantangan tidak ditemukan." },
          { status: 404 },
        );
      case "quota":
        return NextResponse.json(
          {
            error: result.message,
            code: "quota",
            retryAfterSeconds: result.retryAfterSeconds,
          },
          { status: result.httpStatus },
        );
      case "error": {
        const response =
          result.code === "db"
            ? { status: 500, message: "Gagal memuat outline." }
            : GEMINI_ERROR_RESPONSE[result.code];
        return NextResponse.json(
          { error: response.message, code: result.code },
          { status: response.status },
        );
      }
    }
  } catch (error) {
    console.error("[hints POST] failed:", error);
    return NextResponse.json({ error: "Gagal menyiapkan hint." }, { status: 500 });
  }
}
