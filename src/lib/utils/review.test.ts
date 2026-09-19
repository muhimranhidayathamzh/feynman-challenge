import { describe, expect, it } from "vitest";

import {
  MAX_BOX,
  computeReviewAfterAttempt,
  daysOverdue,
  intervalForBox,
  isLapsed,
  isReviewDue,
  leitnerSlots,
  nextReviewLabel,
} from "./review";

const TODAY = "2026-09-19";

describe("intervalForBox", () => {
  it("follows 1, 3, 7, 14, 30, 60 days and clamps out-of-range boxes", () => {
    expect([0, 1, 2, 3, 4, 5].map(intervalForBox)).toEqual([1, 3, 7, 14, 30, 60]);
    expect(intervalForBox(-2)).toBe(1);
    expect(intervalForBox(99)).toBe(60);
  });
});

describe("computeReviewAfterAttempt", () => {
  it("first strong attempt moves to box 1, due in 3 days", () => {
    expect(
      computeReviewAfterAttempt({
        state: { box: 0, nextReviewAt: null },
        score: 9,
        today: TODAY,
      }),
    ).toEqual({ box: 1, nextReviewAt: "2026-09-22" });
  });

  it("a strong review on the due day promotes", () => {
    expect(
      computeReviewAfterAttempt({
        state: { box: 2, nextReviewAt: TODAY },
        score: 8,
        today: TODAY,
      }),
    ).toEqual({ box: 3, nextReviewAt: "2026-10-03" });
  });

  it("a strong review after the due day still promotes", () => {
    expect(
      computeReviewAfterAttempt({
        state: { box: 1, nextReviewAt: "2026-09-10" },
        score: 10,
        today: TODAY,
      }).box,
    ).toBe(2);
  });

  it("an EARLY strong review does not promote and keeps the schedule", () => {
    expect(
      computeReviewAfterAttempt({
        state: { box: 2, nextReviewAt: "2026-09-25" },
        score: 10,
        today: TODAY,
      }),
    ).toEqual({ box: 2, nextReviewAt: "2026-09-25" });
  });

  it("an okay score keeps the box and reschedules from today", () => {
    expect(
      computeReviewAfterAttempt({
        state: { box: 3, nextReviewAt: "2026-09-25" },
        score: 6,
        today: TODAY,
      }),
    ).toEqual({ box: 3, nextReviewAt: "2026-10-03" });
  });

  it("a weak score resets to box 0, due tomorrow", () => {
    expect(
      computeReviewAfterAttempt({
        state: { box: 4, nextReviewAt: TODAY },
        score: 4,
        today: TODAY,
      }),
    ).toEqual({ box: 0, nextReviewAt: "2026-09-20" });
  });

  it("never goes past the last box", () => {
    expect(
      computeReviewAfterAttempt({
        state: { box: MAX_BOX, nextReviewAt: TODAY },
        score: 10,
        today: TODAY,
      }).box,
    ).toBe(MAX_BOX);
  });

  it("five same-day strong attempts cannot fast-track the boxes", () => {
    let state = { box: 0, nextReviewAt: null as string | null };
    for (let i = 0; i < 5; i += 1) {
      state = computeReviewAfterAttempt({ state, score: 10, today: TODAY });
    }
    expect(state.box).toBe(1);
  });
});

describe("due / overdue / lapsed", () => {
  it("isReviewDue", () => {
    expect(isReviewDue(null, TODAY)).toBe(true);
    expect(isReviewDue(TODAY, TODAY)).toBe(true);
    expect(isReviewDue("2026-09-18", TODAY)).toBe(true);
    expect(isReviewDue("2026-09-20", TODAY)).toBe(false);
  });

  it("daysOverdue", () => {
    expect(daysOverdue(null, TODAY)).toBeNull();
    expect(daysOverdue("2026-09-16", TODAY)).toBe(3);
    expect(daysOverdue("2026-09-21", TODAY)).toBe(-2);
  });

  it("lapses only after more than one full interval past due", () => {
    // box 2 -> 7-day interval
    expect(isLapsed({ box: 2, nextReviewAt: "2026-09-12" }, TODAY)).toBe(false); // 7 days
    expect(isLapsed({ box: 2, nextReviewAt: "2026-09-11" }, TODAY)).toBe(true); // 8 days
    expect(isLapsed({ box: 0, nextReviewAt: null }, TODAY)).toBe(false);
  });
});

describe("nextReviewLabel", () => {
  it("describes the next review relative to today", () => {
    expect(nextReviewLabel(null, TODAY)).toBeNull();
    expect(nextReviewLabel(TODAY, TODAY)).toBe("Review hari ini");
    expect(nextReviewLabel("2026-09-20", TODAY)).toBe("Review besok");
    expect(nextReviewLabel("2026-09-16", TODAY)).toBe("Review terlambat 3 hari");
    expect(nextReviewLabel("2026-09-29", TODAY)).toMatch(/^Review berikutnya: 29 Sep/);
  });
});

describe("leitnerSlots", () => {
  it("lists the six boxes with their intervals and marks the current one", () => {
    const slots = leitnerSlots(2);
    expect(slots.map((slot) => slot.days)).toEqual([1, 3, 7, 14, 30, 60]);
    expect(slots.filter((slot) => slot.current).map((slot) => slot.box)).toEqual([2]);
  });

  it("clamps out-of-range boxes", () => {
    expect(leitnerSlots(-3).findIndex((slot) => slot.current)).toBe(0);
    expect(leitnerSlots(99).findIndex((slot) => slot.current)).toBe(5);
  });
});
