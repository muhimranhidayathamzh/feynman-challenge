import "server-only";

import { NextResponse } from "next/server";

import {
  RATE_RULES,
  SlidingWindowLimiter,
  clientIp,
  type RateKind,
} from "@/lib/utils/rate-limit";

const limiters: Record<RateKind, SlidingWindowLimiter> = {
  ai: new SlidingWindowLimiter(RATE_RULES.ai),
  write: new SlidingWindowLimiter(RATE_RULES.write),
  auth: new SlidingWindowLimiter(RATE_RULES.auth),
};

/**
 * Per-IP rate limit for one API route (Prompt 5.1). Returns the 429 response
 * to send, or null to carry on. Call it first, before any database work.
 */
export function rateLimit(request: Request, kind: RateKind): NextResponse | null {
  const ip = clientIp(request.headers, process.env.VERCEL === "1");
  const decision = limiters[kind].hit(ip, Date.now());
  if (decision.ok) return null;
  return NextResponse.json(
    { error: "Terlalu banyak permintaan. Tunggu sebentar, lalu coba lagi." },
    { status: 429, headers: { "Retry-After": String(decision.retryAfterSec) } },
  );
}
