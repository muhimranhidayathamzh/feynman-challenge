import { existsSync, readFileSync, rmSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

import { deleteAccount } from "../src/lib/maintenance/cleanup";
import type { Database } from "../src/types";

import { USER_FILE, e2eEnv } from "./env";

/** Deletes the test user and every recording it made, like "Hapus akun". */
export default async function globalTeardown(): Promise<void> {
  if (!existsSync(USER_FILE)) return;
  const { id } = JSON.parse(readFileSync(USER_FILE, "utf8")) as { id: string };
  const env = e2eEnv();
  const admin = createClient<Database>(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await deleteAccount(admin, id);
  rmSync("e2e/.auth", { recursive: true, force: true });
}
