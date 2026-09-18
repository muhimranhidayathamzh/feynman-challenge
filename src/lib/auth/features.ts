import "server-only";

import { publicEnv } from "@/lib/env.public";

import { parseAuthFeatures, type AuthFeatures } from "./auth-features";

/** Shown when the settings cannot be read: offer everything, errors explain. */
const FALLBACK: AuthFeatures = { google: true, anonymous: true };

/**
 * Which optional sign-in methods are switched on in the Supabase dashboard,
 * read from the public GoTrue settings endpoint (anon key only, cached for five
 * minutes). Lets the auth pages hide buttons that would always fail.
 */
export async function getAuthFeatures(): Promise<AuthFeatures> {
  try {
    const env = publicEnv();
    const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return FALLBACK;
    const body: unknown = await response.json();
    return parseAuthFeatures(body) ?? FALLBACK;
  } catch {
    return FALLBACK;
  }
}
