import { describe, expect, it } from "vitest";

import { siteName, sourceLink } from "./source-link";

describe("sourceLink", () => {
  it("opens the source's own page when it has a real URL", () => {
    expect(
      sourceLink({
        title: "Bunga majemuk",
        url: "https://www.id.wikipedia.org/wiki/Bunga_majemuk",
        type: "article",
      }),
    ).toEqual({
      href: "https://www.id.wikipedia.org/wiki/Bunga_majemuk",
      kind: "direct",
      label: "id.wikipedia.org",
    });
  });

  it("searches YouTube for a video without a URL", () => {
    const link = sourceLink({ title: "How Light Works", url: null, type: "video" });
    expect(link.kind).toBe("search");
    expect(link.label).toBe("cari di YouTube");
    expect(new URL(link.href).origin).toBe("https://www.youtube.com");
    expect(new URL(link.href).searchParams.get("search_query")).toBe("How Light Works");
  });

  it("searches Google Scholar for a paper", () => {
    const link = sourceLink({ title: "Rayleigh scattering", url: null, type: "paper" });
    expect(new URL(link.href).host).toBe("scholar.google.com");
    expect(new URL(link.href).searchParams.get("q")).toBe("Rayleigh scattering");
  });

  it("searches Google for articles, books and anything else", () => {
    for (const type of ["article", "book", "other"] as const) {
      const link = sourceLink({ title: "Why Is the Sky Blue?", url: null, type });
      expect(link.label, type).toBe("cari di Google");
      expect(new URL(link.href).host, type).toBe("www.google.com");
      expect(new URL(link.href).searchParams.get("q"), type).toBe("Why Is the Sky Blue?");
    }
  });

  it("encodes titles safely instead of building a broken URL", () => {
    const link = sourceLink({
      title: "  C++ & Rust: #1 vs 100%?  ",
      url: null,
      type: "article",
    });
    expect(new URL(link.href).searchParams.get("q")).toBe("C++ & Rust: #1 vs 100%?");
  });

  it("falls back to a search when the stored URL is not a usable http(s) link", () => {
    for (const url of ["javascript:alert(1)", "not a url", "ftp://files.example.com/x"]) {
      const link = sourceLink({ title: "Judul", url, type: "article" });
      expect(link.kind, url).toBe("search");
      expect(new URL(link.href).protocol, url).toBe("https:");
    }
  });
});

describe("siteName", () => {
  it("drops www. and keeps subdomains", () => {
    expect(siteName("https://www.khanacademy.org/x")).toBe("khanacademy.org");
    expect(siteName("https://id.wikipedia.org/wiki/A")).toBe("id.wikipedia.org");
  });

  it("rejects anything that is not http(s)", () => {
    expect(siteName("javascript:alert(1)")).toBeNull();
    expect(siteName("nonsense")).toBeNull();
  });
});
