// ============================================================================
// Challenge lifecycle — pure helpers for status labels, dashboard tabs, and
// which actions make sense in each status (spec §6.5 "gentle accountability").
// ============================================================================
import type { ChallengeStatus } from "@/types";

export const STATUS_LABEL: Record<ChallengeStatus, string> = {
  active: "Aktif",
  parked: "Istirahat",
  completed: "Selesai",
};

export interface DashboardTab {
  status: ChallengeStatus;
  /** URL value for ?tab= (Indonesian, human readable). */
  slug: string;
  label: string;
}

export const DASHBOARD_TABS: readonly DashboardTab[] = [
  { status: "active", slug: "aktif", label: STATUS_LABEL.active },
  { status: "parked", slug: "istirahat", label: STATUS_LABEL.parked },
  { status: "completed", slug: "selesai", label: STATUS_LABEL.completed },
];

/** ?tab= value -> status; anything unknown falls back to "active". */
export function tabFromSlug(slug: string | string[] | undefined): DashboardTab {
  const value = Array.isArray(slug) ? slug[0] : slug;
  return DASHBOARD_TABS.find((tab) => tab.slug === value) ?? DASHBOARD_TABS[0]!;
}

export function countByStatus(
  rows: readonly { status: ChallengeStatus }[],
): Record<ChallengeStatus, number> {
  const counts: Record<ChallengeStatus, number> = { active: 0, parked: 0, completed: 0 };
  for (const row of rows) counts[row.status] += 1;
  return counts;
}

export interface StatusAction {
  nextStatus: ChallengeStatus;
  label: string;
  /** Short confirmation shown in a toast afterwards. */
  done: string;
}

/** Status transitions offered from the notebook header for a given status. */
export function statusActions(status: ChallengeStatus): StatusAction[] {
  switch (status) {
    case "active":
      return [
        {
          nextStatus: "parked",
          label: "Istirahatkan",
          done: "Tantangan diistirahatkan.",
        },
        {
          nextStatus: "completed",
          label: "Tandai selesai",
          done: "Tantangan ditandai selesai.",
        },
      ];
    case "parked":
      return [
        { nextStatus: "active", label: "Aktifkan lagi", done: "Tantangan aktif lagi." },
        {
          nextStatus: "completed",
          label: "Tandai selesai",
          done: "Tantangan ditandai selesai.",
        },
      ];
    case "completed":
      return [
        { nextStatus: "active", label: "Aktifkan lagi", done: "Tantangan aktif lagi." },
      ];
  }
}
