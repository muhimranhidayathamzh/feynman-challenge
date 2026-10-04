import type { ReactNode } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { CoverageMark } from "@/components/evaluation/coverage-mark";
import { BrandMark } from "@/components/layout/brand-mark";
import { ButtonLink } from "@/components/ui/button";
import type { AuthFeatures } from "@/lib/auth/auth-features";
import { cx } from "@/lib/utils/cx";
import { closingQuestion } from "@/lib/utils/landing-questions";

import { LandingDemoButton } from "./landing-demo-button";

// ---------------------------------------------------------------------------
// The public front page (V.10), from docs/design/landing-konsep.html.
//
// One story: the visitor experiences the problem (a ten-second test of an
// everyday mechanism), learns its name (the illusion of explanatory depth),
// sees how the product reads an explanation (a corrected paragraph with the
// result page's own marks), learns the steps, feels safe, and meets the
// opening question again at the end.
//
// Honest by construction: no testimonials, user counts, countdowns or
// scarcity, and no example topic. The one study cited is real and findable.
// ---------------------------------------------------------------------------

const CTA_LABEL = "Temukan celahmu";

const STEPS = [
  {
    title: "Pilih topik",
    body: "Apa saja yang ingin kamu pahami. AI menyusun poin yang perlu kamu jelaskan dan sumber belajarnya.",
  },
  {
    title: "Jelaskan dengan suaramu",
    body: "Rekam penjelasanmu seperti menerangkan ke teman. Kalau buntu, ada bantuan, dan harganya tertulis jujur.",
  },
  {
    title: "Lihat celahmu",
    body: "Setiap poin dinilai dari ucapanmu sendiri, lengkap dengan kalimat yang jadi buktinya.",
  },
];

const SAFETY = [
  "Rekamanmu privat. Hanya kamu yang bisa memutarnya.",
  "Dengarkan dulu sebelum mengirim, dan rekam ulang kapan saja.",
  "Gratis. Bisa dicoba tanpa akun dan tanpa email.",
];

const FAQ: { question: string; answer: string }[] = [
  {
    question: "Ke mana rekamanku pergi?",
    answer:
      "Rekaman disimpan secara privat dan hanya kamu yang bisa memutarnya. Untuk dinilai, rekaman dikirim ke Google Gemini. Rekaman ikut terhapus saat tantangannya kamu hapus.",
  },
  {
    question: "Apakah gratis?",
    answer:
      "Ya. Kamu bisa langsung mencoba tanpa akun, atau daftar gratis. Ada batas pemakaian AI harian supaya layanan tetap berjalan untuk semua orang.",
  },
  {
    question: "Berapa lama satu kali latihan?",
    answer:
      "Rekamannya beberapa menit, disesuaikan dengan luas topik. Penilaiannya biasanya selesai dalam kurang dari setengah menit.",
  },
  {
    question: "Seberapa bisa dipercaya penilaiannya?",
    answer:
      "Setiap poin dinilai dengan kutipan dari ucapanmu sebagai bukti, jadi kamu bisa memeriksanya sendiri. Skor akhir dihitung dengan rumus tetap dari kelengkapan, ketepatan, dan kejelasan. AI tetap bisa keliru: anggap ini teman belajar yang jujur, bukan juri.",
  },
  {
    question: "Perlu memasang aplikasi?",
    answer:
      "Tidak. Buka di browser mana pun. Kalau mau, pasang ke layar utama ponselmu supaya terasa seperti aplikasi.",
  },
];

/** The one action, phrased as its benefit. Signs up instead when the demo is off. */
function PrimaryAction({ features }: { features: AuthFeatures }) {
  return (
    <div className="lp-action">
      {features.anonymous ? (
        <LandingDemoButton label={CTA_LABEL} />
      ) : (
        <ButtonLink href="/signup" size="lg">
          {CTA_LABEL}
        </ButtonLink>
      )}
      <p className="lp-action-note">
        {features.anonymous
          ? "Tanpa akun · tanpa email · sekitar lima menit"
          : "Daftar gratis · sekitar lima menit"}
      </p>
    </div>
  );
}

