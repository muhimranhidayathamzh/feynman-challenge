import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env";
import { runMaintenance } from "@/lib/maintenance/cleanup";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/utils/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily housekeeping (Prompt 4.2, D11), called by Vercel Cron: removes
 * recordings nothing points at and anonymous demo accounts idle for a week.
 * Same work as `npm run maintenance -- --apply`. Answers with counts only.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request.headers.get("authorization"), serverEnv().CRON_SECRET)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY belum diisi." },
      { status: 503 },
    );
  }
  try {
    const report = await runMaintenance(admin, { apply: true });
    console.info("[cron maintenance]", JSON.stringify(report));
    return NextResponse.json(report);
  } catch (error) {
    console.error("[cron maintenance] failed:", error);
    return NextResponse.json({ error: "Pembersihan gagal." }, { status: 500 });
  }
}
