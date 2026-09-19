"use client";

import { useEffect } from "react";

// Replaces the root layout when it (or the root template) throws, so this must
// render its own <html>/<body> and cannot rely on globals.css — styles inline.
export default function GlobalError({
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
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4efe4",
          color: "#1e2230",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: "1rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "28rem" }}>
          <h2 style={{ margin: "0.5rem 0" }}>Aplikasi bermasalah</h2>
          <p style={{ color: "#4e5566" }}>
            Terjadi kesalahan fatal. Muat ulang untuk mencoba lagi.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1rem",
              padding: "0.7rem 1.4rem",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              color: "#ffffff",
              fontWeight: 600,
              background: "#c8431b",
              boxShadow: "0 3px 0 #9f3413",
            }}
          >
            Muat ulang
          </button>
        </div>
      </body>
    </html>
  );
}
