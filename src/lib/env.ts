import "server-only";

import { z } from "zod";

/**
 * Server-only environment variables, validated once at first import.
 * Never import this module from a Client Component (the `server-only` guard
 * turns that into a build error).
 */
const ServerEnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is not set"),
  // Not used yet; reserved for maintenance scripts and account deletion.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

function loadServerEnv(): z.infer<typeof ServerEnvSchema> {
  const parsed = ServerEnvSchema.safeParse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
  });
  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid server environment: ${missing}. Check .env.local.`);
  }
  return parsed.data;
}

let cached: z.infer<typeof ServerEnvSchema> | null = null;

/** Lazily validated so unrelated routes don't crash at build time. */
export function serverEnv(): z.infer<typeof ServerEnvSchema> {
  if (!cached) cached = loadServerEnv();
  return cached;
}
