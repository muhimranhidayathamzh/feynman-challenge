"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { BrandMark } from "./brand-mark";
import { useAuth } from "@/lib/auth/auth-provider";

interface Props {
  /** From profiles.display_name (server), not from auth metadata. */
  displayName: string;
  /** Demo account: logging out loses its data for good, so confirm first. */
  isAnonymous: boolean;
}

/**
 * The app bar. No streak badge here: the week strip on Meja Belajar replaced
 * it (DESIGN.md §10), and showing both counted the same days twice (V.7).
 */
export function Header({ displayName, isAnonymous }: Props) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmDemoLogout, setConfirmDemoLogout] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="app-header">
      <Link href="/" className="brand" aria-label="Feynman Challenge, ke beranda">
        <BrandMark size={28} />
        <span className="brand-name">Feynman Challenge</span>
      </Link>

      <div className="row gap-3">
        <span className="text-secondary text-sm show-from-sm">{displayName}</span>

        <Button
          variant="ghost"
          size="sm"
          icon={LogOut}
          onClick={isAnonymous ? () => setConfirmDemoLogout(true) : handleLogout}
          loading={loggingOut}
        >
          Keluar
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDemoLogout}
        title="Keluar dari mode demo?"
        message="Akun demo tidak punya email atau kata sandi. Setelah keluar, tantangan dan hasil di akun ini tidak bisa dibuka lagi. Simpan progres dulu di Pengaturan jika ingin menyimpannya."
        confirmLabel="Tetap keluar"
        tone="danger"
        busy={loggingOut}
        onConfirm={() => void handleLogout()}
        onCancel={() => setConfirmDemoLogout(false)}
      />
    </header>
  );
}
