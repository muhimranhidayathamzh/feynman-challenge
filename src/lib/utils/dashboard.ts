// ============================================================================
// Dashboard — pure derivation of everything the home screen shows, from the
// stored challenge rows and the user's current calendar day. Nothing here
// writes; the page and the dev gallery both render from its output.
// ============================================================================
import type { ChallengeStatus, MasteryState } from "@/types";

import { countByStatus } from "./challenge-status";
import type { CalendarDay } from "./date";
import { getDeadlineInfo, type DeadlineInfo, type DeadlineStatus } from "./deadline";
import { effectiveMasteryState } from "./mastery";
import { daysOverdue, isLapsed, nextReviewLabel } from "./review";

/** The columns the dashboard reads from `challenges`. */
export interface DashboardRow {
  id: string;
  title: string;
  deadline: string | null;
  mastery_state: MasteryState;
  latest_score: number | null;
  status: ChallengeStatus;
  review_box: number;
  next_review_at: string | null;
}

export interface ChallengeCardData {
  id: string;
  title: string;
  /** Effective (slip-applied) mastery state. */
  masteryState: MasteryState;
  latestScore: number | null;
  deadline: DeadlineInfo;
  /** e.g. "Review besok", or null before the first attempt. */
  review: string | null;
}

export interface DueSoonItem {
  id: string;
  title: string;
  status: DeadlineStatus;
  nudge: string | null;
  /** Stored deadline "YYYY-MM-DD" (for the reschedule dialog). */
  deadline: string | null;
}

export interface ReviewItem {
  id: string;
  title: string;
  /** 0 = due today, >0 = days late. */
  daysOverdue: number;
  /** More than one interval late: mastery is visibly slipping. */
  lapsed: boolean;
}

/** The one thing to do now (DESIGN.md §3: one main thing per screen). */
export type TodayActionKind = "review" | "overdue" | "due" | "continue" | "create";

export interface TodayAction {
  kind: TodayActionKind;
  /** Null for "create": there is no challenge yet. */
  challengeId: string | null;
  headline: string;
  reason: string;
  cta: string;
  href: string;
}

/** A challenge that also wants attention, listed under the "Hari ini" card. */
export interface WaitingItem {
  id: string;
  title: string;
  reason: string;
}

export interface DashboardData {
  isEmpty: boolean;
  today: TodayAction;
  /** Due reviews and deadlines other than the one in the "Hari ini" card. */
  alsoWaiting: WaitingItem[];
  counts: Record<ChallengeStatus, number>;
  /** Challenges in the selected tab. */
  tabCards: ChallengeCardData[];
  dueSoon: DueSoonItem[];
  reviews: ReviewItem[];
}

const MAX_WAITING = 4;

const DUE_SOON_STATUSES: ReadonlySet<DeadlineStatus> = new Set([
  "due_soon",
  "due_today",
  "overdue",
  "extended_overdue",
]);

function reviewOf(row: DashboardRow) {
  return { box: row.review_box, nextReviewAt: row.next_review_at };
}

