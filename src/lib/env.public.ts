/**
 * Public (browser-safe) environment variables.
 *
 * Each variable is read with a static `process.env.NEXT_PUBLIC_*` access so
 * Next.js can inline it into the client bundle. Do NOT read them dynamically
 * (e.g. `process.env[name]`), that breaks inlining.
 *
 * Deliberately dependency-free: this module is imported by the Edge
 * middleware, so pulling in Zod here would grow that bundle for no gain.
 */
export interface PublicEnv {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

let cached: PublicEnv | null = null;

/** Validated public env. Safe to call from server, edge, and client code. */
export function publicEnv(): PublicEnv {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const problems: string[] = [];
  if (!isHttpUrl(url)) problems.push("NEXT_PUBLIC_SUPABASE_URL (must be an http(s) URL)");
  if (anonKey.trim().length === 0) problems.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (problems.length > 0) {
    throw new Error(
      `Invalid public environment: ${problems.join(", ")}. Check .env.local.`,
    );
  }

  cached = { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey };
  return cached;
}
