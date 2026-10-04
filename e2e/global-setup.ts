import { mkdirSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import { USER_FILE, e2eEnv } from "./env";

/** Creates a confirmed test user in the test project; teardown deletes it. */
export default async function globalSetup(): Promise<void> {
  const env = e2eEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = `e2e-${Date.now()}@example.com`;
  const password = randomBytes(18).toString("base64url");
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Uji E2E", timezone: "Asia/Jakarta" },
  });
  if (error || !data.user) {
    throw new Error(`Gagal membuat pengguna uji: ${error?.message ?? "tanpa data"}`);
  }
  mkdirSync("e2e/.auth", { recursive: true });
  writeFileSync(USER_FILE, JSON.stringify({ id: data.user.id, email, password }));
}
