"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
      <Link href="/" className="brand gradient-text" aria-label="Beranda">
        🧠 Feynman Challenge
      </Link>

      <div className="row" style={{ gap: "var(--space-3)" }}>
        <Link
          href="/"
          className="badge"
          title="Streak harian"
          aria-label={`Streak harian: ${streakCount} hari`}
        >
          🔥 {streakCount}
        </Link>

        <span className="text-secondary text-sm show-from-sm">{displayName}</span>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Keluar…" : "Keluar"}
        </button>
      </div>
    </header>
  );
}
