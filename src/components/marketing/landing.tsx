import type { ReactNode } from "react";
import Link from "next/link";
import { LogIn, Plus, UserPlus } from "lucide-react";

import { LeitnerStrip } from "@/components/challenge/leitner-strip";
import { MasteryMeter } from "@/components/challenge/mastery-meter";
import { CoverageMark } from "@/components/evaluation/coverage-mark";
import { BrandMark } from "@/components/layout/brand-mark";
import { HintChip } from "@/components/recording/hint-chip";
import { StageTimer } from "@/components/recording/stage-timer";
import { ButtonLink } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import type { AuthFeatures } from "@/lib/auth/auth-features";
import { cx } from "@/lib/utils/cx";
import { COVERAGE_STATUS_LABEL } from "@/lib/utils/labels";
import type { CoverageStatus } from "@/types";

import { LandingDemoButton } from "./landing-demo-button";

// ---------------------------------------------------------------------------
// The public front page (DV6; a product page since V.8, plain since V.9).
//
// No example topic anywhere: the owner wants visitors to meet the product on
// their own topic, so "Coba tanpa akun" opens "Tantangan baru" directly. The
// pictures of the product are the product's own components with no content
// in them (the stage's clock and hints, the verdict marks), so the page can
// neither drift from the app nor promise a screen it does not have. Nothing
// here claims a feature that does not exist yet.
// ---------------------------------------------------------------------------

/** The stage's default length (see the record page). */
const STAGE_SECONDS = 180;

const STEPS = [
  {
    title: "Pilih topik",
    body: "Tulis apa saja yang ingin kamu pahami. AI menyusun poin yang perlu kamu jelaskan dan sumber belajarnya.",
  },
  {
    title: "Jelaskan dengan suaramu",
    body: "Rekam penjelasanmu seperti menerangkan ke teman. Bantuan tersedia, dan harganya tertulis jujur.",
  },
  {
    title: "Lihat celahmu",
    body: "Setiap poin dinilai dari ucapanmu sendiri, lengkap dengan kalimat yang jadi buktinya.",
  },
];

/** What each verdict means, in the words the result page uses. */
const VERDICTS: { status: CoverageStatus; body: string }[] = [
  {
    status: "covered",
    body: "Kamu menjelaskannya dengan benar. Kalimatmu yang jadi bukti ditandai stabilo.",
  },
  {
    status: "partial",
    body: "Sudah kamu singgung, tapi belum lengkap. Catatannya menyebut apa yang kurang.",
  },
  {
    status: "missing",
    body: "Belum muncul di penjelasanmu. “Pelajari lagi” membawamu langsung ke bagian itu.",
  },
];

