import { KeyRound, Mail, Palette, Save, UserRound } from "lucide-react";

import { Card, CardTitle } from "@/components/ui/card";
import type { ThemePreference } from "@/lib/theme";

import { ConvertAccount } from "./convert-account";
import { PasswordSection } from "./password-section";
import { ProfileForm } from "./profile-form";
import { ThemeForm } from "./theme-form";

interface Props {
  displayName: string;
  timezone: string;
  timezones: string[];
  email: string | null;
  /** Anonymous demo account: offer to keep it instead of the account card. */
  isDemo: boolean;
  pendingEmail: string | null;
  hasPassword: boolean;
  justConverted: boolean;
  theme: ThemePreference;
}

/** Settings markup. Data is loaded by the page (or the dev gallery). */
export function SettingsView(props: Props) {
  return (
    <section className="page page-narrow">
      <h1>Pengaturan</h1>

      {props.justConverted && (
        <div className="alert alert-success" role="status">
          Email terverifikasi, akunmu sudah permanen. Buat kata sandi di bawah supaya bisa
          masuk lagi dari perangkat lain.
        </div>
      )}

      <Card className="stack gap-4">
        <CardTitle icon={UserRound}>Profil</CardTitle>
        <ProfileForm
          initialDisplayName={props.displayName}
          initialTimezone={props.timezone}
          timezones={props.timezones}
        />
      </Card>

      <Card className="stack gap-4">
        <CardTitle icon={Palette}>Tampilan</CardTitle>
        <ThemeForm initial={props.theme} />
      </Card>

      {props.isDemo ? (
        <Card className="stack gap-4" id="simpan-akun">
          <CardTitle icon={Save}>Simpan progres jadi akun</CardTitle>
          <p className="text-secondary text-sm">
            Kamu sedang memakai mode demo tanpa email. Hubungkan email agar tantangan dan
            hasilmu tidak hilang saat keluar.
          </p>
          <ConvertAccount pendingEmail={props.pendingEmail} />
        </Card>
      ) : (
        <Card className="stack gap-3">
          <CardTitle icon={Mail}>Akun</CardTitle>
          <p className="text-secondary text-sm">
            Masuk sebagai <strong>{props.email}</strong>
          </p>
        </Card>
      )}

      {props.hasPassword && (
        <Card className="stack gap-4" id="kata-sandi">
          <CardTitle icon={KeyRound}>Kata sandi</CardTitle>
          <PasswordSection firstTime={props.justConverted} />
        </Card>
      )}
    </section>
  );
}
