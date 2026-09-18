// Optional sign-in methods and the pure parser for Supabase's public auth
// settings. Client-safe; the fetch lives in features.ts (server-only).

export interface AuthFeatures {
  google: boolean;
  anonymous: boolean;
}

/** Pulls the two switches out of the GoTrue /settings payload. */
export function parseAuthFeatures(body: unknown): AuthFeatures | null {
  if (!body || typeof body !== "object" || !("external" in body)) return null;
  const external = body.external;
  if (!external || typeof external !== "object") return null;
  const flags = external as Record<string, unknown>;
  return {
    google: flags.google === true,
    anonymous: flags.anonymous_users === true,
  };
}
