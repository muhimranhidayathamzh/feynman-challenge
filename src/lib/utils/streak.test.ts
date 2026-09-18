import { describe, expect, it } from "vitest";

import { computeStreakOnActivity, displayStreak } from "./streak";

const TODAY = "2026-09-18";

describe("computeStreakOnActivity", () => {
  it("starts a streak of 1 when there is no prior activity", () => {
    expect(
      computeStreakOnActivity({
        lastActiveDate: null,
        currentStreak: 0,
        bestStreak: 0,
        today: TODAY,
      }),
    ).toEqual({ streakCount: 1, bestStreak: 1, lastActiveDate: TODAY, changed: true });
  });

  it("keeps everything unchanged when already active today", () => {
    expect(
      computeStreakOnActivity({
        lastActiveDate: TODAY,
        currentStreak: 4,
        bestStreak: 9,
        today: TODAY,
      }),
    ).toEqual({ streakCount: 4, bestStreak: 9, lastActiveDate: TODAY, changed: false });
  });

  it("increments when the last activity was yesterday", () => {
    const result = computeStreakOnActivity({
      lastActiveDate: "2026-09-17",
      currentStreak: 4,
      bestStreak: 4,
      today: TODAY,
    });
    expect(result).toEqual({
      streakCount: 5,
      bestStreak: 5,
      lastActiveDate: TODAY,
      changed: true,
    });
  });

  it("resets to 1 after a gap of more than one day, keeping the best", () => {
    const result = computeStreakOnActivity({
      lastActiveDate: "2026-09-15",
      currentStreak: 12,
      bestStreak: 12,
      today: TODAY,
    });
    expect(result.streakCount).toBe(1);
    expect(result.bestStreak).toBe(12);
  });

  it("is timezone-agnostic: the caller passes the user's own calendar day", () => {
    // A user in Asia/Jakarta at 05:00 on the 18th passes "2026-09-18",
    // even though it is still the 17th in UTC.
    const result = computeStreakOnActivity({
      lastActiveDate: "2026-09-17",
      currentStreak: 1,
      bestStreak: 1,
      today: "2026-09-18",
    });
    expect(result.streakCount).toBe(2);
  });
});

describe("displayStreak", () => {
  it("shows the stored streak while it is still alive (today or yesterday)", () => {
    expect(displayStreak(7, TODAY, TODAY)).toBe(7);
    expect(displayStreak(7, "2026-09-17", TODAY)).toBe(7);
  });

  it("shows 0 once the streak is broken, even before the next activity", () => {
    expect(displayStreak(7, "2026-09-16", TODAY)).toBe(0);
    expect(displayStreak(7, null, TODAY)).toBe(0);
  });
});
