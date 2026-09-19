import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
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
    <AppShell
      displayName={displayName}
      streakCount={streakCount}
      isAnonymous={user?.is_anonymous ?? false}
    >
      {children}
    </AppShell>
  );
}
