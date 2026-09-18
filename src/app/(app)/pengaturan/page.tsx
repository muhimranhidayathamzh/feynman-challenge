import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KeyRound, Mail, Save, UserRound } from "lucide-react";

import { ConvertAccount } from "@/components/settings/convert-account";
import { PasswordSection } from "@/components/settings/password-section";
import { ProfileForm } from "@/components/settings/profile-form";
import { Card, CardTitle } from "@/components/ui/card";
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
    <section className="page page-narrow">
      <h1>Pengaturan</h1>

      {justConverted && (
        <div className="alert alert-success" role="status">
          Email terverifikasi, akunmu sudah permanen. Buat kata sandi di bawah supaya bisa
          masuk lagi dari perangkat lain.
        </div>
      )}

      <Card className="stack gap-4">
        <CardTitle icon={UserRound}>Profil</CardTitle>
        <ProfileForm
          initialDisplayName={profile?.display_name ?? ""}
          initialTimezone={profile?.timezone ?? DEFAULT_TIMEZONE}
          timezones={supportedTimezones()}
        />
      </Card>

      {isDemo ? (
        <Card className="stack gap-4" id="simpan-akun">
          <CardTitle icon={Save}>Simpan progres jadi akun</CardTitle>
          <p className="text-secondary text-sm">
            Kamu sedang memakai mode demo tanpa email. Hubungkan email agar tantangan dan
            hasilmu tidak hilang saat keluar.
          </p>
          <ConvertAccount pendingEmail={user.new_email ?? null} />
        </Card>
      ) : (
        <Card className="stack gap-3">
          <CardTitle icon={Mail}>Akun</CardTitle>
          <p className="text-secondary text-sm">
            Masuk sebagai <strong>{user.email}</strong>
          </p>
        </Card>
      )}

      {hasPassword && (
        <Card className="stack gap-4" id="kata-sandi">
          <CardTitle icon={KeyRound}>Kata sandi</CardTitle>
          <PasswordSection firstTime={justConverted} />
        </Card>
      )}
    </section>
  );
}
