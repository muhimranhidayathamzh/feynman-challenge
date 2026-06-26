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
import {
  autoExtendedDate,
  daysUntil,
  getDeadlineInfo,
  needsAutoExtend,
} from "@/lib/utils/deadline";
import { applyMasteryDecay } from "@/lib/utils/mastery";
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

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: challenges }, { data: attempts }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, streak_count, best_streak")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("challenges")
        .select(
          "id, title, deadline, extended_deadline, mastery_state, latest_score, status",
        )
        .order("updated_at", { ascending: false }),
      supabase
        .from("attempts")
        .select("challenge_id, created_at")
        .order("created_at", { ascending: false }),
    ]);

  const rows = challenges ?? [];
  const now = new Date();

  // Last review (most recent attempt) per challenge.
  const lastReview = new Map<string, string>();
  for (const attempt of attempts ?? []) {
    if (!lastReview.has(attempt.challenge_id)) {
      lastReview.set(attempt.challenge_id, attempt.created_at);
    }
  }

  // Auto-extend overdue active deadlines (+2 days), persisted + reflected locally.
  const toExtend = rows.filter(
    (c) => c.status === "active" && needsAutoExtend(c.deadline, c.extended_deadline),
  );
  if (toExtend.length > 0) {
    await Promise.all(
      toExtend.map((c) => {
        const ext = c.deadline ? autoExtendedDate(c.deadline) : null;
        if (!ext) return Promise.resolve();
        c.extended_deadline = ext;
        return supabase
          .from("challenges")
          .update({ extended_deadline: ext })
          .eq("id", c.id);
      }),
    );
  }

  const allCards: ChallengeCardData[] = rows.map((c) => ({
    id: c.id,
    title: c.title,
    masteryState: c.mastery_state,
    latestScore: c.latest_score,
    deadline: c.deadline,
    extendedDeadline: c.extended_deadline,
  }));

  const dueSoon: DueSoonItem[] = rows
    .flatMap<DueSoonInternal>((c) => {
      if (c.status !== "active") return [];
      const info = getDeadlineInfo(c.deadline, c.extended_deadline, now);
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
    if (c.mastery_state !== "mastered") return [];
    const last = lastReview.get(c.id);
    if (!last) return [];
    if (applyMasteryDecay("mastered", last, now) !== "developing") return [];
    return [{ id: c.id, title: c.title, daysSinceReview: -daysUntil(last, now) }];
  });

  const displayName =
    profile?.display_name?.trim() || user.email?.split("@")[0] || "Kamu";

  return (
    <div className="stack" style={{ gap: "var(--space-8)" }}>
      <header className="row-between" style={{ flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div className="stack" style={{ gap: "var(--space-1)" }}>
          <h1>
            Halo, <span className="gradient-text">{displayName}</span> 👋
          </h1>
          <p className="text-secondary">Siap menjelaskan sesuatu hari ini?</p>
        </div>
        <StreakDisplay
          streakCount={profile?.streak_count ?? 0}
          bestStreak={profile?.best_streak ?? 0}
        />
      </header>

      {rows.length === 0 ? (
        <div
          className="glass stack text-center animate-fade-in-up"
          style={{ gap: "var(--space-4)", maxWidth: "32rem", marginInline: "auto", alignItems: "center" }}
        >
          <span style={{ fontSize: "3rem" }} aria-hidden="true">
            🧠
          </span>
          <h2>Belum ada tantangan</h2>
          <p className="text-secondary">
            Buat tantangan pertamamu — pilih topik, biarkan AI menyusun outline,
            lalu jelaskan ulang lewat audio.
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
