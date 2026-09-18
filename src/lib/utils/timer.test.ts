import { describe, expect, it } from "vitest";

import { formatClock, timerAnnouncement } from "./timer";

describe("formatClock", () => {
  it("formats minutes and seconds with padding, never negative", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(65.9)).toBe("01:05");
    expect(formatClock(600)).toBe("10:00");
    expect(formatClock(-3)).toBe("00:00");
  });
});

describe("timerAnnouncement", () => {
  it("is silent most of the time", () => {
    expect(timerAnnouncement(180, 180)).toBeNull();
    expect(timerAnnouncement(61, 180)).toBeNull();
  });

  it("announces the 1-minute and 15-second milestones", () => {
    expect(timerAnnouncement(60, 180)).toBe("Sisa 1 menit.");
    expect(timerAnnouncement(16, 180)).toBe("Sisa 1 menit.");
    expect(timerAnnouncement(15, 180)).toBe("Sisa 15 detik.");
    expect(timerAnnouncement(1, 180)).toBe("Sisa 15 detik.");
  });

  it("skips the 1-minute milestone for short recordings and goes silent at zero", () => {
    expect(timerAnnouncement(50, 60)).toBeNull();
    expect(timerAnnouncement(10, 60)).toBe("Sisa 15 detik.");
    expect(timerAnnouncement(0, 180)).toBeNull();
  });
});
