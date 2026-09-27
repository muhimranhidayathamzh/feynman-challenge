import { describe, expect, it } from "vitest";

import type { CoverageChange } from "./coverage-progress";
import { comparisonSummary, nextFocus, notesSummary } from "./result-digest";

describe("notesSummary", () => {
  it("counts every non-empty group", () => {
    expect(notesSummary(3, 2, 1)).toBe(
      "3 sudah kuat · 2 bisa lebih baik · 1 istilah belum dijelaskan",
    );
  });

  it("leaves out empty groups", () => {
    expect(notesSummary(0, 2, 0)).toBe("2 bisa lebih baik");
  });

  it("is empty when there is nothing to count", () => {
    expect(notesSummary(0, 0, 0)).toBe("");
  });
});

describe("comparisonSummary", () => {
  const change: CoverageChange = {
    topic: "t",
    from: "missing",
    to: "covered",
    outlineId: null,
  };

  it("names each kind of change once, in reading order", () => {
    expect(
      comparisonSummary({
        improved: [change, change],
        declined: [change],
        stillWeak: [change],
        steadyCount: 1,
      }),
    ).toBe("2 membaik · 1 menurun · 1 masih kurang · 1 tetap tercakup");
  });

  it("leaves out kinds that did not happen", () => {
    expect(
      comparisonSummary({ improved: [], declined: [], stillWeak: [], steadyCount: 4 }),
    ).toBe("4 tetap tercakup");
  });
});

describe("nextFocus", () => {
  const points = [
    { topic: "Apa itu fotosintesis", status: "covered" as const },
    { topic: "Peran klorofil", status: "partial" as const },
    { topic: "Siklus Calvin", status: "missing" as const },
  ];

  it("prefers the evaluator's first improvement", () => {
    expect(nextFocus(["Jelaskan kenapa daun hijau.", "Lainnya."], points)).toBe(
      "Jelaskan kenapa daun hijau.",
    );
  });

  it("skips blank improvements", () => {
    expect(nextFocus(["   ", "Jelaskan tahapnya."], points)).toBe("Jelaskan tahapnya.");
  });

  it("falls back to a missing point before a partial one", () => {
    expect(nextFocus([], points)).toBe("Bahas Siklus Calvin di percobaan berikutnya.");
  });

  it("falls back to a partial point when nothing is missing", () => {
    expect(nextFocus([], points.slice(0, 2))).toBe(
      "Lengkapi penjelasanmu tentang Peran klorofil.",
    );
  });

  it("invents nothing when everything is covered", () => {
    expect(nextFocus([], points.slice(0, 1))).toBeNull();
    expect(nextFocus([], [])).toBeNull();
  });
});
