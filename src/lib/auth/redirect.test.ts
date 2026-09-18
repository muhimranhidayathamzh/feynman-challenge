import { describe, expect, it } from "vitest";

import { loginPathFor, safeNext } from "./redirect";

describe("safeNext", () => {
  it("keeps same-origin paths with query and hash", () => {
    expect(safeNext("/challenge/abc")).toBe("/challenge/abc");
    expect(safeNext("/?tab=selesai")).toBe("/?tab=selesai");
    expect(safeNext("/pengaturan#kata-sandi")).toBe("/pengaturan#kata-sandi");
    expect(safeNext(["/a", "/b"])).toBe("/a");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeNext("https://evil.com")).toBe("/");
    expect(safeNext("//evil.com")).toBe("/");
    expect(safeNext("//evil.com/path")).toBe("/");
    expect(safeNext("javascript:alert(1)")).toBe("/");
  });

  it("rejects backslash and control-character tricks", () => {
    expect(safeNext("/\\evil.com")).toBe("/");
    expect(safeNext("/foo\\bar")).toBe("/");
    expect(safeNext("/foo\nbar")).toBe("/");
    expect(safeNext("/\tevil.com")).toBe("/");
  });

  it("falls back to / for empty values", () => {
    expect(safeNext(null)).toBe("/");
    expect(safeNext(undefined)).toBe("/");
    expect(safeNext("")).toBe("/");
    expect(safeNext("relative/path")).toBe("/");
  });

  it("allows a full URL inside the query string (still same origin)", () => {
    expect(safeNext("/x?ref=https://evil.com")).toBe("/x?ref=https://evil.com");
  });
});

describe("loginPathFor", () => {
  it("adds an encoded next param except for the dashboard", () => {
    expect(loginPathFor("/")).toBe("/login");
    expect(loginPathFor("/challenge/abc?x=1")).toBe(
      "/login?next=%2Fchallenge%2Fabc%3Fx%3D1",
    );
    expect(loginPathFor("//evil.com")).toBe("/login");
  });
});
