import { describe, expect, it } from "vitest";

import type { Coverage, CoverageStatus } from "@/types";

import {
  TREND_LENGTH,
  buildCoverageTrend,
  compareCoverage,
  isEmptyComparison,
  matchCoverageToOutline,
} from "./coverage-progress";

const OUTLINE = [
  { id: "a", title: "Apa itu QE" },
  { id: "b", title: "Eksperimen Bell" },
  { id: "c", title: "Bukan FTL" },
];

function cov(topic: string, status: CoverageStatus, outline_index?: number): Coverage {
  return {
    topic,
    status,
    note: "",
    evidence: "",
    ...(outline_index !== undefined ? { outline_index } : {}),
  };
}

describe("matchCoverageToOutline", () => {
  it("matches by title, ignoring case and extra spaces", () => {
    const ids = matchCoverageToOutline(
      [cov("apa itu  QE", "covered", 1), cov("Bukan FTL ", "partial", 3)],
      OUTLINE,
    );
    expect(ids).toEqual(["a", "c"]);
  });

  it("follows a reordered outline through titles, not positions", () => {
    const reordered = [OUTLINE[2]!, OUTLINE[0]!, OUTLINE[1]!];
    const ids = matchCoverageToOutline(
      [
        cov("Apa itu QE", "covered", 1),
        cov("Eksperimen Bell", "partial", 2),
        cov("Bukan FTL", "missing", 3),
      ],
      reordered,
    );
    expect(ids).toEqual(["a", "b", "c"]);
  });

  it("falls back to outline_index for a renamed point", () => {
    const renamed = [OUTLINE[0]!, { id: "b", title: "Uji Bell" }, OUTLINE[2]!];
    const ids = matchCoverageToOutline(
      [
        cov("Apa itu QE", "covered", 1),
        cov("Eksperimen Bell", "partial", 2),
        cov("Bukan FTL", "missing", 3),
      ],
      renamed,
    );
    expect(ids).toEqual(["a", "b", "c"]);
  });

  it("does not hand a deleted point's verdict to the item that took its place", () => {
    const withoutB = [OUTLINE[0]!, OUTLINE[2]!];
    const ids = matchCoverageToOutline(
      [
        cov("Apa itu QE", "covered", 1),
        cov("Eksperimen Bell", "missing", 2),
        cov("Bukan FTL", "covered", 3),
      ],
      withoutB,
    );
    expect(ids).toEqual(["a", null, "c"]);
  });

  it("matches old coverage (no index) by title only", () => {
    const ids = matchCoverageToOutline(
      [cov("Eksperimen Bell", "covered"), cov("Topik lama", "partial")],
      OUTLINE,
    );
    expect(ids).toEqual(["b", null]);
  });

  it("never assigns one outline item twice", () => {
    const ids = matchCoverageToOutline(
      [cov("Apa itu QE", "covered", 1), cov("Apa itu QE", "partial", 1)],
      OUTLINE,
    );
    expect(ids).toEqual(["a", null]);
  });
});

describe("buildCoverageTrend", () => {
  it("lists statuses oldest first, with null for attempts that missed the point", () => {
    const trend = buildCoverageTrend(
      [
        { attemptNumber: 2, coverage: [cov("Apa itu QE", "covered", 1)] },
        {
          attemptNumber: 1,
          coverage: [cov("Apa itu QE", "missing", 1), cov("Bukan FTL", "partial", 2)],
        },
      ],
      OUTLINE,
    );
    expect(trend["a"]).toEqual([
      { attemptNumber: 1, status: "missing" },
      { attemptNumber: 2, status: "covered" },
    ]);
    expect(trend["c"]).toEqual([
      { attemptNumber: 1, status: "partial" },
      { attemptNumber: 2, status: null },
    ]);
    expect(trend["b"]).toBeUndefined();
  });

  it(`keeps only the last ${TREND_LENGTH} attempts that have coverage`, () => {
    const attempts = Array.from({ length: 7 }, (_, index) => ({
      attemptNumber: index + 1,
      coverage: [cov("Apa itu QE", index % 2 === 0 ? "partial" : "covered", 1)],
    }));
    attempts.push({ attemptNumber: 8, coverage: [] });
    const trend = buildCoverageTrend(attempts, OUTLINE);
    expect(trend["a"]?.map((point) => point.attemptNumber)).toEqual([3, 4, 5, 6, 7]);
  });

  it("is empty without attempts", () => {
    expect(buildCoverageTrend([], OUTLINE)).toEqual({});
  });
});

describe("compareCoverage", () => {
  it("sorts points into improved, declined, still weak, and steady", () => {
    const previous = [
      cov("Apa itu QE", "missing", 1),
      cov("Eksperimen Bell", "partial", 2),
      cov("Bukan FTL", "covered", 3),
    ];
    const current = [
      cov("Apa itu QE", "covered", 1),
      cov("Eksperimen Bell", "partial", 2),
      cov("Bukan FTL", "partial", 3),
    ];
    const result = compareCoverage(current, previous, OUTLINE);
    expect(result.improved).toEqual([
      { topic: "Apa itu QE", from: "missing", to: "covered", outlineId: "a" },
    ]);
    expect(result.stillWeak).toEqual([
      { topic: "Eksperimen Bell", from: "partial", to: "partial", outlineId: "b" },
    ]);
    expect(result.declined).toEqual([
      { topic: "Bukan FTL", from: "covered", to: "partial", outlineId: "c" },
    ]);
    expect(result.steadyCount).toBe(0);
  });

  it("counts points covered both times as steady", () => {
    const both = [cov("Apa itu QE", "covered", 1)];
    const result = compareCoverage(both, both, OUTLINE);
    expect(result.steadyCount).toBe(1);
    expect(isEmptyComparison(result)).toBe(false);
  });

  it("pairs points that left the outline by title", () => {
    const result = compareCoverage(
      [cov("Topik lama", "covered", 4)],
      [cov("Topik lama", "missing", 4)],
      OUTLINE,
    );
    expect(result.improved).toEqual([
      { topic: "Topik lama", from: "missing", to: "covered", outlineId: null },
    ]);
  });

  it("skips points with no previous verdict", () => {
    const result = compareCoverage(
      [cov("Bukan FTL", "partial", 3)],
      [cov("Apa itu QE", "covered", 1)],
      OUTLINE,
    );
    expect(isEmptyComparison(result)).toBe(true);
  });
});
