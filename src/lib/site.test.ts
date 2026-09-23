import { describe, expect, it } from "vitest";

import { resolveSiteUrl } from "./site";

describe("resolveSiteUrl", () => {
  it("falls back to localhost so a local build never breaks", () => {
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
  });

  it("prefers an explicit site URL over anything Vercel provides", () => {
    expect(
      resolveSiteUrl({
        siteUrl: "https://feynman.id",
        vercelProductionUrl: "app.vercel.app",
        vercelUrl: "preview-abc.vercel.app",
      }),
    ).toBe("https://feynman.id");
  });

  it("prefers the stable production domain over a preview deployment", () => {
    expect(
      resolveSiteUrl({
        vercelProductionUrl: "app.vercel.app",
        vercelUrl: "preview-abc.vercel.app",
      }),
    ).toBe("https://app.vercel.app");
  });

  it("adds https to the bare hosts Vercel supplies", () => {
    expect(resolveSiteUrl({ vercelUrl: "preview-abc.vercel.app" })).toBe(
      "https://preview-abc.vercel.app",
    );
  });

  it("keeps a port, which localhost needs", () => {
    expect(resolveSiteUrl({ siteUrl: "http://localhost:4000" })).toBe(
      "http://localhost:4000",
    );
  });

  it("strips path, query and trailing slash", () => {
    expect(resolveSiteUrl({ siteUrl: "https://feynman.id/app/?x=1" })).toBe(
      "https://feynman.id",
    );
  });

  it("skips blank and unusable values instead of trusting them", () => {
    expect(resolveSiteUrl({ siteUrl: "   ", vercelUrl: "app.vercel.app" })).toBe(
      "https://app.vercel.app",
    );
    expect(resolveSiteUrl({ siteUrl: "javascript:alert(1)" })).toBe(
      "http://localhost:3000",
    );
    expect(resolveSiteUrl({ siteUrl: "ftp://files.example.com" })).toBe(
      "http://localhost:3000",
    );
  });
});
