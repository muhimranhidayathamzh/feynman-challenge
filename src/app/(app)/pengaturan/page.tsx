import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KeyRound, Mail, UserRound } from "lucide-react";

import { PasswordSection } from "@/components/settings/password-section";
import { ProfileForm } from "@/components/settings/profile-form";
import { Card, CardTitle } from "@/components/ui/card";
import { DEFAULT_TIMEZONE } from "@/lib/utils/date";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pengaturan" };

function supportedTimezones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [DEFAULT_TIMEZONE, "Asia/Makassar", "Asia/Jayapura", "UTC"];
  }
}

export default async function SettingsPage() {
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

  // Users who signed in with Google have no password to change here.
  const hasPassword = (user.app_metadata.providers as string[] | undefined)?.includes(
    "email",
  );

  return (
    <section className="page page-narrow">
      <h1>Pengaturan</h1>

      <Card className="stack gap-4">
        <CardTitle icon={UserRound}>Profil</CardTitle>
        <ProfileForm
          initialDisplayName={profile?.display_name ?? ""}
          initialTimezone={profile?.timezone ?? DEFAULT_TIMEZONE}
          timezones={supportedTimezones()}
        />
      </Card>

      <Card className="stack gap-3">
        <CardTitle icon={Mail}>Akun</CardTitle>
        <p className="text-secondary text-sm">
          Masuk sebagai <strong>{user.email}</strong>
        </p>
      </Card>

      {hasPassword !== false && (
        <Card className="stack gap-4" id="kata-sandi">
          <CardTitle icon={KeyRound}>Kata sandi</CardTitle>
          <PasswordSection />
        </Card>
      )}
    </section>
  );
}
