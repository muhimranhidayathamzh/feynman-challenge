// End-to-end test settings (Prompt 4.3). The tests create and delete a real
// user, so they run only against a SEPARATE Supabase project made for testing
// (decision D12), never the one in .env.local.
//
// Put the test project's keys in .env.e2e (git-ignored) or the environment:
//   E2E_SUPABASE_URL=https://<test-project>.supabase.co
//   E2E_SUPABASE_ANON_KEY=...
//   E2E_SUPABASE_SERVICE_ROLE_KEY=...
import { existsSync, readFileSync } from "node:fs";

export interface E2EEnv {
  supabaseUrl: string;
  anonKey: string;
  serviceRoleKey: string;
}

/** The value of `name` in a dotenv file, without loading it into process.env. */
function readDotenv(file: string, name: string): string | null {
  if (!existsSync(file)) return null;
  const line = readFileSync(file, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${name}=`));
  return line
    ? line
        .slice(name.length + 1)
        .trim()
        .replace(/^"|"$/g, "")
    : null;
}

export function e2eEnv(): E2EEnv {
  if (existsSync(".env.e2e")) process.loadEnvFile(".env.e2e");
  const supabaseUrl = process.env.E2E_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.E2E_SUPABASE_ANON_KEY?.trim() ?? "";
  const serviceRoleKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error(
      "E2E butuh project Supabase khusus uji. Isi E2E_SUPABASE_URL, E2E_SUPABASE_ANON_KEY, " +
        "dan E2E_SUPABASE_SERVICE_ROLE_KEY di .env.e2e (lihat README, bagian Testing).",
    );
  }
  const mainProject = readDotenv(".env.local", "NEXT_PUBLIC_SUPABASE_URL");
  if (mainProject && mainProject.replace(/\/$/, "") === supabaseUrl.replace(/\/$/, "")) {
    throw new Error(
      "E2E_SUPABASE_URL sama dengan project utama di .env.local. Test membuat dan " +
        "menghapus pengguna, jadi pakai project Supabase terpisah.",
    );
  }
  return { supabaseUrl, anonKey, serviceRoleKey };
}

export const E2E_PORT = 3100;
export const AUTH_FILE = "e2e/.auth/user.json";
export const USER_FILE = "e2e/.auth/credentials.json";