export function buildDashboard(
  rows: readonly DashboardRow[],
  today: CalendarDay,
  tabStatus: ChallengeStatus,
): DashboardData {
  const tabCards: ChallengeCardData[] = rows
    .filter((row) => row.status === tabStatus)
    .map((row) => ({
      id: row.id,
      title: row.title,
      masteryState: effectiveMasteryState(row.mastery_state, reviewOf(row), today),
      latestScore: row.latest_score,
      deadline: getDeadlineInfo(row.deadline, today),
      review: nextReviewLabel(row.next_review_at, today),
    }));

  // Deadlines only nag about ACTIVE challenges (spec §6.5).
  const dueSoon: DueSoonItem[] = rows
    .filter((row) => row.status === "active")
    .map((row) => ({ row, info: getDeadlineInfo(row.deadline, today) }))
    .filter(({ info }) => DUE_SOON_STATUSES.has(info.status))
    .sort((a, b) =>
      (a.info.effectiveDate ?? "").localeCompare(b.info.effectiveDate ?? ""),
    )
    .map(({ row, info }) => ({
      id: row.id,
      title: row.title,
      status: info.status,
      nudge: info.nudge,
      deadline: row.deadline,
    }));

  // Spaced reviews that are due, most overdue first. Completed challenges are
  // included on purpose: finishing a topic is exactly when retention matters.
  const reviews: ReviewItem[] = rows
    .filter((row) => row.status !== "parked")
    .flatMap<ReviewItem>((row) => {
      const overdue = daysOverdue(row.next_review_at, today);
      if (overdue === null || overdue < 0) return [];
      return [
        {
          id: row.id,
          title: row.title,
          daysOverdue: overdue,
          lapsed: isLapsed(reviewOf(row), today),
        },
      ];
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  const todayAction = pickTodayAction(rows, today, { reviews, dueSoon });

  return {
    isEmpty: rows.length === 0,
    today: todayAction,
    alsoWaiting: waitingAfter(todayAction, reviews, dueSoon),
    counts: countByStatus(rows),
    tabCards,
    dueSoon,
    reviews,
  };
}

function reviewReason(daysLate: number): string {
  if (daysLate === 0) return "Jadwal review tiba hari ini. Jelaskan ulang selagi hangat.";
  if (daysLate === 1)
    return "Review terlambat sehari. Masih bagus untuk dikejar sekarang.";
  return `Review terlambat ${daysLate} hari. Makin cepat dijelaskan ulang, makin nempel.`;
}

/**
 * The single next action, in priority order: a due review, then a passed
 * deadline, then a deadline due today or tomorrow, then the challenge you
 * touched last, and finally "start your first challenge".
 */
export function pickTodayAction(
  rows: readonly DashboardRow[],
  today: CalendarDay,
  derived?: { reviews: ReviewItem[]; dueSoon: DueSoonItem[] },
): TodayAction {
  const reviews = derived?.reviews ?? [];
  const dueSoon = derived?.dueSoon ?? [];

  const review = reviews[0];
  if (review) {
    return {
      kind: "review",
      challengeId: review.id,
      headline: `Review ${review.title}`,
      reason: reviewReason(review.daysOverdue),
      cta: "Jelaskan ulang",
      href: `/challenge/${review.id}/record`,
    };
  }

  const passed = dueSoon.find(
    (item) => item.status === "overdue" || item.status === "extended_overdue",
  );
  if (passed) {
    return {
      kind: "overdue",
      challengeId: passed.id,
      headline: `Tenggat ${passed.title} sudah lewat`,
      reason: "Jelaskan sekarang, atau jadwalkan ulang tanpa merasa bersalah.",
      cta: "Jelaskan sekarang",
      href: `/challenge/${passed.id}/record`,
    };
  }

  const due = dueSoon[0];
  if (due) {
    return {
      kind: "due",
      challengeId: due.id,
      headline: `${due.title} menunggu`,
      reason: due.nudge ?? "Tenggatnya sudah dekat.",
      cta: "Jelaskan sekarang",
      href: `/challenge/${due.id}/record`,
    };
  }

  // Rows arrive newest first (updated_at desc).
  const active = rows.find((row) => row.status === "active");
  if (active) {
    const started = active.mastery_state !== "not_started";
    return {
      kind: "continue",
      challengeId: active.id,
      headline: started ? `Lanjutkan ${active.title}` : `Mulai ${active.title}`,
      reason: started
        ? "Belum ada yang jatuh tempo. Satu penjelasan lagi menaikkan penguasaanmu."
        : "Pelajari dulu poin-poinnya, lalu jelaskan dengan kata-katamu sendiri.",
      cta: started ? "Jelaskan lagi" : "Buka catatan belajar",
      href: started ? `/challenge/${active.id}/record` : `/challenge/${active.id}`,
    };
  }

  return {
    kind: "create",
    challengeId: null,
    headline: "Pilih satu topik untuk dikuasai",
    reason: "AI menyusun outline-nya, kamu belajar, lalu jelaskan ulang dengan suaramu.",
    cta: "Buat tantangan",
    href: "/challenge/new",
  };
}

/** Everything else that is due, minus the challenge already in the card. */
function waitingAfter(
  action: TodayAction,
  reviews: ReviewItem[],
  dueSoon: DueSoonItem[],
): WaitingItem[] {
  const out: WaitingItem[] = [];
  const seen = new Set<string>(action.challengeId ? [action.challengeId] : []);
  for (const review of reviews) {
    if (seen.has(review.id)) continue;
    seen.add(review.id);
    out.push({
      id: review.id,
      title: review.title,
      reason:
        review.daysOverdue === 0
          ? "Review hari ini"
          : `Review terlambat ${review.daysOverdue} hari`,
    });
  }
  for (const item of dueSoon) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push({ id: item.id, title: item.title, reason: item.nudge ?? "Tenggat dekat" });
  }
  return out.slice(0, MAX_WAITING);
}
