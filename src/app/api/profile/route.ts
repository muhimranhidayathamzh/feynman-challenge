import { NextResponse } from "next/server";

import { ProfilePatchRequestSchema, type ProfileResponse } from "@/lib/api/contracts";
import { isValidTimeZone } from "@/lib/utils/date";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/api/rate-limit";

export const runtime = "nodejs";

/** Update the signed-in user's display name and/or timezone. */
export async function PATCH(request: Request) {
  const limited = rateLimit(request, "write");
  if (limited) return limited;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = ProfilePatchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data profil tidak valid." }, { status: 400 });
    }
    const changes = parsed.data;

    if (changes.timezone !== undefined && !isValidTimeZone(changes.timezone)) {
      return NextResponse.json({ error: "Zona waktu tidak dikenal." }, { status: 400 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .update(changes)
      .eq("id", user.id)
      .select("display_name, timezone")
      .single();

    if (error || !profile) {
      console.error("[profile PATCH] failed:", error);
      return NextResponse.json({ error: "Gagal menyimpan profil." }, { status: 500 });
    }

    const payload: ProfileResponse = { profile };
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[profile PATCH] failed:", error);
    return NextResponse.json({ error: "Gagal menyimpan profil." }, { status: 500 });
  }
}
