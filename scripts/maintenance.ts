// Storage and account housekeeping (Prompt 4.2).
//
//   npm run maintenance              # dry run: counts only, deletes nothing
//   npm run maintenance -- --apply   # actually delete
//
// Removes recordings no attempt or follow-up points at (older than 24 hours)
// and anonymous demo accounts idle for 7 days, together with their files.
//
// WARNING: uses SUPABASE_SERVICE_ROLE_KEY from .env.local, which bypasses
// every RLS policy. It prints counts and sizes only, never keys or contents.
import { existsSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

import { runMaintenance } from "../src/lib/maintenance/cleanup";
import { formatBytes } from "../src/lib/utils/account-cleanup";
import type { Database } from "../src/types";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus terisi di .env.local.",
  );
  process.exit(1);
}

const apply = process.argv.includes("--apply");
const admin = createClient<Database>(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log(apply ? "Mode: HAPUS (--apply)" : "Mode: dry run, tidak ada yang dihapus");
  const report = await runMaintenance(admin, { apply });
  console.log(
    `Rekaman yatim (>24 jam, tidak dirujuk): ${report.orphans.count} berkas, ${formatBytes(report.orphans.bytes)}`,
  );
  console.log(
    `Akun demo tidak aktif (>7 hari): ${report.idleAccounts.count} akun, ${formatBytes(report.idleAccounts.bytes)} rekaman`,
  );
  console.log(
    apply
      ? "Selesai: semuanya sudah dihapus."
      : "Jalankan dengan --apply untuk menghapus.",
  );
}

main().catch((error: unknown) => {
  const { code, message } = (error ?? {}) as { code?: unknown; message?: unknown };
  console.error("Maintenance gagal:", typeof message === "string" ? message : error);
  if (code === "42501") {
    console.error(
      "service_role belum boleh membaca tabel: jalankan supabase/migrations/009_maintenance_access.sql.",
    );
  }
  process.exit(1);
});
