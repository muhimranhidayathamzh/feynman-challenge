// ============================================================================
// Deadline system — pure functions. Gentle accountability per master spec §6.5.
// ============================================================================

export const AUTO_EXTEND_DAYS = 2;

export type DeadlineStatus =
  "none" | "upcoming" | "due_soon" | "due_today" | "overdue" | "extended_overdue";

export interface DeadlineInfo {
  status: DeadlineStatus;
  effectiveDate: string | null;
  daysUntil: number | null;
  nudge: string | null;
  isExtended: boolean;
}

/** Calendar-day difference (target − today), independent of time-of-day. */
export function daysUntil(dateIso: string, now: Date = new Date()): number {
  const target = new Date(dateIso);
  const t = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const n = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((t - n) / 86_400_000);
}

/** Deadline status + a supportive nudge message for the dashboard. */
export function getDeadlineInfo(
  deadline: string | null,
  extendedDeadline: string | null,
  now: Date = new Date(),
): DeadlineInfo {
  const effectiveDate = extendedDeadline ?? deadline;
  const isExtended = extendedDeadline !== null;

  if (!effectiveDate) {
    return {
      status: "none",
      effectiveDate: null,
      daysUntil: null,
      nudge: null,
      isExtended,
    };
  }

  const days = daysUntil(effectiveDate, now);

  let status: DeadlineStatus;
  let nudge: string | null;

  if (days < 0) {
    if (isExtended) {
      status = "extended_overdue";
      nudge = "Mau reschedule atau istirahat dulu?";
    } else {
      status = "overdue";
      nudge = "Nggak apa-apa, waktu ditambah!";
    }
  } else if (days === 0) {
    status = "due_today";
    nudge = "Hari ini! Kamu pasti bisa 💪";
  } else if (days === 1) {
    status = "due_soon";
    nudge = "Besok! Sudah siap? 🎙️";
  } else if (days <= 3) {
    status = "due_soon";
    nudge = `${days} hari lagi ⏰`;
  } else {
    status = "upcoming";
    nudge = null;
  }

  return { status, effectiveDate, daysUntil: days, nudge, isExtended };
}

/** True when an active deadline has passed and hasn't been extended yet. */
export function needsAutoExtend(
  deadline: string | null,
  extendedDeadline: string | null,
  now: Date = new Date(),
): boolean {
  if (!deadline || extendedDeadline) return false;
  return daysUntil(deadline, now) < 0;
}

/** Original deadline + AUTO_EXTEND_DAYS, as an ISO string. */
export function autoExtendedDate(deadline: string): string {
  const date = new Date(deadline);
  date.setDate(date.getDate() + AUTO_EXTEND_DAYS);
  return date.toISOString();
}
