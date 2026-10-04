import "server-only";

import { z } from "zod";

/**
 * Server-only environment variables, validated once at first import.
 * Never import this module from a Client Component (the `server-only` guard
 * turns that into a build error).
 */
const ServerEnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is not set"),
  // Account deletion and storage maintenance (Prompt 4.2). Without it those
  // features answer "not available" instead of failing.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  // Guards the scheduled routes under /api/cron. Without it they refuse.
  CRON_SECRET: z.string().min(16).optional(),
  // Review reminder emails (Prompt 5.4) through Resend. Both or neither:
  // without them /api/cron/reminders sends nothing.
  RESEND_API_KEY: z.string().min(1).optional(),
  REMINDER_FROM: z.string().min(3).optional(),
});

function loadServerEnv(): z.infer<typeof ServerEnvSchema> {
  const parsed = ServerEnvSchema.safeParse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
    CRON_SECRET: process.env.CRON_SECRET || undefined,
    RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
    REMINDER_FROM: process.env.REMINDER_FROM || undefined,
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

const LegalEnvSchema = z.object({
  // "1" once the Gemini key is on a billed plan. The privacy page then says
  // Google does not use recordings to improve its products; until then it
  // says what the free tier allows, which is the honest default.
  GEMINI_PAID_TIER: z.literal("1").optional(),
  // Where people send privacy requests. Shown on /privasi and /syarat.
  CONTACT_EMAIL: z.email().optional(),
});

/**
 * Facts the legal pages state about this deployment. Read without the rest
 * of serverEnv(), so the pages build even where GEMINI_API_KEY is absent;
 * an invalid value counts as unset.
 */
export function legalEnv(): {
  geminiPaidTier: boolean;
  contactEmail: string | null;
  errorMonitoring: boolean;
  reminderEmails: boolean;
} {
  const parsed = LegalEnvSchema.safeParse({
    GEMINI_PAID_TIER: process.env.GEMINI_PAID_TIER || undefined,
    CONTACT_EMAIL: process.env.CONTACT_EMAIL || undefined,
  });
  return {
    geminiPaidTier: parsed.success && parsed.data.GEMINI_PAID_TIER === "1",
    contactEmail: (parsed.success && parsed.data.CONTACT_EMAIL) || null,
    // Sentry (U.2) receives error reports only when its DSN is set.
    errorMonitoring: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
    // Resend (5.4) receives an address only when reminders can be sent.
    reminderEmails: remindersAvailable(),
  };
}

/**
 * True when this deployment can send reminder emails (Prompt 5.4): the
 * Resend key, a sender, and the cron secret that signs unsubscribe links.
 * Pengaturan hides the switch otherwise, so it never promises email that
 * cannot arrive.
 */
export function remindersAvailable(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY && process.env.REMINDER_FROM && process.env.CRON_SECRET,
  );
}