const FAQ: { question: string; answer: string }[] = [
  {
    question: "Apakah gratis?",
    answer:
      "Ya. Kamu bisa langsung mencoba tanpa akun, atau daftar gratis. Ada batas pemakaian AI harian supaya layanan tetap berjalan untuk semua orang.",
  },
  {
    question: "Ke mana rekamanku pergi?",
    answer:
      "Rekaman disimpan secara privat: hanya kamu yang bisa memutarnya. Untuk dinilai, rekaman dikirim ke Google Gemini. Rekaman ikut terhapus saat tantangannya kamu hapus.",
  },
  {
    question: "Aku canggung bicara sendiri.",
    answer:
      "Tidak ada orang lain yang mendengar. Kamu bisa mendengarkan ulang sebelum mengirim, dan merekam ulang sesering yang kamu mau. Justru bagian yang terasa canggung biasanya bagian yang belum kamu pahami.",
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

/** The recording stage, drawn with the stage's own components and no topic. */
function BoardPreview() {
  return (
    <div
      data-mood="board"
      className="landing-board"
      role="img"
      aria-label="Layar rekam: papan tulis gelap dengan jam hitung mundur, dan tiga bantuan yang masing-masing menurunkan skor maksimal."
    >
      <p className="landing-board-eyebrow">Layar rekam</p>
      <p className="landing-board-title">Jelaskan seperti ke teman</p>
      <StageTimer totalSeconds={STAGE_SECONDS} elapsedSeconds={74} started />
      <div className="landing-board-hints">
        <HintChip label="Kata kunci" cap={9} revealed={false} />
        <HintChip label="Pertanyaan" cap={8} revealed={false} />
        <HintChip label="Outline" cap={7} revealed={false} />
      </div>
    </div>
  );
}

function Actions({ features }: { features: AuthFeatures }) {
  return (
    <div className="landing-actions">
      {features.anonymous ? (
        <>
          <LandingDemoButton />
          <ButtonLink href="/signup" variant="secondary" size="lg" icon={UserPlus}>
            Daftar gratis
          </ButtonLink>
        </>
      ) : (
        <>
          <ButtonLink href="/signup" size="lg" icon={UserPlus}>
            Daftar gratis
          </ButtonLink>
          <ButtonLink href="/login" variant="secondary" size="lg" icon={LogIn}>
            Masuk
          </ButtonLink>
        </>
      )}
    </div>
  );
}

function Section({
  id,
  eyebrow,
  title,
  lead,
  sunken = false,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lead?: string;
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
          {lead && <p className="lp-section-lead">{lead}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}

export function Landing({ features }: { features: AuthFeatures }) {
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
          <nav className="row gap-2" aria-label="Akun">
            <ButtonLink href="/login" variant="ghost" size="sm">
              Masuk
            </ButtonLink>
            <ButtonLink href="/signup" variant="secondary" size="sm">
              Daftar
            </ButtonLink>
          </nav>
        </div>
      </header>

      <main id="lp-main" tabIndex={-1}>
        {/* Hero: the promise on the left, the stage on the right. */}
        <section className="lp-hero" aria-labelledby="hero-title">
          <div className="lp-inner lp-hero-grid">
            <div className="lp-hero-copy">
              <p className="lp-eyebrow">Teknik Feynman, dinilai AI</p>
              <h1 id="hero-title" className="lp-hero-title">
                Jelaskan dengan suaramu. Lihat bagian yang belum kamu pahami.
              </h1>
              <p className="lp-hero-lead">
                Pilih topik apa pun, rekam penjelasanmu seperti menerangkan ke teman, lalu
                dapatkan penilaian poin demi poin, lengkap dengan kutipan ucapanmu sendiri
                sebagai bukti.
              </p>
              <Actions features={features} />
              <p className="text-muted text-sm">
                Gratis dan berbahasa Indonesia.
                {features.anonymous
                  ? " Bisa dicoba tanpa email, dengan topikmu sendiri."
                  : ""}
              </p>
            </div>
            <div className="lp-hero-visual">
              <BoardPreview />
            </div>
          </div>
        </section>

        <Section
          id="how-title"
          eyebrow="Cara kerjanya"
          title="Tiga langkah, diulang sampai paham"
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
        </Section>

        {/* How a result reads, without an example: the verdicts and marks
            the result page uses, each explained once. */}
        <Section
          id="grading-title"
          eyebrow="Penilaian yang bisa diperiksa"
          title="Setiap nilai punya bukti"
          sunken
        >
          <div className="lp-split">
            <div className="stack gap-4 lp-prose">
              <p>
                Rekamanmu diubah jadi transkrip, lalu setiap poin yang perlu kamu jelaskan
                dinilai satu per satu. Pilih sebuah poin, dan kalimatmu yang jadi buktinya
                menyala di transkrip.
              </p>
              <p>
                Istilah yang kamu pakai tapi belum kamu jelaskan ikut ditandai, karena di
                situlah pemahaman sering berhenti.
              </p>
              <p>
                Skor 0 sampai 10 dihitung dengan rumus tetap dari kelengkapan, ketepatan,
                dan kejelasan, dan selalu datang bersama satu kalimat ringkasan.
              </p>
            </div>
            <Sheet className="stack gap-5">
              <ul className="lp-verdicts">
                {VERDICTS.map((verdict) => (
                  <li key={verdict.status} className="lp-verdict-row">
                    <CoverageMark status={verdict.status} decorative />
                    <div className="stack gap-1">
                      <p className="font-semibold">
                        {COVERAGE_STATUS_LABEL[verdict.status]}
                      </p>
                      <p className="text-secondary text-sm">{verdict.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="lp-marks-legend text-sm">
                <span className="legend-mark">Stabilo</span> kutipan yang jadi bukti.{" "}
                <span className="jargon-term">Garis titik-titik</span> istilah yang belum
                kamu jelaskan.
              </p>
            </Sheet>
          </div>
        </Section>

        <Section
          id="schedule-title"
          eyebrow="Supaya tidak lupa lagi"
          title="Diulang tepat pada waktunya"
        >
          <div className="lp-split">
            <div className="stack gap-4 lp-prose">
              <p>
                Setiap topik punya jadwal ulangnya sendiri. Makin baik penjelasanmu, makin
                jauh jarak ulangnya: dari sehari, sampai dua bulan.
              </p>
              <p>
                Beranda selalu menunjukkan satu hal yang perlu kamu kerjakan hari ini, dan
                tingkat penguasaanmu naik seiring penjelasan yang makin lengkap.
              </p>
            </div>
            <Sheet className="stack gap-5">
              <MasteryMeter state="developing" />
              <LeitnerStrip box={1} />
            </Sheet>
          </div>
        </Section>

        <Section
          id="why-title"
          eyebrow="Kenapa cara ini"
          title="Menjelaskan adalah cara paling jujur untuk menguji pemahaman"
        >
          <div className="lp-columns lp-prose">
            <p>
              Membaca ulang membuat materi terasa akrab, padahal belum tentu dipahami.
              Menjelaskan memaksamu menyusunnya ulang sendiri, dan celahnya langsung
              terasa di kalimat yang tersendat.
            </p>
            <p>
              Teknik ini dinamai dari fisikawan Richard Feynman, yang terkenal karena
              menjelaskan hal rumit dengan bahasa sederhana. Menguji ingatan secara aktif,
              lalu mengulanginya dengan jarak yang makin lebar, termasuk cara belajar yang
              paling kuat dukungan penelitiannya.
            </p>
          </div>
        </Section>

        <Section
          id="faq-title"
          eyebrow="Pertanyaan umum"
          title="Sebelum kamu mencoba"
          sunken
        >
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
        </Section>

        {/* Closing call, at the board: explaining happens in front of it. */}
        <section className="lp-closing" data-mood="board" aria-labelledby="closing-title">
          <div className="lp-inner lp-closing-inner">
            <h2 id="closing-title" className="lp-closing-title">
              Siap menjelaskan satu topik hari ini?
            </h2>
            <p className="lp-closing-lead">
              Pilih topik yang ingin kamu pahami. Beberapa menit sudah cukup untuk tahu
              seberapa paham kamu sebenarnya.
            </p>
            <Actions features={features} />
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
              Daftar
            </Link>
          </nav>
          <p className="text-muted text-xs">© 2026 Feynman Challenge</p>
        </div>
      </footer>
    </div>
  );
}
