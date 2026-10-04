import { NextResponse } from "next/server";

import { safeNext } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/api/rate-limit";

/**
 * Supabase auth callback for email confirmation, password recovery, and
 * OAuth. Exchanges the `code` for a session, then forwards to `next`
 * (validated: same-origin paths only). Errors go back to /login as a CODE,
 * never as free text.
 */
export async function GET(request: Request) {
  const limited = rateLimit(request, "auth");
  if (limited) return limited;
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  const providerError = searchParams.get("error");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.warn("[auth/callback] code exchange failed:", error.message);
  }

  const reason = providerError ? "oauth_failed" : "link_invalid";
  return NextResponse.redirect(`${origin}/login?error=${reason}`);
}
