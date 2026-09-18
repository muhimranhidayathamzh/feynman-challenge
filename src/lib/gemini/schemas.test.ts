import { describe, expect, it } from "vitest";

import { GeneratedSourceSchema, normalizeHttpUrl } from "./schemas";

describe("normalizeHttpUrl", () => {
  it("keeps http and https URLs, trimmed", () => {
    expect(normalizeHttpUrl("  https://example.com/a?b=1 ")).toBe(
      "https://example.com/a?b=1",
    );
    expect(normalizeHttpUrl("http://example.com")).toBe("http://example.com");
  });

  it("turns empty, null, and undefined into null", () => {
    expect(normalizeHttpUrl("")).toBeNull();
    expect(normalizeHttpUrl("   ")).toBeNull();
    expect(normalizeHttpUrl(null)).toBeNull();
    expect(normalizeHttpUrl(undefined)).toBeNull();
  });

  it("rejects non-http schemes and free text", () => {
    expect(normalizeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeHttpUrl("data:text/html,hi")).toBeNull();
    expect(normalizeHttpUrl("ftp://example.com")).toBeNull();
    expect(normalizeHttpUrl("Bab 3 buku Fisika Dasar")).toBeNull();
  });
});

describe("GeneratedSourceSchema", () => {
  it("never rejects a source over a bad URL; it nulls the URL instead", () => {
    const parsed = GeneratedSourceSchema.safeParse({
      title: "Kuliah MIT",
      url: "not a url",
      type: "video",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.url).toBeNull();
  });

  it("falls back to type 'other' for unknown types", () => {
    const parsed = GeneratedSourceSchema.safeParse({ title: "X", type: "podcast" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.type).toBe("other");
  });
});
