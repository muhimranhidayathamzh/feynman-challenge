import { describe, expect, it } from "vitest";

import { MIN_PASSWORD_LENGTH, validateNewPassword } from "./password";

describe("validateNewPassword", () => {
  it("requires the minimum length", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    expect(validateNewPassword("1234567", "1234567")).toMatch(/minimal 8/);
  });

  it("requires matching confirmation", () => {
    expect(validateNewPassword("12345678", "12345679")).toMatch(/tidak cocok/);
  });

  it("accepts a valid pair", () => {
    expect(validateNewPassword("rahasia-123", "rahasia-123")).toBeNull();
  });
});
