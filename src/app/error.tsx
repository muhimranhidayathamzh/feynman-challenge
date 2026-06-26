"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="center" style={{ minHeight: "70vh", padding: "var(--space-4)" }}>
      <div
        className="card stack text-center"
        style={{ gap: "var(--space-4)", maxWidth: "28rem" }}
      >
        <span style={{ fontSize: "2.5rem" }} aria-hidden="true">
          😵‍💫
        </span>
        <h2>Ada yang tidak beres</h2>
        <p className="text-secondary">
          Terjadi kesalahan tak terduga. Coba lagi atau kembali ke dashboard.
        </p>
        <div className="row" style={{ justifyContent: "center", gap: "var(--space-3)" }}>
          <button type="button" className="btn btn-primary" onClick={reset}>
            Coba lagi
          </button>
          <Link href="/" className="btn btn-ghost">
            Ke Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
