import { describe, expect, it } from "vitest";

import { SlidingWindowLimiter, clientIp } from "./rate-limit";

describe("SlidingWindowLimiter", () => {
  const rule = { limit: 3, windowMs: 60_000 };

  it("allows up to the limit, then refuses with a retry delay", () => {
    const limiter = new SlidingWindowLimiter(rule);
    expect(limiter.hit("a", 0)).toEqual({ ok: true });
    expect(limiter.hit("a", 10_000)).toEqual({ ok: true });
    expect(limiter.hit("a", 20_000)).toEqual({ ok: true });
    // The first hit leaves the window at 60 s; now is 30 s.
    expect(limiter.hit("a", 30_000)).toEqual({ ok: false, retryAfterSec: 30 });
  });

  it("slides: a slot frees up as the oldest hit ages out", () => {
    const limiter = new SlidingWindowLimiter(rule);
    for (const t of [0, 10_000, 20_000]) limiter.hit("a", t);
    expect(limiter.hit("a", 60_001)).toEqual({ ok: true });
    expect(limiter.hit("a", 60_002).ok).toBe(false);
  });

  it("refused requests do not extend the wait", () => {
    const limiter = new SlidingWindowLimiter(rule);
    for (const t of [0, 1, 2]) limiter.hit("a", t);
    for (let t = 1000; t < 50_000; t += 1000) limiter.hit("a", t);
    expect(limiter.hit("a", 60_001)).toEqual({ ok: true });
  });

  it("keeps each key separate", () => {
    const limiter = new SlidingWindowLimiter(rule);
    for (const t of [0, 1, 2]) limiter.hit("a", t);
    expect(limiter.hit("b", 3)).toEqual({ ok: true });
  });

  it("never waits less than a second", () => {
    const limiter = new SlidingWindowLimiter({ limit: 1, windowMs: 100 });
    limiter.hit("a", 0);
    expect(limiter.hit("a", 99)).toEqual({ ok: false, retryAfterSec: 1 });
  });

  it("drops the least recently used keys beyond its bound", () => {
    const limiter = new SlidingWindowLimiter({ limit: 1, windowMs: 60_000 }, 2);
    limiter.hit("a", 0);
    limiter.hit("b", 1);
    limiter.hit("c", 2); // evicts "a"
    expect(limiter.hit("a", 3)).toEqual({ ok: true });
    expect(limiter.hit("c", 4).ok).toBe(false);
  });
});

describe("clientIp", () => {
  const headers = (entries: Record<string, string>) => new Headers(entries);

  it("reads Vercel's headers, preferring x-real-ip", () => {
    expect(
      clientIp(headers({ "x-real-ip": "1.2.3.4", "x-forwarded-for": "5.6.7.8" }), true),
    ).toBe("1.2.3.4");
    expect(clientIp(headers({ "x-forwarded-for": "5.6.7.8, 10.0.0.1" }), true)).toBe(
      "5.6.7.8",
    );
    expect(clientIp(headers({}), true)).toBe("unknown");
  });

  it("ignores client-written headers off Vercel", () => {
    expect(clientIp(headers({ "x-real-ip": "1.2.3.4" }), false)).toBe("untrusted");
  });
});
