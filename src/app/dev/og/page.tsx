import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BrandMark } from "@/components/layout/brand-mark";

export const metadata: Metadata = {
  title: "Kartu OG",
  robots: { index: false, follow: false },
};

/**
 * The 1200x630 link-preview card, rendered with the app's own tokens and
 * fonts instead of being drawn by hand. `npm run og` photographs this page
 * into public/og.png; nothing serves it in production.
 *
 * Deliberately not part of /dev/galeri: it is an asset, not a screen state.
 */
export default function OgCardPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="og-card" data-capture="viewport">
      <div className="og-rule" aria-hidden="true" />
      <div className="og-brand">
        <BrandMark size={64} />
        <span className="og-wordmark">Feynman Challenge</span>
      </div>
      <p className="og-headline">
        Kalau kamu nggak bisa menjelaskannya,
        <br />
        kamu belum paham.
      </p>
      <p className="og-sub">
        Jelaskan ulang pakai suaramu. AI menunjukkan bagian mana yang sebenarnya belum
        kamu mengerti.
      </p>
    </div>
  );
}
