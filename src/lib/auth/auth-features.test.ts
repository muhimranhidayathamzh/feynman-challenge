import { describe, expect, it } from "vitest";

import { parseAuthFeatures } from "./auth-features";

describe("parseAuthFeatures", () => {
  it("reads the Google and anonymous switches", () => {
    expect(
      parseAuthFeatures({
        external: { google: true, anonymous_users: false, email: true },
      }),
    ).toEqual({ google: true, anonymous: false });
  });

  it("treats missing switches as off", () => {
    expect(parseAuthFeatures({ external: {} })).toEqual({
      google: false,
      anonymous: false,
    });
  });

  it("returns null for an unexpected payload", () => {
    expect(parseAuthFeatures(null)).toBeNull();
    expect(parseAuthFeatures({ msg: "nope" })).toBeNull();
    expect(parseAuthFeatures({ external: "x" })).toBeNull();
  });
});
