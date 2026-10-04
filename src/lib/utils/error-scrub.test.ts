import type { Event } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";

import { latencyBucket, redactText, scrubBreadcrumb, scrubEvent } from "./error-scrub";

describe("scrubEvent", () => {
  const event: Event = {
    message: "Gagal untuk rani@contoh.id",
    user: { id: "u1", email: "rani@contoh.id", ip_address: "1.2.3.4" },
    request: {
      method: "POST",
      url: "https://app.example/api/evaluate?token=abc#x",
      data: { attemptId: "a1", transcript: "penjelasan pribadi" },
      cookies: { "sb-access-token": "secret" },
      headers: { authorization: "Bearer secret", "user-agent": "x" },
      query_string: "token=abc",
    },
    exception: {
      values: [{ type: "Error", value: "tidak bisa kirim ke rani@contoh.id" }],
    },
    extra: {
      transcript: "isi rekaman",
      notes: "catatan pribadi",
      attemptId: "a1",
      nested: { password: "x", step: "finalize" },
    },
    contexts: { gemini: { code: "timeout", prompt: "outline lengkap" } },
    tags: { ai_kind: "evaluate", gemini_code: "timeout" },
    breadcrumbs: [
      { category: "console", message: "transkrip: ..." },
      {
        category: "fetch",
        data: {
          url: "/api/challenge/1?x=1",
          method: "PUT",
          status_code: 500,
          body: "{}",
        },
      },
    ],
  };
  const clean = scrubEvent(event);

  it("drops the user, and the request down to method and path", () => {
    expect(clean.user).toBeUndefined();
    expect(clean.request).toEqual({
      method: "POST",
      url: "https://app.example/api/evaluate",
    });
  });

  it("masks emails in messages and exception values", () => {
    expect(clean.message).toBe("Gagal untuk [email]");
    expect(clean.exception?.values?.[0]?.value).toBe("tidak bisa kirim ke [email]");
  });

  it("removes learner content from extra and contexts, at any depth", () => {
    expect(clean.extra).toEqual({ attemptId: "a1", nested: { step: "finalize" } });
    expect(clean.contexts).toEqual({ gemini: { code: "timeout" } });
  });

  it("keeps the tags that say what broke", () => {
    expect(clean.tags).toEqual({ ai_kind: "evaluate", gemini_code: "timeout" });
  });

  it("drops console breadcrumbs and keeps only url, method, and status", () => {
    expect(clean.breadcrumbs).toEqual([
      {
        category: "fetch",
        data: { url: "/api/challenge/1", method: "PUT", status_code: 500 },
      },
    ]);
  });

  it("does not change the event it was given", () => {
    expect(event.user?.email).toBe("rani@contoh.id");
  });
});

describe("scrubBreadcrumb", () => {
  it("masks emails in a breadcrumb message", () => {
    expect(scrubBreadcrumb({ category: "ui.click", message: "a@b.co" })?.message).toBe(
      "[email]",
    );
  });
});

describe("redactText", () => {
  it("masks every email and leaves the rest", () => {
    expect(redactText("dari a.b+c@x.co.id ke d@e.io")).toBe("dari [email] ke [email]");
  });
});

describe("latencyBucket", () => {
  it("groups evaluation time coarsely", () => {
    expect(latencyBucket(4_000)).toBe("<10s");
    expect(latencyBucket(10_000)).toBe("10-30s");
    expect(latencyBucket(40_000)).toBe("30-55s");
    expect(latencyBucket(60_000)).toBe(">=55s");
  });
});
