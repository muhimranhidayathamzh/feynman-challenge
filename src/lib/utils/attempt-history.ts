/**
 * Attempt history (Prompt 4.1): every attempt of a challenge, newest first,
 * each one openable, whatever state its evaluation is in.
 */

import type { AudioIssue, EvaluationStatus, HintLevel } from "@/types";

import { addDays, calendarDay, formatDay, type CalendarDay } from "./date";
import { HINT_TIERS } from "./labels";

/** How many attempts the notebook shows before "Tampilkan semua". */
export const HISTORY_PREVIEW = 10;

export interface AttemptSummaryRow {
  id: string;
  attempt_number: number;
  created_at: string;
  evaluation_status: EvaluationStatus;
  overall_score: number | null;
  max_possible_score: number | null;
  hint_level_used: HintLevel;
  audio_issue: AudioIssue | null;
}

/**
 * scored: has a score. unscorable: evaluated, but the audio could not be
 * judged. processing: not finished yet (pending or processing). failed: the
 * evaluation errored and can be retried from its result page.
 */
export type AttemptOutcome = "scored" | "unscorable" | "processing" | "failed";

export function attemptOutcome(
  row: Pick<AttemptSummaryRow, "evaluation_status" | "overall_score">,
): AttemptOutcome {
  switch (row.evaluation_status) {
    case "completed":
      return row.overall_score !== null ? "scored" : "unscorable";
    case "error":
      return "failed";
    default:
      return "processing";
  }
}

const OUTCOME_LABEL: Record<Exclude<AttemptOutcome, "scored">, string> = {
  unscorable: "Tidak bisa dinilai",
  processing: "Sedang dinilai",
  failed: "Penilaian gagal",
};

/** "Hari ini", "Kemarin", "21 Sep", or "21 Sep 2025" for another year. */
export function attemptDayLabel(
  createdAt: string,
  timeZone: string,
  today: CalendarDay,
): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  const day = calendarDay(date, timeZone);
  if (day === today) return "Hari ini";
  if (day === addDays(today, -1)) return "Kemarin";
  return formatDay(day, day.slice(0, 4) !== today.slice(0, 4));
}

/** null when no hint was opened, otherwise e.g. "Kata kunci". */
export function hintLabel(level: HintLevel): string | null {
  return HINT_TIERS.find((tier) => tier.level === level)?.label ?? null;
}

export interface HistoryEntry {
  id: string;
  number: number;
  href: string;
  dayLabel: string;
  outcome: AttemptOutcome;
  /** Only for "scored". */
  score: number | null;
  maxScore: number;
  /** "Sedang dinilai" and so on; null for a scored attempt. */
  statusLabel: string | null;
  hint: string | null;
}

/** Every attempt as the notebook lists it, newest first. */
export function buildHistory(
  rows: readonly AttemptSummaryRow[],
  context: { challengeId: string; timeZone: string; today: CalendarDay },
): HistoryEntry[] {
  return [...rows]
    .sort((a, b) => b.attempt_number - a.attempt_number)
    .map((row) => {
      const outcome = attemptOutcome(row);
      return {
        id: row.id,
        number: row.attempt_number,
        href: `/challenge/${context.challengeId}/result/${row.id}`,
        dayLabel: attemptDayLabel(row.created_at, context.timeZone, context.today),
        outcome,
        score: outcome === "scored" ? row.overall_score : null,
        maxScore: row.max_possible_score ?? 10,
        statusLabel: outcome === "scored" ? null : OUTCOME_LABEL[outcome],
        hint: hintLabel(row.hint_level_used),
      };
    });
}

export interface AttemptLink {
  id: string;
  number: number;
}

/**
 * The attempts on either side of `currentNumber`, by attempt number and
 * regardless of their state: a failed or unfinished attempt is still a
 * place the learner may want to go back to.
 */
export function attemptNeighbours(
  attempts: readonly { id: string; attempt_number: number }[],
  currentNumber: number,
): { previous: AttemptLink | null; next: AttemptLink | null } {
  let previous: AttemptLink | null = null;
  let next: AttemptLink | null = null;
  for (const attempt of attempts) {
    const n = attempt.attempt_number;
    if (n < currentNumber && (!previous || n > previous.number)) {
      previous = { id: attempt.id, number: n };
    }
    if (n > currentNumber && (!next || n < next.number)) {
      next = { id: attempt.id, number: n };
    }
  }
  return { previous, next };
}
