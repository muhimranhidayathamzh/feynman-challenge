import type { ReactNode } from "react";

/** Centered column with the brand heading, shared by every auth page. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-shell">
      <div className="auth-column stack gap-6 animate-fade-in-up">
        <header className="stack gap-2 text-center">
          <h1 className="gradient-text auth-title">Feynman Challenge</h1>
          <p className="text-secondary text-sm">
            Kalau kamu nggak bisa menjelaskannya, kamu belum paham.
          </p>
        </header>
        {children}
      </div>
    </main>
  );
}