function Section({
  id,
  eyebrow,
  title,
  sunken = false,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  sunken?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={cx("lp-section", sunken && "lp-section-sunken")}
      aria-labelledby={id}
    >
      <div className="lp-inner stack gap-8">
        <header className="lp-section-head">
          <p className="lp-eyebrow">{eyebrow}</p>
          <h2 id={id} className="lp-section-title">
            {title}
          </h2>
        </header>
        {children}
      </div>
    </section>
  );
}

/**
 * A paragraph everyone has written in an exam, read the way the result page
 * reads an explanation: the highlighter marks the quoted evidence, the
 * dotted underline an unexplained term, and the notes use the page's own
 * verdicts. No topic: "ini" is whatever the reader was sure they understood.
 */
function CorrectedPage() {
  return (
    <figure className="lp-sheet">
      <figcaption className="lp-sheet-label">
        Penjelasan yang terasa meyakinkan
      </figcaption>
      <p className="lp-sheet-text">
        Aku sudah membaca materinya dua kali, jadi aku yakin paham. Intinya,{" "}
        <mark className="legend-mark">
          ini bekerja karena <span className="jargon-term">mekanismenya</span> memang
          begitu
        </mark>
        . Pokoknya kalau sudah dipraktikkan pasti mengerti.
      </p>
      <ul className="lp-sheet-notes">
        <li>
          <CoverageMark status="partial" decorative />
          <p>
            <strong>Sebagian.</strong> Kamu menyebut ada cara kerjanya, tapi belum
            menjelaskannya.
          </p>
        </li>
        <li>
          <CoverageMark status="missing" decorative />
          <p>
            <strong>Belum dibahas.</strong> Langkah-langkahnya sendiri.
          </p>
        </li>
        <li>
          <span className="lp-sheet-term" aria-hidden="true" />
          <p>
            <strong>Istilah yang belum kamu jelaskan.</strong> “Mekanismenya” itu nama,
            bukan penjelasan.
          </p>
        </li>
      </ul>
      <p className="lp-sheet-focus">
        <span>Fokus berikutnya</span>
        Ganti “pokoknya” dengan langkah yang sebenarnya.
      </p>
    </figure>
  );
}

