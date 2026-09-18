"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Brain, Flame, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/lib/auth/auth-provider";

interface Props {
  /** From profiles.display_name (server), not from auth metadata. */
  displayName: string;
  /** Live streak: already 0 when the streak is broken. */
  streakCount: number;
}

export function Header({ displayName, streakCount }: Props) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="app-header">
      <Link href="/" className="brand" aria-label="Feynman Challenge, ke beranda">
        <Icon icon={Brain} size={22} className="brand-icon" />
        <span className="gradient-text">Feynman Challenge</span>
      </Link>

      <div className="row gap-3">
        <Link
          href="/"
          className="badge badge-warning"
          title="Streak harian"
          aria-label={`Streak harian: ${streakCount} hari`}
        >
          <Icon icon={Flame} size={14} />
          {streakCount}
        </Link>

        <span className="text-secondary text-sm show-from-sm">{displayName}</span>

        <Button
          variant="ghost"
          size="sm"
          icon={LogOut}
          onClick={handleLogout}
          loading={loggingOut}
        >
          Keluar
        </Button>
      </div>
    </header>
  );
}
