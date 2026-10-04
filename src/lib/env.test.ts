import { afterEach, describe, expect, it, vi } from "vitest";

import { legalEnv } from "./env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("legalEnv", () => {
  it("defaults to the free-tier wording and no contact address", () => {
    vi.stubEnv("GEMINI_PAID_TIER", "");
    vi.stubEnv("CONTACT_EMAIL", "");
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
    expect(legalEnv()).toEqual({
      geminiPaidTier: false,
      contactEmail: null,
      errorMonitoring: false,
    });
  });

  it("claims the paid tier only for exactly 1", () => {
    vi.stubEnv("GEMINI_PAID_TIER", "1");
    expect(legalEnv().geminiPaidTier).toBe(true);
    vi.stubEnv("GEMINI_PAID_TIER", "true");
    expect(legalEnv().geminiPaidTier).toBe(false);
  });

  it("shows a contact address only when it is a valid email", () => {
    vi.stubEnv("CONTACT_EMAIL", "halo@contoh.id");
    expect(legalEnv().contactEmail).toBe("halo@contoh.id");
    vi.stubEnv("CONTACT_EMAIL", "bukan email");
    expect(legalEnv().contactEmail).toBeNull();
  });

  it("names error monitoring only when Sentry is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://key@o0.ingest.sentry.io/0");
    expect(legalEnv().errorMonitoring).toBe(true);
  });
});
