import { describe, expect, it } from "vitest";

import { normalizeCoverage, normalizeJargon, parseStoredCoverage } from "./coverage";

const TITLES = ["Apa itu QE", "Eksperimen Bell", "Bukan FTL"];

describe("normalizeCoverage", () => {
  it("produces exactly one entry per outline point, using our titles", () => {
    const result = normalizeCoverage(
      [
        {
          outline_index: 2,
          status: "partial",
          note: "kurang detail",
          evidence: "Bell itu…",
        },
        { outline_index: 1, status: "covered", note: "baik", evidence: "jadi QE adalah" },
      ],
      TITLES,
    );
    expect(result.map((c) => c.topic)).toEqual(TITLES);
    expect(result.map((c) => c.status)).toEqual(["covered", "partial", "missing"]);
    expect(result[2]).toEqual({
      outline_index: 3,
      topic: "Bukan FTL",
      status: "missing",
      note: "",
      evidence: "",
    });
  });

  it("ignores out-of-range and duplicate indices (first wins)", () => {
    const result = normalizeCoverage(
      [
        { outline_index: 9, status: "covered", note: "", evidence: "" },
        { outline_index: 1, status: "covered", note: "first", evidence: "" },
        { outline_index: 1, status: "missing", note: "second", evidence: "" },
      ],
      ["Only"],
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.note).toBe("first");
  });

  it("drops evidence for missing points and clips long text", () => {
    const result = normalizeCoverage(
      [{ outline_index: 1, status: "missing", note: "x".repeat(500), evidence: "quote" }],
      ["A"],
    );
    expect(result[0]?.evidence).toBe("");
    expect(result[0]?.note.length).toBe(400);
  });
});

describe("parseStoredCoverage", () => {
  it("reads both the old and the new stored shape", () => {
    expect(
      parseStoredCoverage([
        { topic: "A", status: "covered", note: "ok" },
        { topic: "B", status: "partial", note: "", evidence: "q", outline_index: 2 },
        { topic: "C", status: "weird", note: "" },
        "junk",
      ]),
    ).toEqual([
      { topic: "A", status: "covered", note: "ok", evidence: "" },
      { topic: "B", status: "partial", note: "", evidence: "q", outline_index: 2 },
    ]);
  });

  it("returns [] for non-arrays", () => {
    expect(parseStoredCoverage(null)).toEqual([]);
    expect(parseStoredCoverage({ a: 1 })).toEqual([]);
  });
});

describe("normalizeJargon", () => {
  it("trims, dedupes, and caps at 8", () => {
    expect(normalizeJargon([" qubit ", "Qubit", "", "superposisi"])).toEqual([
      "qubit",
      "superposisi",
    ]);
    expect(normalizeJargon(Array.from({ length: 12 }, (_, i) => `t${i}`))).toHaveLength(
      8,
    );
  });
});
