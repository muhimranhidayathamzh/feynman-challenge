// ============================================================================
// Review reminder emails (Prompt 5.4): reads who is due with a service-role
// client, decides with utils/reminders.ts, sends through Resend, and records
// the day so nobody gets two in one day.
// ============================================================================
import type { AdminClient } from "@/lib/maintenance/cleanup";
import { addDays, calendarDay } from "@/lib/utils/date";
import {
  buildReminderEmail,
  planReminders,
  type ReminderCandidate,
  type ReminderChallenge,
  type ReminderEmail,
} from "@/lib/utils/reminders";
import { logError } from "@/lib/monitoring/report";
import { oneClickUnsubscribeUrl, unsubscribeUrl } from "@/lib/utils/unsubscribe-token";

const PAGE = 1000;
/** Resend's default limit is 2 requests a second. */
const SEND_SPACING_MS = 600;

export interface OutgoingEmail extends ReminderEmail {
  to: string;
  /** Opt-out endpoint for the List-Unsubscribe header. */
  oneClickUnsubscribe: string;
}

export type SendEmail = (email: OutgoingEmail) => Promise<void>;

/** Sends through Resend's HTTP API, with one-click unsubscribe headers. */
export function resendSender(apiKey: string, from: string): SendEmail {
  return async (email) => {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [email.to],
        subject: email.subject,
        text: email.text,
        html: email.html,
        headers: {
          "List-Unsubscribe": `<${email.oneClickUnsubscribe}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
    });
    if (!response.ok) {
      throw new Error(`Resend answered ${response.status}`);
    }
  };
}

async function loadCandidates(
  admin: AdminClient,
  now: Date,
): Promise<ReminderCandidate[]> {
  const accounts = new Map<string, { email: string | null; isAnonymous: boolean }>();
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE });
    if (error) throw error;
    for (const user of data.users) {
      accounts.set(user.id, {
        email: user.email ?? null,
        isAnonymous: user.is_anonymous ?? false,
      });
    }
    if (data.users.length < PAGE) break;
  }

  const profiles: {
    id: string;
    timezone: string;
    review_reminders: boolean;
    last_reminded_on: string | null;
  }[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("profiles")
      .select("id, timezone, review_reminders, last_reminded_on")
      .eq("review_reminders", true)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    profiles.push(...(data ?? []));
    if ((data ?? []).length < PAGE) break;
  }

  // Every timezone is within a day of UTC, so this bound covers "today"
  // for everyone without reading every challenge ever scheduled.
  const latestDay = addDays(calendarDay(now, "UTC"), 1);
  const challenges = new Map<string, ReminderChallenge[]>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("challenges")
      .select("user_id, title, status, next_review_at")
      .neq("status", "parked")
      .not("next_review_at", "is", null)
      .lte("next_review_at", latestDay)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const row of data ?? []) {
      const list = challenges.get(row.user_id) ?? [];
      list.push({
        title: row.title,
        status: row.status,
        nextReviewAt: row.next_review_at,
      });
      challenges.set(row.user_id, list);
    }
    if ((data ?? []).length < PAGE) break;
  }

  return profiles.flatMap<ReminderCandidate>((profile) => {
    const account = accounts.get(profile.id);
    if (!account) return [];
    return [
      {
        userId: profile.id,
        email: account.email,
        isAnonymous: account.isAnonymous,
        timeZone: profile.timezone,
        remindersOn: profile.review_reminders,
        lastRemindedOn: profile.last_reminded_on,
        challenges: challenges.get(profile.id) ?? [],
      },
    ];
  });
}

export interface ReminderReport {
  applied: boolean;
  planned: number;
  sent: number;
  failed: number;
}

/**
 * Plans today's reminders and, with `apply`, sends them. A failed send is
 * counted and skipped; it is retried on the next run because last_reminded_on
 * is only written after a successful send.
 */
export async function runReminders(
  admin: AdminClient,
  options: {
    apply: boolean;
    now?: Date;
    origin: string;
    secret: string;
    send: SendEmail;
  },
): Promise<ReminderReport> {
  const now = options.now ?? new Date();
  const plans = planReminders(await loadCandidates(admin, now), now);
  const report: ReminderReport = {
    applied: options.apply,
    planned: plans.length,
    sent: 0,
    failed: 0,
  };
  if (!options.apply) return report;

  for (const [index, plan] of plans.entries()) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, SEND_SPACING_MS));
    const unsubscribe = unsubscribeUrl(options.origin, plan.userId, options.secret);
    const email = buildReminderEmail(plan, { app: `${options.origin}/`, unsubscribe });
    try {
      await options.send({
        ...email,
        to: plan.email,
        oneClickUnsubscribe: oneClickUnsubscribeUrl(
          options.origin,
          plan.userId,
          options.secret,
        ),
      });
      const { error } = await admin
        .from("profiles")
        .update({ last_reminded_on: plan.day })
        .eq("id", plan.userId);
      if (error) throw error;
      report.sent += 1;
    } catch (error) {
      // No address in the report: the error says what failed, not for whom.
      logError("[reminders] send failed:", error);
      report.failed += 1;
    }
  }
  return report;
}

/** Switches one person's reminders off (unsubscribe link, no sign-in). */
export async function disableReminders(
  admin: AdminClient,
  userId: string,
): Promise<void> {
  const { error } = await admin
    .from("profiles")
    .update({ review_reminders: false })
    .eq("id", userId);
  if (error) throw error;
}
