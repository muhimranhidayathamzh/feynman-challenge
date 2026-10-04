import { NextResponse } from "next/server";
import { createClient as createPlainClient } from "@supabase/supabase-js";

import { AccountDeleteRequestSchema, type OkResponse } from "@/lib/api/contracts";
import { publicEnv } from "@/lib/env.public";
import { deleteAccount } from "@/lib/maintenance/cleanup";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isDeleteConfirmed, usesPassword } from "@/lib/utils/account-cleanup";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Checks a password without touching the caller's own session cookies. */
async function passwordMatches(email: string, password: string): Promise<boolean> {
  const env = publicEnv();
  const probe = createPlainClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await probe.auth.signInWithPassword({ email, password });
  return !error;
}

/**
 * Deletes the signed-in user's account (Prompt 4.2): every recording, then
 * the auth user, whose rows cascade through profiles. Confirmed with "HAPUS",
 * plus the password for email accounts (D10).
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = AccountDeleteRequestSchema.safeParse(body);
    if (!parsed.success || !isDeleteConfirmed(parsed.data.confirm)) {
      return NextResponse.json(
        { error: "Ketik HAPUS untuk mengonfirmasi." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    if (!admin) {
      console.error("[account DELETE] SUPABASE_SERVICE_ROLE_KEY is not set");
      return NextResponse.json(
        { error: "Penghapusan akun belum diaktifkan di server ini." },
        { status: 503 },
      );
    }

    if (usesPassword(user)) {
      const { password } = parsed.data;
      if (!user.email || !password || !(await passwordMatches(user.email, password))) {
        return NextResponse.json({ error: "Kata sandi salah." }, { status: 403 });
      }
    }

    try {
      await deleteAccount(admin, user.id);
    } catch (error) {
      // Recordings first, account second: a failure here leaves the account
      // in place, so the learner can retry and no file outlives its owner.
      console.error("[account DELETE] deletion failed:", error);
      return NextResponse.json(
        { error: "Akun belum terhapus. Coba lagi sebentar lagi." },
        { status: 500 },
      );
    }

    // The session belongs to a user that no longer exists; drop its cookies.
    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);

    const payload: OkResponse = { ok: true };
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[account DELETE] failed:", error);
    return NextResponse.json({ error: "Gagal menghapus akun." }, { status: 500 });
  }
}
