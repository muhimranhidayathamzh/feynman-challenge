import { NextResponse } from "next/server";

import type { DemoSeedResponse } from "@/lib/api/contracts";
import { seedDemoChallenge } from "@/lib/demo/seed";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Seeds the example challenge for an anonymous demo account ("Coba tanpa
 * akun"). Permanent accounts are refused: the demo data is for trying the
 * app, not for filling a real notebook.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }
    if (!user.is_anonymous) {
      return NextResponse.json(
        { error: "Contoh hanya tersedia untuk mode demo." },
        { status: 403 },
      );
    }

    const result = await seedDemoChallenge(supabase, user.id);
    if (!result.ok) {
      return NextResponse.json(
        { error: "Gagal menyiapkan tantangan contoh. Coba lagi." },
        { status: 500 },
      );
    }
    const payload: DemoSeedResponse = {
      challengeId: result.challengeId,
      attemptId: result.attemptId,
      seeded: result.seeded,
    };
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[demo/seed] failed:", error);
    return NextResponse.json(
      { error: "Gagal menyiapkan tantangan contoh. Coba lagi." },
      { status: 500 },
    );
  }
}
