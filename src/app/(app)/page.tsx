import { DashboardView } from "@/components/dashboard/dashboard-view";
import { Landing } from "@/components/marketing/landing";
import { getAuthFeatures } from "@/lib/auth/features";
import { tabFromSlug } from "@/lib/utils/challenge-status";
import { buildDashboard } from "@/lib/utils/dashboard";
import { formatDay } from "@/lib/utils/date";
import { displayStreak, weekStrip } from "@/lib/utils/streak";
import { getUserClock } from "@/lib/utils/user-day";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Signed out: the public landing page (decision DV6). Signed in: "Meja
 * Belajar", read-only — every derived value (auto-extended deadlines, due
 * reviews, slipped mastery, live streak, today's action) is computed from
 * stored data and the user's current day. Tabs are plain links (?tab=), so
 * the filter works without client JavaScript.
 */
export default async function HomePage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <Landing features={await getAuthFeatures()} />;
  }

  const [{ data: profile }, { data: challenges }, clock, params] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, streak_count, best_streak, last_active_date")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("challenges")
      .select(
        "id, title, deadline, mastery_state, latest_score, status, review_box, next_review_at",
      )
      .order("updated_at", { ascending: false }),
    getUserClock(supabase, user.id),
    searchParams,
  ]);

  const activeTab = tabFromSlug(params.tab);
  const displayName =
    profile?.display_name?.trim() || user.email?.split("@")[0] || "Kamu";
  const lastActive = profile?.last_active_date ?? null;
  const storedStreak = profile?.streak_count ?? 0;

  return (
    <DashboardView
      displayName={displayName}
      streak={displayStreak(storedStreak, lastActive, clock.today)}
      week={weekStrip(clock.today, lastActive, storedStreak)}
      dateLabel={formatDay(clock.today)}
      activeTab={activeTab}
      data={buildDashboard(challenges ?? [], clock.today, activeTab.status)}
    />
  );
}
