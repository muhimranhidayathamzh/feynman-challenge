import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="center" style={{ minHeight: "100dvh", padding: "var(--space-4)" }}>
      <div
        className="stack animate-fade-in-up"
        style={{ width: "100%", maxWidth: "26rem", gap: "var(--space-6)" }}
      >
        <header className="stack text-center" style={{ gap: "var(--space-2)" }}>
          <h1 className="gradient-text" style={{ fontSize: "var(--text-3xl)" }}>
            Feynman Challenge
          </h1>
          <p className="text-secondary text-sm">
            Kalau kamu nggak bisa menjelaskannya, kamu belum paham.
          </p>
        </header>
        {children}
      </div>
    </main>
  );
}
