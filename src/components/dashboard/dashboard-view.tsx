import Link from "next/link";
import { Brain, ChartColumn, Plus } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { DASHBOARD_TABS, type DashboardTab } from "@/lib/utils/challenge-status";
import type { DashboardData } from "@/lib/utils/dashboard";

import { ChallengeList } from "./challenge-list";
import { DueSoonSection } from "./due-soon-section";
import { ReviewTodaySection } from "./review-today-section";
import { StreakDisplay } from "./streak-display";

interface Props {
  displayName: string;
  streak: number;
  bestStreak: number;
  activeTab: DashboardTab;
  data: DashboardData;
}

/** Home screen markup. Data comes from buildDashboard (page or dev gallery). */
export function DashboardView({
  displayName,
  streak,
  bestStreak,
  activeTab,
  data,
}: Props) {
  return (
    <div className="page page-wide">
      <header className="row-between flex-wrap gap-4">
        <div className="stack gap-1">
          <h1>
            Halo, <span className="gradient-text">{displayName}</span>
          </h1>
          <p className="text-secondary">Siap menjelaskan sesuatu hari ini?</p>
        </div>
        <StreakDisplay streakCount={streak} bestStreak={bestStreak} />
      </header>

      {data.isEmpty ? (
        <Card
          variant="glass"
          className="stack gap-4 text-center items-center max-w-md mx-auto animate-fade-in-up"
        >
          <Icon icon={Brain} size={48} className="state-icon" />
          <h2>Belum ada tantangan</h2>
          <p className="text-secondary">
            Buat tantangan pertamamu — pilih topik, biarkan AI menyusun outline, lalu
            jelaskan ulang lewat audio.
          </p>
          <ButtonLink href="/challenge/new" size="lg" icon={Plus}>
            Buat Tantangan Pertama
          </ButtonLink>
        </Card>
      ) : (
        <>
          <DueSoonSection items={data.dueSoon} />
          <ReviewTodaySection items={data.reviews} />

          <section className="stack gap-3" aria-labelledby="all-challenges-title">
            <div className="row-between flex-wrap gap-3">
              <h2 id="all-challenges-title" className="section-title">
                <Icon icon={ChartColumn} size={20} />
                Tantangan
              </h2>
              <ButtonLink href="/challenge/new" variant="secondary" size="sm" icon={Plus}>
                Baru
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
              <ChallengeList challenges={data.tabCards} />
            ) : (
              <p className="text-muted text-sm">
                Belum ada tantangan berstatus {activeTab.label.toLowerCase()}.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
