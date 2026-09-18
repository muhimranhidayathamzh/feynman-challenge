import Link from "next/link";
import { redirect } from "next/navigation";
import { Brain, ChartColumn, Plus } from "lucide-react";

import { ChallengeList } from "@/components/dashboard/challenge-list";
import type { ChallengeCardData } from "@/components/dashboard/challenge-card";
import { DecayAlert, type DecayItem } from "@/components/dashboard/decay-alert";
import {
  DueSoonSection,
  type DueSoonItem,
} from "@/components/dashboard/due-soon-section";
import { StreakDisplay } from "@/components/dashboard/streak-display";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { DASHBOARD_TABS, countByStatus, tabFromSlug } from "@/lib/utils/challenge-status";
import { calendarDay, dayDiff } from "@/lib/utils/date";
import { getDeadlineInfo } from "@/lib/utils/deadline";
import { effectiveMasteryState } from "@/lib/utils/mastery";
import { displayStreak } from "@/lib/utils/streak";
import { getUserClock } from "@/lib/utils/user-day";
import { createClient } from "@/lib/supabase/server";

const DUE_SOON_STATUSES = new Set([
  "due_soon",
  "due_today",
  "overdue",
  "extended_overdue",
]);

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Read-only: every derived value (auto-extended deadlines, mastery decay,
 * live streak) is computed here from stored data + the user's current day.
 * Nothing is written during render. Tabs are plain links (?tab=), so the
 * filter works without client JavaScript and survives a refresh.
 */
export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: challenges }, clock, params] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, streak_count, best_streak, last_active_date")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("challenges")
      .select("id, title, deadline, mastery_state, latest_score, status, last_attempt_at")
      .order("updated_at", { ascending: false }),
    getUserClock(supabase, user.id),
    searchParams,
  ]);

  const rows = challenges ?? [];
  const { now, today, timeZone } = clock;
  const activeTab = tabFromSlug(params.tab);
  const counts = countByStatus(rows);
  const activeRows = rows.filter((c) => c.status === "active");

  const tabCards: ChallengeCardData[] = rows
    .filter((c) => c.status === activeTab.status)
    .map((c) => ({
      id: c.id,
      title: c.title,
      masteryState: effectiveMasteryState(c.mastery_state, c.last_attempt_at, now),
      latestScore: c.latest_score,
      deadline: getDeadlineInfo(c.deadline, today),
    }));

  // Deadlines and reviews only nag about ACTIVE challenges (spec §6.5).
  const dueSoon: DueSoonItem[] = activeRows
    .map((c) => ({ c, info: getDeadlineInfo(c.deadline, today) }))
    .filter(({ info }) => DUE_SOON_STATUSES.has(info.status))
    .sort((a, b) =>
      (a.info.effectiveDate ?? "").localeCompare(b.info.effectiveDate ?? ""),
    )
    .map(({ c, info }) => ({
      id: c.id,
      title: c.title,
      status: info.status,
      nudge: info.nudge,
      deadline: c.deadline,
    }));

  const decay: DecayItem[] = activeRows.flatMap<DecayItem>((c) => {
    if (c.mastery_state !== "mastered" || !c.last_attempt_at) return [];
    if (effectiveMasteryState("mastered", c.last_attempt_at, now) === "mastered") {
      return [];
    }
    const lastDay = calendarDay(new Date(c.last_attempt_at), timeZone);
    return [{ id: c.id, title: c.title, daysSinceReview: dayDiff(lastDay, today) }];
  });

  const displayName =
    profile?.display_name?.trim() || user.email?.split("@")[0] || "Kamu";
  const streak = displayStreak(
    profile?.streak_count ?? 0,
    profile?.last_active_date ?? null,
    today,
  );

  return (
    <div className="page page-wide">
      <header className="row-between flex-wrap gap-4">
        <div className="stack gap-1">
          <h1>
            Halo, <span className="gradient-text">{displayName}</span>
          </h1>
          <p className="text-secondary">Siap menjelaskan sesuatu hari ini?</p>
        </div>
        <StreakDisplay streakCount={streak} bestStreak={profile?.best_streak ?? 0} />
      </header>

      {rows.length === 0 ? (
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
          <DueSoonSection items={dueSoon} />
          <DecayAlert items={decay} />

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
                    <span className="tab-count">{counts[tab.status]}</span>
                  </Link>
                );
              })}
            </nav>

            {tabCards.length > 0 ? (
              <ChallengeList challenges={tabCards} />
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
