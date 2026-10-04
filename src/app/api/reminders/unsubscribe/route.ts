import { NextResponse } from "next/server";
import { z } from "zod";

import { rateLimit } from "@/lib/api/rate-limit";
import { serverEnv } from "@/lib/env";
import { logError } from "@/lib/monitoring/report";
import { disableReminders } from "@/lib/reminders/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "@/lib/utils/unsubscribe-token";

export const runtime = "nodejs";

const ParamsSchema = z.object({ u: z.uuid(), t: z.string().min(1).max(200) });

/**
 * Switches reminders off without signing in (Prompt 5.4). Two callers:
 * - the /berhenti page's form, which is redirected back to a confirmation;
 * - a mail app's own unsubscribe button (RFC 8058 one-click), which posts
 *   "List-Unsubscribe=One-Click" to the URL in the email header.
 * Only POST changes anything, so link scanners that open URLs cannot.
 */
export async function POST(request: Request) {
  const limited = rateLimit(request, "auth");
  if (limited) return limited;

  const url = new URL(request.url);
  const form = await request.formData().catch(() => null);
  const oneClick = form?.get("List-Unsubscribe") === "One-Click";
  const parsed = ParamsSchema.safeParse({
    u: form?.get("u") ?? url.searchParams.get("u"),
    t: form?.get("t") ?? url.searchParams.get("t"),
  });

  const secret = serverEnv().CRON_SECRET;
  if (
    !parsed.success ||
    !secret ||
    !verifyUnsubscribeToken(parsed.data.u, parsed.data.t, secret)
  ) {
    return oneClick
      ? NextResponse.json({ error: "Tautan tidak valid." }, { status: 400 })
      : NextResponse.redirect(new URL("/berhenti?gagal=1", url), 303);
  }

  const admin = createAdminClient();
  try {
    if (!admin) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    await disableReminders(admin, parsed.data.u);
  } catch (error) {
    logError("[reminders unsubscribe] failed:", error);
    return oneClick
      ? NextResponse.json({ error: "Gagal mematikan pengingat." }, { status: 500 })
      : NextResponse.redirect(new URL("/berhenti?gagal=1", url), 303);
  }

  return oneClick
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(new URL("/berhenti?selesai=1", url), 303);
}
