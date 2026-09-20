import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { CoverageMark } from "@/components/evaluation/coverage-mark";
import { ButtonLink } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Illustration, type IllustrationName } from "@/components/ui/illustration";
import type { AuthFeatures } from "@/lib/auth/auth-features";
import { DEMO_ATTEMPT } from "@/lib/demo/fixture";

import { LandingDemoButton } from "./landing-demo-button";
import { scorePhrase } from "@/lib/utils/labels";
import { splitSummary } from "@/lib/utils/transcript";

const STEPS: { illustration: IllustrationName; title: string; body: string }[] = [
  {
    illustration: "catatan-kosong",
    title: "Pelajari",
    body: "Tulis topik apa pun. AI menyusun poin yang perlu kamu kuasai dan sumber belajarnya.",
  },
  {
    illustration: "mendengarkan",
    title: "Jelaskan",
    body: "Rekam penjelasanmu sendiri, maksimal beberapa menit, seperti menerangkan ke teman.",
  },
  {
    illustration: "hasil",
    title: "Lihat celahmu",
    body: "AI menandai poin yang sudah jelas dan yang belum, dengan kutipan dari ucapanmu.",
  },
];

/** A real (fixture) result, so the promise is shown instead of described. */
const SAMPLE = {
  score: 7,
  summary: splitSummary(DEMO_ATTEMPT.feedback).summary ?? "",
  points: DEMO_ATTEMPT.coverage.slice(0, 3),
};

/**
 * The public front page (decision DV6): what this is, in three steps, with a
 * real evaluation to look at. Signed-out visitors land here instead of on a
 * login form (audit #6).
 */
export function Landing({ features }: { features: AuthFeatures }) {
  return (
    <main className="landing">
      <section className="landing-hero">
        <BrandMark size={56} />
        <h1 className="landing-title">
          Kalau kamu nggak bisa menjelaskannya, kamu belum paham.
        </h1>
        <p className="landing-lead">
          Feynman Challenge membantumu menguasai materi apa pun dengan cara paling jujur:
          jelaskan ulang pakai suaramu, lalu lihat bagian mana yang sebenarnya belum kamu
          mengerti.
        </p>
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
        <p className="text-muted text-sm">
          Gratis, berbahasa Indonesia, dan bisa dipasang seperti aplikasi.
          {features.anonymous ? " Mode demo tidak perlu email." : ""}
        </p>
      </section>

      <section className="landing-steps" aria-labelledby="steps-title">
        <h2 id="steps-title" className="section-title">
          Tiga langkah yang kamu ulang
        </h2>
        <ol className="onboarding-steps">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <Sheet className="onboarding-step">
                <Illustration name={step.illustration} />
                <h3 className="onboarding-step-title">
                  <span className="onboarding-step-number">{index + 1}</span>
                  {step.title}
                </h3>
                <p className="text-secondary text-sm">{step.body}</p>
              </Sheet>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-sample" aria-labelledby="sample-title">
        <h2 id="sample-title" className="section-title">
          Beginilah hasilnya
        </h2>
        <Sheet className="stack gap-4">
          <p className="result-summary">{SAMPLE.summary}</p>
          <div className="score-figure">
            <p className="score-figure-number">
              <span className="score-figure-value">{SAMPLE.score}</span>
              <span className="score-figure-max"> /10</span>
            </p>
            <div className="score-figure-meta">
              <p className="score-figure-phrase">{scorePhrase(SAMPLE.score)}</p>
            </div>
          </div>
          <ul className="point-list">
            {SAMPLE.points.map((point) => (
              <li key={point.topic} className="point-row">
                <CoverageMark status={point.status} decorative />
                <div className="stack gap-1">
                  <p className="point-topic">{point.topic}</p>
                  <p className="text-secondary text-sm">{point.note}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-muted text-sm">
            Contoh dari tantangan Fotosintesis. Tiap poin dinilai dari rekamanmu sendiri.
          </p>
        </Sheet>
      </section>

      <footer className="landing-footer">
        <p className="text-muted text-sm">
          <span>Sudah punya akun? </span>
          <Link href="/login" className="link-accent">
            Masuk
          </Link>
        </p>
      </footer>
    </main>
  );
}
