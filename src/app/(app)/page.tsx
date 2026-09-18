import Link from "next/link";
import { redirect } from "next/navigation";

import { ChallengeList } from "@/components/dashboard/challenge-list";
import type { ChallengeCardData } from "@/components/dashboard/challenge-card";
import { DecayAlert, type DecayItem } from "@/components/dashboard/decay-alert";
import {
  DueSoonSection,
  type DueSoonItem,
} from "@/components/dashboard/due-soon-section";
import { StreakDisplay } from "@/components/dashboard/streak-display";
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

interface DueSoonInternal extends DueSoonItem {
  effectiveDate: string;
}

/**
 * Read-only: every derived value (auto-extended deadlines, mastery decay,
 * live streak) is computed here from stored data + the user's current day.
 * Nothing is written during render.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: challenges }, clock] = await Promise.all([
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
  ]);

  const rows = challenges ?? [];
  const { now, today, timeZone } = clock;

  const allCards: ChallengeCardData[] = rows.map((c) => ({
    id: c.id,
    title: c.title,
    masteryState: effectiveMasteryState(c.mastery_state, c.last_attempt_at, now),
    latestScore: c.latest_score,
    deadline: getDeadlineInfo(c.deadline, today),
  }));

  const dueSoon: DueSoonItem[] = rows
    .flatMap<DueSoonInternal>((c) => {
      if (c.status !== "active") return [];
      const info = getDeadlineInfo(c.deadline, today);
      if (!DUE_SOON_STATUSES.has(info.status)) return [];
      return [
        {
          id: c.id,
          title: c.title,
          status: info.status,
          nudge: info.nudge,
          effectiveDate: info.effectiveDate ?? "",
        },
      ];
    })
    .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate))
    .map(({ id, title, status, nudge }) => ({ id, title, status, nudge }));

  const decay: DecayItem[] = rows.flatMap<DecayItem>((c) => {
    if (c.mastery_state !== "mastered" || !c.last_attempt_at) return [];
    if (effectiveMasteryState("mastered", c.last_attempt_at, now) === "mastered")
      return [];
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
    <div className="stack" style={{ gap: "var(--space-8)" }}>
      <header className="row-between" style={{ flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div className="stack" style={{ gap: "var(--space-1)" }}>
          <h1>
            Halo, <span className="gradient-text">{displayName}</span> 👋
          </h1>
          <p className="text-secondary">Siap menjelaskan sesuatu hari ini?</p>
        </div>
        <StreakDisplay streakCount={streak} bestStreak={profile?.best_streak ?? 0} />
      </header>

      {rows.length === 0 ? (
        <div
          className="glass stack text-center animate-fade-in-up"
          style={{
            gap: "var(--space-4)",
            maxWidth: "32rem",
            marginInline: "auto",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "3rem" }} aria-hidden="true">
            🧠
          </span>
          <h2>Belum ada tantangan</h2>
          <p className="text-secondary">
            Buat tantangan pertamamu — pilih topik, biarkan AI menyusun outline, lalu
            jelaskan ulang lewat audio.
          </p>
          <Link href="/challenge/new" className="btn btn-primary btn-lg">
            ➕ Buat Tantangan Pertama
          </Link>
        </div>
      ) : (
        <>
          <DueSoonSection items={dueSoon} />
          <DecayAlert items={decay} />

          <section className="stack" style={{ gap: "var(--space-3)" }}>
            <div className="row-between">
              <h2 style={{ fontSize: "var(--text-xl)" }}>📊 Semua Challenge</h2>
              <Link href="/challenge/new" className="btn btn-secondary btn-sm">
                ➕ Baru
              </Link>
            </div>
            <ChallengeList challenges={allCards} />
          </section>
        </>
      )}
    </div>
  );
}
