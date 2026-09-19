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
import { daysOverdue, isLapsed } from "./review";

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

export interface DashboardData {
  isEmpty: boolean;
  counts: Record<ChallengeStatus, number>;
  /** Challenges in the selected tab. */
  tabCards: ChallengeCardData[];
  dueSoon: DueSoonItem[];
  reviews: ReviewItem[];
}

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

  return {
    isEmpty: rows.length === 0,
    counts: countByStatus(rows),
    tabCards,
    dueSoon,
    reviews,
  };
}
