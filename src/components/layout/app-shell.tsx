import type { ReactNode } from "react";

import { DemoBanner } from "./demo-banner";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

interface Props {
  displayName: string;
  streakCount: number;
  isAnonymous: boolean;
  /** Overrides the active nav item (the dev gallery has its own URL). */
  currentPath?: string;
  children: ReactNode;
}

/** Header + navigation + main landmark shared by every signed-in page. */
export function AppShell({
  displayName,
  streakCount,
  isAnonymous,
  currentPath,
  children,
}: Props) {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>
      <Header
        displayName={displayName}
        streakCount={streakCount}
        isAnonymous={isAnonymous}
      />
      <div className="app-body">
        <Sidebar currentPath={currentPath} />
        <main id="main-content" className="app-main" tabIndex={-1}>
          {isAnonymous && <DemoBanner />}
          {children}
        </main>
      </div>
    </div>
  );
}
