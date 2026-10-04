import { describe, expect, it } from "vitest";

import { isCronAuthorized } from "./cron-auth";

const SECRET = "0123456789abcdef0123";

describe("isCronAuthorized", () => {
  it("accepts the exact bearer secret", () => {
    expect(isCronAuthorized(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it("rejects a wrong, partial, longer, or missing header", () => {
    expect(isCronAuthorized("Bearer wrong", SECRET)).toBe(false);
    expect(isCronAuthorized(`Bearer ${SECRET.slice(0, -1)}`, SECRET)).toBe(false);
    expect(isCronAuthorized(`Bearer ${SECRET}x`, SECRET)).toBe(false);
    expect(isCronAuthorized(SECRET, SECRET)).toBe(false);
    expect(isCronAuthorized(null, SECRET)).toBe(false);
  });

  it("refuses everything when no secret is configured", () => {
    expect(isCronAuthorized("Bearer ", undefined)).toBe(false);
    expect(isCronAuthorized("Bearer ", "")).toBe(false);
  });
});
