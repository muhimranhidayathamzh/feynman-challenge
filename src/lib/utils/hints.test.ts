import { describe, expect, it } from "vitest";

import { buildHints, isHintMissing, sanitizeKeywords, seededShuffle } from "./hints";

describe("sanitizeKeywords", () => {
  it("drops keywords that only repeat the title", () => {
    expect(
      sanitizeKeywords("Eksperimen Bell", [
        "Bell",
        "eksperimen bell",
        "ketidaksamaan Bell",
      ]),
    ).toEqual(["ketidaksamaan Bell"]);
  });

  it("trims, dedupes case-insensitively, and skips empties", () => {
    expect(
      sanitizeKeywords("Fotosintesis", ["  klorofil ", "Klorofil", "", "   ", "cahaya"]),
    ).toEqual(["klorofil", "cahaya"]);
  });

  it("caps at four keywords and rejects overly long ones", () => {
    const long = "x".repeat(61);
    expect(sanitizeKeywords("Judul", ["a1", "b2", long, "c3", "d4", "e5"])).toEqual([
      "a1",
      "b2",
      "c3",
      "d4",
    ]);
  });
});

describe("seededShuffle", () => {
  const items = ["a", "b", "c", "d", "e", "f", "g", "h"];

  it("is deterministic for the same seed", () => {
    expect(seededShuffle(items, "challenge-1")).toEqual(
      seededShuffle(items, "challenge-1"),
    );
  });

  it("keeps every item exactly once and does not mutate the input", () => {
    const copy = [...items];
    const shuffled = seededShuffle(items, "seed");
    expect([...shuffled].sort()).toEqual([...items].sort());
    expect(items).toEqual(copy);
  });

  it("usually differs between seeds", () => {
    expect(seededShuffle(items, "one")).not.toEqual(seededShuffle(items, "two"));
  });
});

describe("buildHints", () => {
  const withHints = {
    title: "Apa itu entanglement",
    description: "Definisi",
    keywords: ["korelasi", "state bersama"],
    guiding_question: "Apa yang terjadi pada partikel kedua saat yang pertama diukur?",
  };
  const withoutHints = {
    title: "Aplikasi nyata",
    description: null,
    keywords: [],
    guiding_question: null,
  };

  it("uses stored AI hints and flags nothing missing", () => {
    const hints = buildHints([withHints], "seed");
    expect([...hints.keywords].sort()).toEqual(["korelasi", "state bersama"]);
    expect(hints.questions).toEqual([withHints.guiding_question]);
    expect(hints.missing).toBe(false);
  });

  it("falls back per point and reports missing", () => {
    const hints = buildHints([withHints, withoutHints], "seed");
    expect(hints.keywords).toContain("Aplikasi nyata");
    expect(hints.questions[1]).toBe("Bisakah kamu menjelaskan: Aplikasi nyata?");
    expect(hints.missing).toBe(true);
    expect(hints.outline).toEqual([
      { title: withHints.title, description: "Definisi" },
      { title: "Aplikasi nyata", description: null },
    ]);
  });

  it("isHintMissing requires both keywords and a question", () => {
    expect(isHintMissing({ keywords: ["x"], guiding_question: "?" })).toBe(false);
    expect(isHintMissing({ keywords: [], guiding_question: "?" })).toBe(true);
    expect(isHintMissing({ keywords: ["x"], guiding_question: "  " })).toBe(true);
  });
});
