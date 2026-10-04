import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env";
import { logError } from "@/lib/monitoring/report";
import { resendSender, runReminders } from "@/lib/reminders/send";
import { siteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/utils/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily review reminders (Prompt 5.4), called by Vercel Cron. `?dry=1`
 * counts who would get an email without sending anything. Answers with
 * counts only.
 */
export async function GET(request: Request) {
  const env = serverEnv();
  if (!isCronAuthorized(request.headers.get("authorization"), env.CRON_SECRET)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }
  if (!env.RESEND_API_KEY || !env.REMINDER_FROM || !env.CRON_SECRET) {
    return NextResponse.json(
      { error: "Pengingat email belum diaktifkan (RESEND_API_KEY, REMINDER_FROM)." },
      { status: 503 },
    );
  }
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY belum diisi." },
      { status: 503 },
    );
  }

  const dryRun = new URL(request.url).searchParams.get("dry") === "1";
  try {
    const report = await runReminders(admin, {
      apply: !dryRun,
      origin: siteUrl(),
      secret: env.CRON_SECRET,
      send: resendSender(env.RESEND_API_KEY, env.REMINDER_FROM),
    });
    console.info("[cron reminders]", JSON.stringify(report));
    return NextResponse.json(report);
  } catch (error) {
    logError("[cron reminders] failed:", error);
    return NextResponse.json({ error: "Pengingat gagal dikirim." }, { status: 500 });
  }
}
