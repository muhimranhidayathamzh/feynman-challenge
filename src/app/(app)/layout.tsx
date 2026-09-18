import type { ReactNode } from "react";

import { DemoBanner } from "@/components/layout/demo-banner";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { createClient } from "@/lib/supabase/server";
import { calendarDay } from "@/lib/utils/date";
import { displayStreak } from "@/lib/utils/streak";

/**
 * Server layout: reads the profile once so the header shows the real name
 * and the live streak (0 once broken), computed in the user's timezone.
 * router.refresh() after an evaluation re-renders this too.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = "Kamu";
  let streakCount = 0;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, streak_count, last_active_date, timezone")
      .eq("id", user.id)
      .maybeSingle();
    displayName = profile?.display_name?.trim() || user.email?.split("@")[0] || "Kamu";
    if (profile) {
      const today = calendarDay(new Date(), profile.timezone);
      streakCount = displayStreak(profile.streak_count, profile.last_active_date, today);
    }
  }

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>
      <Header
        displayName={displayName}
        streakCount={streakCount}
        isAnonymous={user?.is_anonymous ?? false}
      />
      <div className="app-body">
        <Sidebar />
        <main id="main-content" className="app-main" tabIndex={-1}>
          {user?.is_anonymous && <DemoBanner />}
          {children}
        </main>
      </div>
    </div>
  );
}
