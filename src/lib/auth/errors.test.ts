import { describe, expect, it } from "vitest";

import { GENERIC_AUTH_ERROR, authErrorCode, authErrorMessage } from "./errors";

describe("authErrorMessage", () => {
  it("maps known Supabase codes to Indonesian", () => {
    expect(authErrorMessage({ code: "invalid_credentials", message: "x" })).toMatch(
      /kata sandi salah/,
    );
    expect(authErrorMessage({ code: "user_already_exists", message: "x" })).toMatch(
      /sudah terdaftar/,
    );
    expect(authErrorMessage({ code: "weak_password", message: "x" })).toMatch(
      /terlalu lemah/,
    );
  });

  it("recognises older errors by message when there is no code", () => {
    expect(authErrorCode({ message: "Invalid login credentials" })).toBe(
      "invalid_credentials",
    );
    expect(authErrorCode({ message: "Email not confirmed" })).toBe("email_not_confirmed");
    expect(authErrorCode({ message: "User already registered" })).toBe(
      "user_already_exists",
    );
  });

  it("treats HTTP 429 as a rate limit", () => {
    expect(authErrorCode({ message: "Too many", status: 429 })).toBe(
      "over_request_rate_limit",
    );
  });

  it("never leaks the raw English message for unknown errors", () => {
    expect(authErrorMessage({ code: "something_new", message: "Boom in English" })).toBe(
      GENERIC_AUTH_ERROR,
    );
    expect(authErrorMessage({ message: "Totally unknown" })).toBe(GENERIC_AUTH_ERROR);
  });
});
