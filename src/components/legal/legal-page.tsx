import type { ReactNode } from "react";
import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { formatDay } from "@/lib/utils/date";

/** Last change to either legal page; bump it with every edit to their text. */
export const LEGAL_UPDATED = "2026-10-04";

interface Props {
  title: string;
  lead: string;
  children: ReactNode;
}

/**
 * A plain reading page for /privasi and /syarat (Prompt 5.2): readable by
 * anyone without signing in, one column, no app chrome.
 */
export function LegalPage({ title, lead, children }: Props) {
  return (
    <div className="legal-shell">
      <header className="legal-bar">
        <Link href="/" className="brand" aria-label="Feynman Challenge, beranda">
          <BrandMark size={24} />
          <span className="legal-brand-name">Feynman Challenge</span>
        </Link>
      </header>
      <main id="main" className="legal">
        <p className="legal-updated">
          Terakhir diperbarui {formatDay(LEGAL_UPDATED, true)}
        </p>
        <h1>{title}</h1>
        <p className="legal-lead">{lead}</p>
        {children}
      </main>
      <footer className="legal-footer">
        <nav aria-label="Halaman legal" className="row flex-wrap gap-4">
          <Link href="/privasi">Privasi</Link>
          <Link href="/syarat">Syarat</Link>
          <Link href="/">Beranda</Link>
        </nav>
      </footer>
    </div>
  );
}

/** "kirim email ke x" or, without a configured address, the project page. */
export function ContactLine({ email }: { email: string | null }) {
  return email ? (
    <>
      kirim email ke <a href={`mailto:${email}`}>{email}</a>
    </>
  ) : (
    <>
      tulis lewat{" "}
      <a
        href="https://github.com/muhimranhidayathamzh/feynman-challenge/issues"
        target="_blank"
        rel="noopener noreferrer"
      >
        halaman proyek di GitHub
      </a>{" "}
      (jangan menulis data pribadi di sana, karena halaman itu publik)
    </>
  );
}
