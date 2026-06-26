"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";

export function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const metadata = user?.user_metadata as { display_name?: string } | undefined;
  const displayName =
    metadata?.display_name?.trim() ||
    user?.email?.split("@")[0] ||
    "Kamu";

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
        {/* Streak placeholder — real streak wired in Phase 5 */}
        <span className="badge" title="Streak harian" aria-label="Streak harian">
          🔥 0
        </span>

        <span className="text-secondary text-sm show-from-sm">
          {displayName}
        </span>

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
