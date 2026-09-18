import { describe, expect, it } from "vitest";

import {
  AUTO_EXTEND_DAYS,
  autoExtendedDate,
  daysUntil,
  getDeadlineInfo,
  needsAutoExtend,
} from "./deadline";

// Tests run with TZ=UTC (see vitest.config.ts), so ISO dates map 1:1 to days.
const NOW = new Date("2026-09-18T12:00:00Z");

function inDays(days: number): string {
  const date = new Date(NOW);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

describe("daysUntil", () => {
  it("counts whole calendar days regardless of time of day", () => {
    expect(daysUntil("2026-09-18T23:59:59Z", NOW)).toBe(0);
    expect(daysUntil("2026-09-19T00:00:01Z", NOW)).toBe(1);
    expect(daysUntil("2026-09-15T20:00:00Z", NOW)).toBe(-3);
  });
});

describe("getDeadlineInfo — status and nudge per spec §6.5", () => {
  it("no deadline", () => {
    expect(getDeadlineInfo(null, null, NOW)).toEqual({
      status: "none",
      effectiveDate: null,
      daysUntil: null,
      nudge: null,
      isExtended: false,
    });
  });

  it("4+ days away is upcoming without a nudge", () => {
    const info = getDeadlineInfo(inDays(4), null, NOW);
    expect(info.status).toBe("upcoming");
    expect(info.nudge).toBeNull();
    expect(info.daysUntil).toBe(4);
  });

  it("3 days away", () => {
    const info = getDeadlineInfo(inDays(3), null, NOW);
    expect(info.status).toBe("due_soon");
    expect(info.nudge).toBe("3 hari lagi ⏰");
  });

  it("1 day away", () => {
    const info = getDeadlineInfo(inDays(1), null, NOW);
    expect(info.status).toBe("due_soon");
    expect(info.nudge).toBe("Besok! Sudah siap? 🎙️");
  });

  it("today", () => {
    const info = getDeadlineInfo(inDays(0), null, NOW);
    expect(info.status).toBe("due_today");
    expect(info.nudge).toBe("Hari ini! Kamu pasti bisa 💪");
  });

  it("overdue without extension", () => {
    const info = getDeadlineInfo(inDays(-1), null, NOW);
    expect(info.status).toBe("overdue");
    expect(info.nudge).toBe("Nggak apa-apa, waktu ditambah!");
    expect(info.isExtended).toBe(false);
  });

  it("extended deadline overrides the original and marks isExtended", () => {
    const info = getDeadlineInfo(inDays(-3), inDays(2), NOW);
    expect(info.status).toBe("due_soon");
    expect(info.effectiveDate).toBe(inDays(2));
    expect(info.isExtended).toBe(true);
  });

  it("overdue even after extension", () => {
    const info = getDeadlineInfo(inDays(-3), inDays(-1), NOW);
    expect(info.status).toBe("extended_overdue");
    expect(info.nudge).toBe("Mau reschedule atau istirahat dulu?");
  });
});

describe("needsAutoExtend / autoExtendedDate", () => {
  it("only an unextended, passed deadline needs auto-extend", () => {
    expect(needsAutoExtend(inDays(-1), null, NOW)).toBe(true);
    expect(needsAutoExtend(inDays(-1), inDays(1), NOW)).toBe(false);
    expect(needsAutoExtend(inDays(0), null, NOW)).toBe(false);
    expect(needsAutoExtend(inDays(2), null, NOW)).toBe(false);
    expect(needsAutoExtend(null, null, NOW)).toBe(false);
  });

  it("extends by AUTO_EXTEND_DAYS", () => {
    expect(AUTO_EXTEND_DAYS).toBe(2);
    expect(autoExtendedDate("2026-09-10T16:59:59.000Z")).toBe("2026-09-12T16:59:59.000Z");
  });

  it.todo(
    "day boundaries use the server's local date (UTC on Vercel), not the user's timezone (fixed in Prompt 1.5)",
  );
});