export function Landing({
  features,
  question,
}: {
  features: AuthFeatures;
  /** Chosen per visit (pickQuestion); pinned in the dev gallery. */
  question: string;
}) {
  return (
    <div className="lp">
      <a href="#lp-main" className="skip-link">
        Lewati ke konten utama
      </a>
      <header className="lp-nav">
        <div className="lp-inner lp-nav-row">
          <Link href="/" className="brand" aria-label="Feynman Challenge, beranda">
            <BrandMark size={28} />
            <span className="brand-name">Feynman Challenge</span>
          </Link>
          <ButtonLink href="/login" variant="ghost" size="sm">
            Masuk
          </ButtonLink>
        </div>
      </header>

      <main id="lp-main" tabIndex={-1}>
        {/* 1. The mirror: the visitor meets the problem in their own head. */}
        <section className="lp-mirror" aria-labelledby="mirror-question">
          <div className="lp-inner lp-mirror-inner">
            <p className="lp-eyebrow">Tes sepuluh detik</p>
            <h1 id="mirror-question" className="lp-mirror-question">
              {question}
            </h1>
            <p className="lp-mirror-instruction">
              Jawab dalam kepala. Jelaskan langkahnya, bukan namanya.
            </p>
            <div className="lp-mirror-timer" aria-hidden="true">
              <span />
            </div>
            <div className="lp-mirror-reveal">
              <p className="lp-mirror-relief">Tersendat? Kamu tidak sendirian.</p>
              <p className="lp-mirror-reason">
                Rasa paham sering bertahan sampai kita diminta menjelaskan. Feynman
                Challenge membantumu menemukan bagian yang belum kamu pahami, dengan
                suaramu sendiri.
              </p>
            </div>
            <PrimaryAction features={features} />
          </div>
        </section>

        {/* 2. The name: shame becomes curiosity, with a source to check. */}
        <Section
          id="name-title"
          eyebrow="Bukan cuma kamu"
          title="Rasa paham dan bisa menjelaskan adalah dua hal berbeda"
        >
          <div className="lp-columns lp-prose">
            <p>
              Di Yale pada 2002, Leonid Rozenblit dan Frank Keil meminta orang menilai
              seberapa paham mereka tentang benda sehari-hari seperti resleting dan
              gembok, lalu menjelaskan cara kerjanya langkah demi langkah. Setelah
              mencoba, mereka sendiri yang menurunkan penilaiannya. Fenomena ini disebut
              ilusi kedalaman penjelasan.
            </p>
            <p>
              Belajar pun begitu. Membaca ulang dan menonton membuat materi terasa akrab,
              dan rasa akrab mudah disangka paham. Cara menguji bedanya dikenal sebagai
              teknik Feynman, dinamai dari fisikawan Richard Feynman yang terkenal karena
              menjelaskan hal rumit dengan sederhana: coba jelaskan dengan kata-katamu
              sendiri.
            </p>
          </div>
        </Section>

        {/* 3. The corrected page: how the product reads an explanation. */}
        <Section
          id="read-title"
          eyebrow="Cara penjelasanmu dibaca"
          title="Membaca membuatmu merasa paham. Menjelaskan membuktikannya."
          sunken
        >
          <div className="lp-split">
            <div className="stack gap-4 lp-prose">
              <p>
                Rekam penjelasanmu tentang topik apa pun. Setiap poin yang perlu kamu
                jelaskan dinilai dari ucapanmu sendiri, seperti guru yang teliti membaca
                kertas ujianmu.
              </p>
              <p>
                Kalimat yang jadi bukti ditandai stabilo. Istilah yang kamu pakai tapi
                belum kamu jelaskan diberi garis titik-titik. Dan kamu selalu tahu satu
                hal yang perlu diperbaiki berikutnya.
              </p>
            </div>
            <CorrectedPage />
          </div>
        </Section>

        {/* 4. The steps, short: by now the visitor knows why. */}
        <Section
          id="steps-title"
          eyebrow="Caranya"
          title="Pilih topik. Jelaskan dengan suaramu. Lihat celahmu."
        >
          <ol className="lp-steps">
            {STEPS.map((step, index) => (
              <li key={step.title} className="lp-step">
                <span className="lp-step-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="lp-step-title">{step.title}</h3>
                <p className="text-secondary">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="lp-prose lp-steps-after">
            Setelah itu, setiap topik punya jadwal ulangnya sendiri. Makin baik
            penjelasanmu, makin jauh jaraknya, dari sehari sampai dua bulan.
          </p>
        </Section>

        {/* 5. Safety: the biggest hesitation, answered before the last button. */}
        <Section
          id="safe-title"
          eyebrow="Tenang saja"
          title="Tidak ada yang mendengar selain penilainya"
          sunken
        >
          <div className="lp-split lp-split-top">
            <ul className="lp-safety">
              {SAFETY.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <div className="lp-faq">
              {FAQ.map((item) => (
                <details key={item.question} className="lp-faq-item">
                  <summary className="lp-faq-question">
                    {item.question}
                    <Plus className="lp-faq-icon" size={20} aria-hidden="true" />
                  </summary>
                  <p className="lp-faq-answer">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </Section>

        {/* 6. The close, at the board: the opening question, answered with a way. */}
        <section className="lp-closing" data-mood="board" aria-labelledby="closing-title">
          <div className="lp-inner lp-closing-inner">
            <h2 id="closing-title" className="lp-closing-title">
              {closingQuestion(question)}
            </h2>
            <p className="lp-closing-lead">
              Sekarang kamu tahu cara mencari tahu. Jelaskan satu topik hari ini, dengan
              suaramu, dan lihat bagian mana yang belum kamu pahami.
            </p>
            <PrimaryAction features={features} />
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-inner lp-footer-row">
          <span className="brand">
            <BrandMark size={20} />
            <span className="lp-footer-name">Feynman Challenge</span>
          </span>
          <nav className="row flex-wrap gap-4" aria-label="Tautan kaki">
            <Link href="/login" className="lp-footer-link">
              Masuk
            </Link>
            <Link href="/signup" className="lp-footer-link">
              Daftar gratis
            </Link>
            <Link href="/privasi" className="lp-footer-link">
              Privasi
            </Link>
            <Link href="/syarat" className="lp-footer-link">
              Syarat
            </Link>
          </nav>
          <p className="text-muted text-xs">© 2026 Feynman Challenge</p>
        </div>
      </footer>
    </div>
  );
}
