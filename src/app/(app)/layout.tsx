import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";

/**
 * Server layout: reads the profile once so the header shows the real name.
 * The streak lives on Meja Belajar's week strip, not in the header (V.7).
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = "Kamu";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    displayName = profile?.display_name?.trim() || user.email?.split("@")[0] || "Kamu";
  }

  // Signed out (only possible on the public landing page): no app chrome.
  if (!user) return <>{children}</>;

  return (
    <AppShell displayName={displayName} isAnonymous={user?.is_anonymous ?? false}>
      {children}
    </AppShell>
  );
}
