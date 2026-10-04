/**
 * Review reminders (Prompt 5.4): who gets an email today, and what it says.
 * Pure, so the rules can be tested across timezones; the sending lives in
 * src/lib/reminders.
 *
 * Gentle by design: an email goes out only on the day a review newly falls
 * due, lists everything waiting, and never more than once a day. Ignoring
 * one does not bring another tomorrow.
 */
import type { ChallengeStatus } from "@/types";

import { calendarDay, isValidTimeZone, type CalendarDay } from "./date";

/** Local hours in which an email may arrive: [from, to). */
export const SEND_WINDOW = { from: 7, to: 21 } as const;

export function localHour(now: Date, timeZone: string): number {
  const zone = isValidTimeZone(timeZone) ? timeZone : "UTC";
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return Number(hour);
}

export function inSendWindow(now: Date, timeZone: string): boolean {
  const hour = localHour(now, timeZone);
  return hour >= SEND_WINDOW.from && hour < SEND_WINDOW.to;
}

export interface ReminderChallenge {
  title: string;
  status: ChallengeStatus;
  nextReviewAt: CalendarDay | null;
}

export interface ReminderCandidate {
  userId: string;
  email: string | null;
  isAnonymous: boolean;
  timeZone: string;
  remindersOn: boolean;
  lastRemindedOn: CalendarDay | null;
  challenges: readonly ReminderChallenge[];
}

export interface PlannedReminder {
  userId: string;
  email: string;
  /** The learner's calendar day; stored as last_reminded_on once sent. */
  day: CalendarDay;
  /** Reviews falling due today, then the ones already waiting. */
  dueToday: string[];
  waiting: string[];
}

/** Everyone who should get an email at `now`. */
export function planReminders(
  candidates: readonly ReminderCandidate[],
  now: Date,
): PlannedReminder[] {
  return candidates.flatMap<PlannedReminder>((candidate) => {
    // Never a demo account, never without an address, never after opting out.
    if (candidate.isAnonymous || !candidate.email || !candidate.remindersOn) return [];
    if (!inSendWindow(now, candidate.timeZone)) return [];

    const day = calendarDay(now, candidate.timeZone);
    if (candidate.lastRemindedOn === day) return [];

    // Same rule as the dashboard: parked challenges have no reviews.
    const reviewable = candidate.challenges.filter(
      (challenge) => challenge.status !== "parked" && challenge.nextReviewAt !== null,
    );
    const dueToday = reviewable
      .filter((challenge) => challenge.nextReviewAt === day)
      .map((challenge) => challenge.title);
    if (dueToday.length === 0) return [];
    const waiting = reviewable
      .filter(
        (challenge) => challenge.nextReviewAt !== null && challenge.nextReviewAt < day,
      )
      .map((challenge) => challenge.title);

    return [{ userId: candidate.userId, email: candidate.email, day, dueToday, waiting }];
  });
}

// ---------------------------------------------------------------------------
// The email
// ---------------------------------------------------------------------------

export interface ReminderLinks {
  /** The app's home, where "Hari ini" shows what to review. */
  app: string;
  /** Opt-out page, working without signing in. */
  unsubscribe: string;
}

export interface ReminderEmail {
  subject: string;
  text: string;
  html: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function reminderSubject(plan: PlannedReminder): string {
  const total = plan.dueToday.length + plan.waiting.length;
  const first = plan.dueToday[0] ?? "";
  return total === 1
    ? `Waktunya mengulang: ${first}`
    : `${total} topik siap diulang hari ini`;
}

export function buildReminderEmail(
  plan: PlannedReminder,
  links: ReminderLinks,
): ReminderEmail {
  const lead =
    "Sebelum lupa, coba jelaskan lagi dengan kata-katamu sendiri. Cukup beberapa menit.";
  const close =
    "Kamu menerima email ini karena pengingat review menyala di akun Feynman Challenge-mu.";

  const textLines = [
    "Hai,",
    "",
    "Hari ini waktunya mengulang:",
    ...plan.dueToday.map((title) => `- ${title}`),
    ...(plan.waiting.length > 0
      ? ["", "Masih menunggu:", ...plan.waiting.map((title) => `- ${title}`)]
      : []),
    "",
    lead,
    `Buka: ${links.app}`,
    "",
    close,
    `Berhenti menerima pengingat: ${links.unsubscribe}`,
  ];

  const list = (titles: string[]) =>
    `<ul style="margin:0 0 16px;padding-left:20px">${titles
      .map((title) => `<li style="margin:4px 0">${escapeHtml(title)}</li>`)
      .join("")}</ul>`;

  const html = [
    `<div style="font-family:Georgia,serif;color:#1d2623;background:#f4efe4;padding:24px">`,
    `<div style="max-width:520px;margin:0 auto;background:#fffdf8;border:1px solid #e3dccd;border-radius:14px;padding:24px">`,
    `<p style="margin:0 0 12px;font-size:18px">Hari ini waktunya mengulang:</p>`,
    list(plan.dueToday),
    plan.waiting.length > 0
      ? `<p style="margin:0 0 8px;color:#4e5566">Masih menunggu:</p>${list(plan.waiting)}`
      : "",
    `<p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6">${escapeHtml(lead)}</p>`,
    `<a href="${escapeHtml(links.app)}" style="display:inline-block;background:#c8431b;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;padding:12px 20px;border-radius:12px">Jelaskan sekarang</a>`,
    `<p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#6b6f78">${escapeHtml(close)} <a href="${escapeHtml(links.unsubscribe)}" style="color:#6b6f78">Berhenti menerima pengingat</a>.</p>`,
    `</div></div>`,
  ].join("");

  return { subject: reminderSubject(plan), text: textLines.join("\n"), html };
}
