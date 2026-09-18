import { createBrowserClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env.public";
import type { Database } from "@/types";

/**
 * Browser-side Supabase client (Client Components).
 * Uses the public anon key — all access is constrained by RLS.
 */
export function createClient() {
  const env = publicEnv();
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
