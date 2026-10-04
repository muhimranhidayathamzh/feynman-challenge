import { describe, expect, it } from "vitest";

import {
  oneClickUnsubscribeUrl,
  unsubscribeToken,
  unsubscribeUrl,
  verifyUnsubscribeToken,
} from "./unsubscribe-token";

const SECRET = "0123456789abcdef0123456789abcdef";
const USER = "00000000-0000-4000-8000-000000000001";

describe("unsubscribe tokens", () => {
  it("verifies its own token", () => {
    expect(verifyUnsubscribeToken(USER, unsubscribeToken(USER, SECRET), SECRET)).toBe(
      true,
    );
  });

  it("rejects a token for someone else, a tampered one, or another secret", () => {
    const token = unsubscribeToken(USER, SECRET);
    expect(verifyUnsubscribeToken("someone-else", token, SECRET)).toBe(false);
    expect(verifyUnsubscribeToken(USER, token.slice(0, -1) + "x", SECRET)).toBe(false);
    expect(verifyUnsubscribeToken(USER, token, "another-secret-another-secret!!")).toBe(
      false,
    );
    expect(verifyUnsubscribeToken(USER, "", SECRET)).toBe(false);
  });

  it("builds a link to the opt-out page", () => {
    const url = new URL(unsubscribeUrl("https://feynman.example", USER, SECRET));
    expect(url.pathname).toBe("/berhenti");
    expect(url.searchParams.get("u")).toBe(USER);
    expect(verifyUnsubscribeToken(USER, url.searchParams.get("t") ?? "", SECRET)).toBe(
      true,
    );
  });

  it("points mail apps' one-click button at the opt-out endpoint", () => {
    const url = new URL(oneClickUnsubscribeUrl("https://feynman.example", USER, SECRET));
    expect(url.pathname).toBe("/api/reminders/unsubscribe");
    expect(url.searchParams.get("t")).toBe(unsubscribeToken(USER, SECRET));
  });
});
