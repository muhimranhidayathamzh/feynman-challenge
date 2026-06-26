import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Supabase auth callback. Exchanges the `code` from an email-confirmation or
 * OAuth redirect for a session, then forwards the user on (default: dashboard).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Tautan tidak valid atau sudah kedaluwarsa.")}`,
  );
}
