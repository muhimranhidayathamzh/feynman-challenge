import { redirect } from "next/navigation";

import { DashboardView } from "@/components/dashboard/dashboard-view";
import { tabFromSlug } from "@/lib/utils/challenge-status";
import { buildDashboard } from "@/lib/utils/dashboard";
import { displayStreak } from "@/lib/utils/streak";
import { getUserClock } from "@/lib/utils/user-day";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Read-only: every derived value (auto-extended deadlines, due reviews,
 * slipped mastery, live streak) is computed from stored data + the user's
 * current day (see buildDashboard). Nothing is written during render. Tabs are
 * plain links (?tab=), so the filter works without client JavaScript.
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

  return (
    <DashboardView
      displayName={displayName}
      streak={displayStreak(
        profile?.streak_count ?? 0,
        profile?.last_active_date ?? null,
        clock.today,
      )}
      bestStreak={profile?.best_streak ?? 0}
      activeTab={activeTab}
      data={buildDashboard(challenges ?? [], clock.today, activeTab.status)}
    />
  );
}
