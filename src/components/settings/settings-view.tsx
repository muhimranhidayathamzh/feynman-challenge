import Link from "next/link";

import { Sheet, SheetTitle } from "@/components/ui/sheet";
import type { ThemePreference } from "@/lib/theme";

import { ConvertAccount } from "./convert-account";
import { DeleteAccount } from "./delete-account";
import { PasswordSection } from "./password-section";
import { ProfileForm } from "./profile-form";
import { ReminderToggle } from "./reminder-toggle";
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
  /** Review reminder emails; null when this account or deployment cannot get them. */
  reminders?: { on: boolean } | null;
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

      <Sheet className="stack gap-4">
        <SheetTitle>Profil</SheetTitle>
        <ProfileForm
          initialDisplayName={props.displayName}
          initialTimezone={props.timezone}
          timezones={props.timezones}
        />
      </Sheet>

      <Sheet className="stack gap-4">
        <SheetTitle>Tampilan</SheetTitle>
        <ThemeForm initial={props.theme} />
      </Sheet>

      {props.reminders && (
        <Sheet className="stack gap-4" id="pengingat">
          <SheetTitle>Pengingat review</SheetTitle>
          <ReminderToggle initial={props.reminders.on} />
        </Sheet>
      )}

      {props.isDemo ? (
        <Sheet className="stack gap-4" id="simpan-akun">
          <SheetTitle>Simpan progres jadi akun</SheetTitle>
          <p className="text-secondary text-sm">
            Kamu sedang memakai mode demo tanpa email. Hubungkan email agar tantangan dan
            hasilmu tidak hilang saat keluar.
          </p>
          <ConvertAccount pendingEmail={props.pendingEmail} />
        </Sheet>
      ) : (
        <Sheet className="stack gap-3">
          <SheetTitle>Akun</SheetTitle>
          <p className="text-secondary text-sm">
            Masuk sebagai <strong>{props.email}</strong>
          </p>
        </Sheet>
      )}

      {props.hasPassword && (
        <Sheet className="stack gap-4" id="kata-sandi">
          <SheetTitle>Kata sandi</SheetTitle>
          <PasswordSection firstTime={props.justConverted} />
        </Sheet>
      )}

      <Sheet
        as="section"
        id="hapus-akun"
        className="stack gap-3"
        aria-labelledby="danger-title"
      >
        <SheetTitle id="danger-title">Zona berbahaya</SheetTitle>
        <DeleteAccount needsPassword={props.hasPassword} isDemo={props.isDemo} />
      </Sheet>

      <nav className="settings-legal row gap-4 text-sm" aria-label="Halaman legal">
        <Link href="/privasi">Kebijakan Privasi</Link>
        <Link href="/syarat">Syarat Penggunaan</Link>
      </nav>
    </section>
  );
}
