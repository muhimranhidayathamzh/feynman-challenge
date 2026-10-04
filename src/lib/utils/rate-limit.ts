/**
 * Per-IP rate limiting (Prompt 5.1, D16): a sliding window kept in memory,
 * per server instance. It blunts floods from one address; the per-user AI
 * quota and the app-wide ceiling in the database stay the real cost brakes.
 * Move to a shared store (Upstash Redis) once traffic spreads across many
 * instances.
 */

export type RateKind = "ai" | "write" | "auth";

export interface RateRule {
  limit: number;
  windowMs: number;
}

const MINUTE = 60_000;

/**
 * ai: the expensive routes. Above the per-user quota (3 a minute) so a few
 * people behind one address (a campus, an office) are not blocked together.
 * write: ordinary saves; notes autosave, so this is generous.
 * auth: password checks and sign-in callbacks, kept tight against guessing.
 */
export const RATE_RULES: Record<RateKind, RateRule> = {
  ai: { limit: 20, windowMs: MINUTE },
  write: { limit: 120, windowMs: MINUTE },
  auth: { limit: 20, windowMs: 10 * MINUTE },
};

export type RateDecision = { ok: true } | { ok: false; retryAfterSec: number };

export class SlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly rule: RateRule,
    /** Bounds memory: the oldest keys are dropped beyond this many. */
    private readonly maxKeys: number = 10_000,
  ) {}

  hit(key: string, now: number): RateDecision {
    const since = now - this.rule.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((time) => time > since);

    if (recent.length >= this.rule.limit) {
      this.hits.set(key, recent);
      const oldest = recent[0] ?? now;
      const retryAfterSec = Math.max(
        1,
        Math.ceil((oldest + this.rule.windowMs - now) / 1000),
      );
      return { ok: false, retryAfterSec };
    }

    recent.push(now);
    // Re-inserting moves the key to the end, so iteration order is
    // least-recently-used first.
    this.hits.delete(key);
    this.hits.set(key, recent);
    while (this.hits.size > this.maxKeys) {
      const oldestKey = this.hits.keys().next().value;
      if (oldestKey === undefined) break;
      this.hits.delete(oldestKey);
    }
    return { ok: true };
  }
}

/**
 * The caller's address. Only behind Vercel, whose edge overwrites
 * x-real-ip and x-forwarded-for with the address it saw, are these headers
 * trustworthy; anywhere else a client could write them itself, so every
 * request shares one key instead of letting a forged header buy a fresh
 * allowance.
 */
export function clientIp(headers: Headers, onVercel: boolean): string {
  if (!onVercel) return "untrusted";
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}
