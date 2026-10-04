import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SettingsView } from "@/components/settings/settings-view";
import { remindersAvailable } from "@/lib/env";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import { DEFAULT_TIMEZONE } from "@/lib/utils/date";
import { createClient } from "@/lib/supabase/server";
import { usesPassword } from "@/lib/utils/account-cleanup";

export const metadata: Metadata = { title: "Pengaturan" };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function supportedTimezones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [DEFAULT_TIMEZONE, "Asia/Makassar", "Asia/Jayapura", "UTC"];
  }
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const { akun } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fpengaturan");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, timezone, review_reminders")
    .eq("id", user.id)
    .maybeSingle();

  // Users who signed in with Google have no password to change here, and a
  // demo account can only set one after linking an email.
  const isDemo = user.is_anonymous ?? false;
  const hasPassword = usesPassword(user);
  const justConverted = !isDemo && akun === "tersimpan";

  return (
    <SettingsView
      displayName={profile?.display_name ?? ""}
      timezone={profile?.timezone ?? DEFAULT_TIMEZONE}
      timezones={supportedTimezones()}
      email={user.email ?? null}
      isDemo={isDemo}
      pendingEmail={user.new_email ?? null}
      hasPassword={hasPassword}
      justConverted={justConverted}
      reminders={
        // Only accounts with an email can be reminded, and only where sending works.
        !isDemo && user.email && remindersAvailable()
          ? { on: profile?.review_reminders ?? true }
          : null
      }
      theme={parseTheme((await cookies()).get(THEME_COOKIE)?.value)}
    />
  );
}
