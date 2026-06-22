import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types";

/**
 * Server-side Supabase client (Server Components, Route Handlers, Server Actions).
 * In Next.js 15 `cookies()` is async, so this factory must be awaited.
 * Access remains constrained by RLS via the anon key + the user's session cookie.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
