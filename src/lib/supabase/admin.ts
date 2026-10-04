import "server-only";

import { createClient } from "@supabase/supabase-js";

import { serverEnv } from "@/lib/env";
import { publicEnv } from "@/lib/env.public";
import type { AdminClient } from "@/lib/maintenance/cleanup";
import type { Database } from "@/types";

/**
 * Service-role client: bypasses RLS. Used ONLY by account deletion and the
 * maintenance cron (Prompt 4.2); scripts/maintenance.ts builds its own.
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is not configured.
 */
export function createAdminClient(): AdminClient | null {
  const key = serverEnv().SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient<Database>(publicEnv().NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
