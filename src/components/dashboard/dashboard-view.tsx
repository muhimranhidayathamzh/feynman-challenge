import Link from "next/link";
import { Plus } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { DASHBOARD_TABS, type DashboardTab } from "@/lib/utils/challenge-status";
import type { DashboardData } from "@/lib/utils/dashboard";
import type { WeekDay } from "@/lib/utils/streak";

import { ChallengeIndex } from "./challenge-index";
import { Onboarding } from "./onboarding";
import { TodayCard } from "./today-card";

interface Props {
  displayName: string;
  streak: number;
  week: WeekDay[];
  /** Today in the user's timezone, e.g. "21 Sep". */
  dateLabel: string;
  activeTab: DashboardTab;
  data: DashboardData;
}

/**
 * "Meja Belajar" (DESIGN.md §11): one action for today, then the index of
 * every challenge. Data comes from buildDashboard (page or dev gallery).
 */
export function DashboardView({
  displayName,
  streak,
  week,
  dateLabel,
  activeTab,
  data,
}: Props) {
  if (data.isEmpty) {
    return (
      <div className="page">
        <Onboarding displayName={displayName} />
      </div>
    );
  }

  const overdue =
    data.today.kind === "overdue"
      ? (data.dueSoon.find((item) => item.id === data.today.challengeId)?.deadline ??
        null)
      : null;

  return (
    <div className="page page-wide">
      <h1 className="dashboard-greeting">Halo, {displayName}</h1>

      <TodayCard
        action={data.today}
        overdueDeadline={overdue}
        dateLabel={dateLabel}
        week={week}
        streak={streak}
        alsoWaiting={data.alsoWaiting}
      />

      <section className="stack gap-3" aria-labelledby="all-challenges-title">
        <div className="row-between flex-wrap gap-3">
          <h2 id="all-challenges-title" className="section-title">
            Tantanganmu
          </h2>
          <ButtonLink href="/challenge/new" variant="secondary" size="sm" icon={Plus}>
            Tantangan baru
          </ButtonLink>
        </div>

        <nav className="tabs" aria-label="Filter tantangan">
          {DASHBOARD_TABS.map((tab) => {
            const current = tab.status === activeTab.status;
            return (
              <Link
                key={tab.slug}
                href={tab.slug === "aktif" ? "/" : `/?tab=${tab.slug}`}
                className="tab"
                aria-current={current ? "page" : undefined}
                scroll={false}
              >
                {tab.label}
                <span className="tab-count">{data.counts[tab.status]}</span>
              </Link>
            );
          })}
        </nav>

        {data.tabCards.length > 0 ? (
          <ChallengeIndex challenges={data.tabCards} />
        ) : (
          <p className="text-muted text-sm">
            Belum ada tantangan berstatus {activeTab.label.toLowerCase()}.
          </p>
        )}
      </section>
    </div>
  );
}
