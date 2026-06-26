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
          background: "#101218",
          color: "#eef0f5",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: "1rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "28rem" }}>
          <div style={{ fontSize: "2.5rem" }}>😵‍💫</div>
          <h2 style={{ margin: "0.5rem 0" }}>Aplikasi bermasalah</h2>
          <p style={{ color: "#9aa3b2" }}>
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
              color: "#fff",
              fontWeight: 600,
              background:
                "linear-gradient(135deg, hsl(250,85%,65%), hsl(210,75%,55%))",
            }}
          >
            Muat ulang
          </button>
        </div>
      </body>
    </html>
  );
}
