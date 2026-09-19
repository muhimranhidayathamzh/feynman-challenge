import { describe, expect, it } from "vitest";

import { addDays } from "./date";
import { AUTO_EXTEND_DAYS, NO_DEADLINE, getDeadlineInfo } from "./deadline";

const TODAY = "2026-09-18";
const inDays = (days: number) => addDays(TODAY, days);

describe("getDeadlineInfo — status and nudge per spec §6.5", () => {
  it("no deadline", () => {
    expect(getDeadlineInfo(null, TODAY)).toEqual(NO_DEADLINE);
  });

  it("4+ days away is upcoming without a nudge", () => {
    const info = getDeadlineInfo(inDays(4), TODAY);
    expect(info.status).toBe("upcoming");
    expect(info.nudge).toBeNull();
    expect(info.daysUntil).toBe(4);
    expect(info.isExtended).toBe(false);
  });

  it("3 days away", () => {
    const info = getDeadlineInfo(inDays(3), TODAY);
    expect(info.status).toBe("due_soon");
    expect(info.nudge).toBe("3 hari lagi");
  });

  it("1 day away", () => {
    const info = getDeadlineInfo(inDays(1), TODAY);
    expect(info.status).toBe("due_soon");
    expect(info.nudge).toBe("Besok. Sudah siap?");
  });

  it("today", () => {
    const info = getDeadlineInfo(inDays(0), TODAY);
    expect(info.status).toBe("due_today");
    expect(info.nudge).toBe("Hari ini. Kamu pasti bisa.");
  });

  it("missed by one day: automatically extended, gently", () => {
    const info = getDeadlineInfo(inDays(-1), TODAY);
    expect(info.status).toBe("overdue");
    expect(info.nudge).toBe("Nggak apa-apa, waktu ditambah!");
    expect(info.isExtended).toBe(true);
    expect(info.effectiveDate).toBe(inDays(-1 + AUTO_EXTEND_DAYS));
    expect(info.daysUntil).toBe(1);
  });

  it("last day of the grace period still counts as overdue (not extended_overdue)", () => {
    const info = getDeadlineInfo(inDays(-AUTO_EXTEND_DAYS), TODAY);
    expect(info.status).toBe("overdue");
    expect(info.daysUntil).toBe(0);
  });

  it("grace period passed too", () => {
    const info = getDeadlineInfo(inDays(-AUTO_EXTEND_DAYS - 1), TODAY);
    expect(info.status).toBe("extended_overdue");
    expect(info.nudge).toBe("Mau jadwal ulang atau istirahat dulu?");
    expect(info.daysUntil).toBe(-1);
    expect(info.isExtended).toBe(true);
  });

  it("is a pure function of two calendar days (no server clock, no timezone)", () => {
    expect(getDeadlineInfo("2026-09-18", "2026-09-18").status).toBe("due_today");
    expect(getDeadlineInfo("2026-09-18", "2026-09-19").status).toBe("overdue");
  });
});
