import { describe, expect, it } from "vitest";

import {
  attemptDayLabel,
  attemptNeighbours,
  attemptOutcome,
  buildHistory,
  hintLabel,
  type AttemptSummaryRow,
} from "./attempt-history";

const row = (overrides: Partial<AttemptSummaryRow>): AttemptSummaryRow => ({
  id: "a1",
  attempt_number: 1,
  created_at: "2026-10-04T03:00:00Z",
  evaluation_status: "completed",
  overall_score: 7,
  max_possible_score: 10,
  hint_level_used: "none",
  audio_issue: "none",
  ...overrides,
});

describe("attemptOutcome", () => {
  it("names every evaluation state", () => {
    expect(attemptOutcome(row({}))).toBe("scored");
    expect(attemptOutcome(row({ overall_score: null, audio_issue: "silent" }))).toBe(
      "unscorable",
    );
    expect(attemptOutcome(row({ evaluation_status: "error", overall_score: null }))).toBe(
      "failed",
    );
    expect(
      attemptOutcome(row({ evaluation_status: "pending", overall_score: null })),
    ).toBe("processing");
    expect(
      attemptOutcome(row({ evaluation_status: "processing", overall_score: null })),
    ).toBe("processing");
  });
});

describe("attemptDayLabel", () => {
  // Jakarta is UTC+7: 20:00 UTC on the 3rd is already the 4th there.
  const tz = "Asia/Jakarta";

  it("says today and yesterday in the learner's own timezone", () => {
    expect(attemptDayLabel("2026-10-03T20:00:00Z", tz, "2026-10-04")).toBe("Hari ini");
    expect(attemptDayLabel("2026-10-03T03:00:00Z", tz, "2026-10-04")).toBe("Kemarin");
  });

  it("shows a short date, with the year only when it differs", () => {
    expect(attemptDayLabel("2026-09-21T03:00:00Z", tz, "2026-10-04")).toBe("21 Sep");
    expect(attemptDayLabel("2025-12-30T03:00:00Z", tz, "2026-10-04")).toBe("30 Des 2025");
  });

  it("returns nothing for a timestamp it cannot read", () => {
    expect(attemptDayLabel("not a date", tz, "2026-10-04")).toBe("");
  });
});

describe("hintLabel", () => {
  it("is null without a hint and the tier's name otherwise", () => {
    expect(hintLabel("none")).toBeNull();
    expect(hintLabel("keywords")).toBe("Kata kunci");
    expect(hintLabel("outline")).toBe("Outline lengkap");
  });
});

describe("buildHistory", () => {
  const context = { challengeId: "c1", timeZone: "Asia/Jakarta", today: "2026-10-04" };

  it("lists newest first, each linking to its own result page", () => {
    const history = buildHistory(
      [
        row({ id: "a1", attempt_number: 1 }),
        row({ id: "a3", attempt_number: 3 }),
        row({ id: "a2", attempt_number: 2 }),
      ],
      context,
    );
    expect(history.map((entry) => entry.number)).toEqual([3, 2, 1]);
    expect(history[0]?.href).toBe("/challenge/c1/result/a3");
  });

  it("keeps the score only for scored attempts, and says what happened otherwise", () => {
    const [failed, scored] = buildHistory(
      [
        row({
          id: "a1",
          attempt_number: 1,
          overall_score: 6,
          hint_level_used: "keywords",
          max_possible_score: 9,
        }),
        row({
          id: "a2",
          attempt_number: 2,
          evaluation_status: "error",
          overall_score: null,
        }),
      ],
      context,
    );
    expect(failed).toMatchObject({
      outcome: "failed",
      score: null,
      statusLabel: "Penilaian gagal",
    });
    expect(scored).toMatchObject({
      outcome: "scored",
      score: 6,
      maxScore: 9,
      statusLabel: null,
      hint: "Kata kunci",
    });
  });

  it("falls back to a cap of 10 when none was stored", () => {
    expect(buildHistory([row({ max_possible_score: null })], context)[0]?.maxScore).toBe(
      10,
    );
  });
});

describe("attemptNeighbours", () => {
  const attempts = [
    { id: "a1", attempt_number: 1 },
    { id: "a2", attempt_number: 2 },
    { id: "a4", attempt_number: 4 },
  ];

  it("finds the nearest attempt on each side, skipping gaps", () => {
    expect(attemptNeighbours(attempts, 2)).toEqual({
      previous: { id: "a1", number: 1 },
      next: { id: "a4", number: 4 },
    });
  });

  it("has no previous at the first attempt and no next at the last", () => {
    expect(attemptNeighbours(attempts, 1).previous).toBeNull();
    expect(attemptNeighbours(attempts, 4).next).toBeNull();
  });

  it("works whatever order the attempts arrive in", () => {
    expect(attemptNeighbours([...attempts].reverse(), 2).previous?.id).toBe("a1");
  });
});
