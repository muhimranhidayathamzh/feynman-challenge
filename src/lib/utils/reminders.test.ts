import { describe, expect, it } from "vitest";

import {
  buildReminderEmail,
  inSendWindow,
  localHour,
  planReminders,
  reminderSubject,
  type ReminderCandidate,
} from "./reminders";

// 00:30 UTC: 07:30 in Jakarta, 08:30 in Makassar, 09:30 in Jayapura.
const NOW = new Date("2026-10-05T00:30:00Z");

const candidate = (overrides: Partial<ReminderCandidate> = {}): ReminderCandidate => ({
  userId: "u1",
  email: "rani@contoh.id",
  isAnonymous: false,
  timeZone: "Asia/Jakarta",
  remindersOn: true,
  lastRemindedOn: null,
  challenges: [{ title: "Bunga majemuk", status: "active", nextReviewAt: "2026-10-05" }],
  ...overrides,
});

describe("localHour and inSendWindow", () => {
  it("reads the hour in the learner's own timezone", () => {
    expect(localHour(NOW, "Asia/Jakarta")).toBe(7);
    expect(localHour(NOW, "Asia/Makassar")).toBe(8);
    expect(localHour(NOW, "Asia/Jayapura")).toBe(9);
    expect(localHour(NOW, "UTC")).toBe(0);
  });

  it("sends between 07:00 and 21:00 local time only", () => {
    expect(inSendWindow(NOW, "Asia/Jakarta")).toBe(true);
    expect(inSendWindow(NOW, "UTC")).toBe(false);
    expect(inSendWindow(new Date("2026-10-05T14:00:00Z"), "Asia/Jakarta")).toBe(false);
    expect(inSendWindow(new Date("2026-10-05T13:59:00Z"), "Asia/Jakarta")).toBe(true);
  });

  it("falls back to UTC for an unknown timezone", () => {
    expect(localHour(NOW, "Mars/Olympus")).toBe(0);
  });
});

describe("planReminders", () => {
  it("emails a learner whose review falls due today", () => {
    expect(planReminders([candidate()], NOW)).toEqual([
      {
        userId: "u1",
        email: "rani@contoh.id",
        day: "2026-10-05",
        dueToday: ["Bunga majemuk"],
        waiting: [],
      },
    ]);
  });

  it("uses the learner's own calendar day across timezones", () => {
    // 11:00 UTC on the 4th: 18:00 in Jakarta and 20:00 in Jayapura, both
    // still the 4th locally, so only reviews due on the 4th count.
    const evening = new Date("2026-10-04T11:00:00Z");
    const jayapura = candidate({
      timeZone: "Asia/Jayapura",
      challenges: [{ title: "A", status: "active", nextReviewAt: "2026-10-04" }],
    });
    expect(planReminders([jayapura], evening)[0]?.day).toBe("2026-10-04");
    const tomorrow = candidate({
      challenges: [{ title: "A", status: "active", nextReviewAt: "2026-10-05" }],
    });
    expect(planReminders([tomorrow], evening)).toEqual([]);
  });

  it("follows the local date when it is ahead of UTC", () => {
    // 23:30 UTC on the 4th is 08:30 on the 5th in Jayapura.
    const lateUtc = new Date("2026-10-04T23:30:00Z");
    const plan = planReminders([candidate({ timeZone: "Asia/Jayapura" })], lateUtc);
    expect(plan[0]?.day).toBe("2026-10-05");
    // Same instant in Jakarta is 06:30: before the window opens.
    expect(planReminders([candidate()], lateUtc)).toEqual([]);
  });

  it("never emails demo accounts, missing addresses, or people who opted out", () => {
    expect(
      planReminders(
        [
          candidate({ isAnonymous: true }),
          candidate({ email: null }),
          candidate({ remindersOn: false }),
        ],
        NOW,
      ),
    ).toEqual([]);
  });

  it("sends at most once a day", () => {
    expect(planReminders([candidate({ lastRemindedOn: "2026-10-05" })], NOW)).toEqual([]);
    expect(
      planReminders([candidate({ lastRemindedOn: "2026-10-04" })], NOW),
    ).toHaveLength(1);
  });

  it("stays quiet outside the local sending window", () => {
    expect(planReminders([candidate({ timeZone: "Europe/London" })], NOW)).toEqual([]);
  });

  it("needs a review newly due today; old ones alone do not nag", () => {
    const onlyOld = candidate({
      challenges: [{ title: "Lama", status: "active", nextReviewAt: "2026-10-01" }],
    });
    expect(planReminders([onlyOld], NOW)).toEqual([]);
  });

  it("lists waiting reviews too, and skips parked and unscheduled challenges", () => {
    const plan = planReminders(
      [
        candidate({
          challenges: [
            { title: "Hari ini", status: "active", nextReviewAt: "2026-10-05" },
            { title: "Selesai", status: "completed", nextReviewAt: "2026-10-05" },
            { title: "Kemarin", status: "active", nextReviewAt: "2026-10-04" },
            { title: "Istirahat", status: "parked", nextReviewAt: "2026-10-05" },
            { title: "Belum", status: "active", nextReviewAt: null },
            { title: "Besok", status: "active", nextReviewAt: "2026-10-06" },
          ],
        }),
      ],
      NOW,
    )[0];
    expect(plan?.dueToday).toEqual(["Hari ini", "Selesai"]);
    expect(plan?.waiting).toEqual(["Kemarin"]);
  });
});

describe("the email", () => {
  const plan = {
    userId: "u1",
    email: "rani@contoh.id",
    day: "2026-10-05",
    dueToday: ["Bunga majemuk"],
    waiting: [] as string[],
  };
  const links = {
    app: "https://feynman.example/",
    unsubscribe: "https://feynman.example/berhenti?u=u1&t=abc",
  };

  it("names a single topic, or counts several", () => {
    expect(reminderSubject(plan)).toBe("Waktunya mengulang: Bunga majemuk");
    expect(reminderSubject({ ...plan, waiting: ["Cara kerja vaksin"] })).toBe(
      "2 topik siap diulang hari ini",
    );
  });

  it("carries the app link and a working unsubscribe link in both versions", () => {
    const email = buildReminderEmail(plan, links);
    expect(email.text).toContain(links.app);
    expect(email.text).toContain(links.unsubscribe);
    expect(email.html).toContain("https://feynman.example/berhenti?u=u1&amp;t=abc");
  });

  it("escapes titles, which the learner wrote", () => {
    const email = buildReminderEmail(
      { ...plan, dueToday: ['<script>alert("x")</script>'] },
      links,
    );
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});
