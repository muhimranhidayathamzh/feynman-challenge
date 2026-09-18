import { describe, expect, it } from "vitest";

import {
  DEFAULT_TIMEZONE,
  addDays,
  calendarDay,
  dayDiff,
  formatDay,
  isCalendarDay,
  isValidTimeZone,
} from "./date";

describe("calendarDay", () => {
  it("is the local day, not the UTC day", () => {
    // 00:30 WIB on Sep 18 is still Sep 17 in UTC.
    const instant = new Date("2026-09-17T17:30:00Z");
    expect(calendarDay(instant, "Asia/Jakarta")).toBe("2026-09-18");
    expect(calendarDay(instant, "UTC")).toBe("2026-09-17");
    expect(calendarDay(instant, "America/Los_Angeles")).toBe("2026-09-17");
  });

  it("falls back to the default timezone for unknown zones", () => {
    const instant = new Date("2026-09-17T17:30:00Z");
    expect(calendarDay(instant, "Mars/Olympus")).toBe(
      calendarDay(instant, DEFAULT_TIMEZONE),
    );
    expect(isValidTimeZone("Asia/Jakarta")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
  });
});

describe("dayDiff / addDays", () => {
  it("counts whole days, crossing month and year boundaries", () => {
    expect(dayDiff("2026-09-18", "2026-09-18")).toBe(0);
    expect(dayDiff("2026-09-17", "2026-09-18")).toBe(1);
    expect(dayDiff("2026-09-18", "2026-09-15")).toBe(-3);
    expect(dayDiff("2026-12-31", "2027-01-01")).toBe(1);
  });

  it("adds days across boundaries", () => {
    expect(addDays("2026-09-30", 2)).toBe("2026-10-02");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2026-09-18", 0)).toBe("2026-09-18");
  });
});

describe("formatDay", () => {
  it("formats a calendar day in Indonesian without timezone drift", () => {
    expect(formatDay("2026-09-22")).toMatch(/^22 Sep/);
    expect(formatDay("2026-01-01", true)).toMatch(/1 Jan 2026/);
  });
});

describe("isCalendarDay", () => {
  it("accepts only YYYY-MM-DD", () => {
    expect(isCalendarDay("2026-09-18")).toBe(true);
    expect(isCalendarDay("2026-9-18")).toBe(false);
    expect(isCalendarDay("2026-09-18T00:00:00Z")).toBe(false);
    expect(isCalendarDay(null)).toBe(false);
  });
});
