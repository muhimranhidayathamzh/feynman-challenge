import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SettingsView } from "@/components/settings/settings-view";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import { DEFAULT_TIMEZONE } from "@/lib/utils/date";
import { createClient } from "@/lib/supabase/server";

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
    .select("display_name, timezone")
    .eq("id", user.id)
    .maybeSingle();

  // Users who signed in with Google have no password to change here, and a
  // demo account can only set one after linking an email.
  const isDemo = user.is_anonymous ?? false;
  const hasPassword =
    !isDemo &&
    (user.app_metadata.providers as string[] | undefined)?.includes("email") !== false;
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
      theme={parseTheme((await cookies()).get(THEME_COOKIE)?.value)}
    />
  );
}
