import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env.public";
import type { Database } from "@/types";

/**
 * Server-side Supabase client (Server Components, Route Handlers, Server Actions).
 * In Next.js 15 `cookies()` is async, so this factory must be awaited.
 * Access remains constrained by RLS via the anon key + the user's session cookie.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const env = publicEnv();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // `setAll` was called from a Server Component. This can be ignored
            // when middleware refreshes the session (see Prompt 1.3).
          }
        },
      },
    },
  );
}
