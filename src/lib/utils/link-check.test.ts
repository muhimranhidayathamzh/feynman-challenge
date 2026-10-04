import { describe, expect, it } from "vitest";

import {
  isCheckableUrl,
  keepLink,
  verdictForStatus,
  youtubeOembedUrl,
} from "./link-check";

describe("isCheckableUrl", () => {
  it("allows public https pages", () => {
    expect(isCheckableUrl("https://id.wikipedia.org/wiki/Bunga_majemuk")).toBe(true);
    expect(isCheckableUrl("https://www.youtube.com/watch?v=abc")).toBe(true);
  });

  it("refuses anything that could reach an internal address", () => {
    expect(isCheckableUrl("http://example.com")).toBe(false);
    expect(isCheckableUrl("https://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isCheckableUrl("https://127.0.0.1")).toBe(false);
    expect(isCheckableUrl("https://[::1]/")).toBe(false);
    expect(isCheckableUrl("https://localhost/x")).toBe(false);
    expect(isCheckableUrl("https://printer.local/")).toBe(false);
    expect(isCheckableUrl("https://db.internal/")).toBe(false);
    expect(isCheckableUrl("https://intranet/")).toBe(false);
    expect(isCheckableUrl("https://user:pass@example.com/")).toBe(false);
    expect(isCheckableUrl("https://example.com:8443/")).toBe(false);
    expect(isCheckableUrl("bukan url")).toBe(false);
  });
});

describe("verdictForStatus", () => {
  it("reads the status code", () => {
    expect(verdictForStatus(200)).toBe("alive");
    expect(verdictForStatus(301)).toBe("alive");
    expect(verdictForStatus(404)).toBe("dead");
    expect(verdictForStatus(410)).toBe("dead");
    expect(verdictForStatus(403)).toBe("unknown");
    expect(verdictForStatus(429)).toBe("unknown");
    expect(verdictForStatus(503)).toBe("unknown");
  });

  it("drops only links shown to be dead", () => {
    expect(keepLink("alive")).toBe(true);
    expect(keepLink("unknown")).toBe(true);
    expect(keepLink("dead")).toBe(false);
  });
});

describe("youtubeOembedUrl", () => {
  it("checks YouTube videos through oEmbed", () => {
    expect(youtubeOembedUrl("https://www.youtube.com/watch?v=abc")).toBe(
      "https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Dabc",
    );
    expect(youtubeOembedUrl("https://youtu.be/abc")).toContain("/oembed?");
    expect(youtubeOembedUrl("https://m.youtube.com/shorts/abc")).toContain("/oembed?");
  });

  it("leaves other pages alone", () => {
    expect(youtubeOembedUrl("https://www.youtube.com/@channel")).toBeNull();
    expect(youtubeOembedUrl("https://vimeo.com/123")).toBeNull();
  });
});
