import { describe, expect, it } from "vitest";

import { computeStreakOnActivity } from "./streak";

const TODAY = new Date("2026-09-18T10:00:00Z");

describe("computeStreakOnActivity", () => {
  it("starts a streak of 1 when there is no prior activity", () => {
    const result = computeStreakOnActivity({
      lastActiveDate: null,
      currentStreak: 0,
      bestStreak: 0,
      today: TODAY,
    });
    expect(result).toEqual({
      streakCount: 1,
      bestStreak: 1,
      lastActiveDate: "2026-09-18",
      changed: true,
    });
  });

  it("keeps everything unchanged when already active today", () => {
    const result = computeStreakOnActivity({
      lastActiveDate: "2026-09-18",
      currentStreak: 4,
      bestStreak: 9,
      today: TODAY,
    });
    expect(result).toEqual({
      streakCount: 4,
      bestStreak: 9,
      lastActiveDate: "2026-09-18",
      changed: false,
    });
  });

  it("increments when the last activity was yesterday", () => {
    const result = computeStreakOnActivity({
      lastActiveDate: "2026-09-17",
      currentStreak: 4,
      bestStreak: 4,
      today: TODAY,
    });
    expect(result.streakCount).toBe(5);
    expect(result.bestStreak).toBe(5);
    expect(result.lastActiveDate).toBe("2026-09-18");
    expect(result.changed).toBe(true);
  });

  it("resets to 1 after a gap of more than one day", () => {
    const result = computeStreakOnActivity({
      lastActiveDate: "2026-09-15",
      currentStreak: 12,
      bestStreak: 12,
      today: TODAY,
    });
    expect(result.streakCount).toBe(1);
    expect(result.bestStreak).toBe(12);
    expect(result.changed).toBe(true);
  });

  it("never lowers the best streak", () => {
    const result = computeStreakOnActivity({
      lastActiveDate: "2026-09-17",
      currentStreak: 2,
      bestStreak: 20,
      today: TODAY,
    });
    expect(result.bestStreak).toBe(20);
  });

  it.todo(
    "days are compared as UTC calendar days; a user in Asia/Jakarta active at 05:00 local is credited to the previous day (fixed in Prompt 1.5)",
  );
});
