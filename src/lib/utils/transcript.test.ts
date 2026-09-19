import { describe, expect, it } from "vitest";

import { DEMO_ATTEMPT } from "@/lib/demo/fixture";

import { annotateTranscript, findQuote, splitSummary } from "./transcript";

describe("splitSummary", () => {
  it("takes the first sentence as the summary", () => {
    expect(splitSummary("Bagus sekali. Tapi tahap kedua belum ada.")).toEqual({
      summary: "Bagus sekali.",
      rest: "Tapi tahap kedua belum ada.",
    });
  });

  it("keeps a single sentence whole", () => {
    expect(splitSummary("  Penjelasanmu jelas dan runtut  ")).toEqual({
      summary: "Penjelasanmu jelas dan runtut",
      rest: "",
    });
  });

  it("does not split on an abbreviation followed by lowercase", () => {
    expect(splitSummary("Pakai contoh, mis. dapur. Itu membantu.").summary).toBe(
      "Pakai contoh, mis. dapur.",
    );
  });

  it("returns null for empty feedback", () => {
    expect(splitSummary(null)).toEqual({ summary: null, rest: "" });
    expect(splitSummary("   ")).toEqual({ summary: null, rest: "" });
  });
});

describe("findQuote", () => {
  const text = "Oke, jadi fotosintesis itu cara tumbuhan bikin makanannya sendiri.";

  it("ignores case, spacing, and punctuation differences", () => {
    const range = findQuote(text, "Fotosintesis itu   cara tumbuhan, bikin makanannya");
    expect(range).not.toBeNull();
    const [start, end] = range as [number, number];
    expect(text.slice(start, end)).toBe(
      "fotosintesis itu cara tumbuhan bikin makanannya",
    );
  });

  it("returns null when the quote is not in the transcript", () => {
    expect(findQuote(text, "siklus Calvin")).toBeNull();
    expect(findQuote(text, "")).toBeNull();
  });
});

describe("annotateTranscript", () => {
  it("returns no pieces for an empty transcript", () => {
    expect(annotateTranscript("", ["a"], [])).toEqual({ pieces: [], found: [false] });
  });

  it("marks each quote with its coverage index and keeps all text", () => {
    const text = "Satu dua tiga. Empat lima enam.";
    const { pieces, found } = annotateTranscript(text, ["dua tiga", "", "lima"], []);
    expect(found).toEqual([true, false, true]);
    expect(pieces.map((p) => p.text).join("")).toBe(text);
    expect(pieces.filter((p) => p.point === 0).map((p) => p.text)).toEqual(["dua tiga"]);
    expect(pieces.filter((p) => p.point === 2).map((p) => p.text)).toEqual(["lima"]);
  });

  it("gives overlapping text to the earliest coverage entry", () => {
    const text = "alpha beta gamma delta";
    const { pieces } = annotateTranscript(text, ["beta gamma", "gamma delta"], []);
    // Adjacent pieces of the same quote merge into one highlight.
    expect(pieces.map((p) => [p.text, p.point])).toEqual([
      ["alpha ", null],
      ["beta gamma", 0],
      [" delta", 1],
    ]);
  });

  it("underlines whole-word jargon, also inside evidence", () => {
    const text = "Ada klorofil di kloroplas, bukan kloroplasma.";
    const { pieces } = annotateTranscript(text, ["klorofil di kloroplas"], ["kloroplas"]);
    const terms = pieces.filter((p) => p.jargon === "kloroplas");
    expect(terms).toHaveLength(1);
    expect(terms[0]?.point).toBe(0);
    expect(pieces.map((p) => p.text).join("")).toBe(text);
  });

  it("finds every evidence quote of the demo attempt", () => {
    const { found } = annotateTranscript(
      DEMO_ATTEMPT.transcript,
      DEMO_ATTEMPT.coverage.map((entry) => entry.evidence),
      DEMO_ATTEMPT.unexplainedJargon,
    );
    expect(found).toEqual([true, true, true, false]);
  });
});
