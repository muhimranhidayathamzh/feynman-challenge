import type { ReactNode } from "react";

/** Re-mounts on each navigation, giving every route a subtle fade-in. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}
