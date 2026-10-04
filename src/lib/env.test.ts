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
    vi.stubEnv("RESEND_API_KEY", "");
    expect(legalEnv()).toEqual({
      geminiPaidTier: false,
      contactEmail: null,
      errorMonitoring: false,
      reminderEmails: false,
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

  it("names the email service only when reminders can actually be sent", () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("REMINDER_FROM", "Feynman <a@b.co>");
    vi.stubEnv("CRON_SECRET", "");
    expect(legalEnv().reminderEmails).toBe(false);
    vi.stubEnv("CRON_SECRET", "0123456789abcdef0123");
    expect(legalEnv().reminderEmails).toBe(true);
  });
});
