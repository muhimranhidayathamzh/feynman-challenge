import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { loginPathFor, safeNext } from "@/lib/auth/redirect";
import { publicEnv } from "@/lib/env.public";
import type { Database } from "@/types";

/** Paths that an unauthenticated visitor is allowed to reach. */
// /offline is precached by the service worker without cookies: it must be
// reachable signed out, or the login page would be cached in its place.
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/lupa-password",
  "/offline",
  "/privasi",
  "/syarat",
  "/api/auth/callback",
  // Scheduled jobs carry no session; each route checks CRON_SECRET itself.
  "/api/cron",
];

// The screen gallery (/dev/galeri) renders fixtures only and exists only in
// development; its pages return 404 in production builds.
const DEV_PATHS = process.env.NODE_ENV === "production" ? [] : ["/dev"];

function isPublicPath(pathname: string): boolean {
  return [...PUBLIC_PATHS, ...DEV_PATHS].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * Refreshes the Supabase session (rotating cookies) and enforces route
 * protection. Called from the root `middleware.ts`.
 *
 * - Unauthenticated user on a protected route -> redirect to /login.
 * - Authenticated user on /login or /signup    -> redirect to / (dashboard).
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });
  const env = publicEnv();

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const onPublicPath = isPublicPath(pathname);

  // Any response other than supabaseResponse must carry the refreshed
  // session cookies, or the browser keeps the stale ones.
  const withSessionCookies = <T extends NextResponse>(response: T): T => {
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
  };

  if (!user && !onPublicPath) {
    // API callers get a JSON 401, never an HTML redirect they cannot parse.
    if (pathname.startsWith("/api/")) {
      return withSessionCookies(
        NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 }),
      );
    }
    // Remember where they were going, so login can bring them back.
    const target = loginPathFor(`${pathname}${request.nextUrl.search}`);
    return withSessionCookies(NextResponse.redirect(new URL(target, request.url)));
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const next = safeNext(request.nextUrl.searchParams.get("next"));
    return withSessionCookies(NextResponse.redirect(new URL(next, request.url)));
  }

  return supabaseResponse;
}
