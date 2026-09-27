import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { CoverageMark } from "@/components/evaluation/coverage-mark";
import { HintChip } from "@/components/recording/hint-chip";
import { StageTimer } from "@/components/recording/stage-timer";
import { ButtonLink } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import type { AuthFeatures } from "@/lib/auth/auth-features";
import { DEMO_ATTEMPT, DEMO_CHALLENGE, DEMO_OUTLINE } from "@/lib/demo/fixture";
import { scorePhrase } from "@/lib/utils/labels";
import { splitSummary } from "@/lib/utils/transcript";

import { LandingDemoButton } from "./landing-demo-button";

/** A real (fixture) result, so the promise is shown instead of described. */
const SAMPLE = {
  score: 7,
  summary: splitSummary(DEMO_ATTEMPT.feedback).summary ?? "",
  points: DEMO_ATTEMPT.coverage.slice(0, 3),
  quote: DEMO_ATTEMPT.coverage[0]?.evidence ?? "",
};

/** Step 1: the outline the AI drafts for a topic. */
function OutlinePreview() {
  return (
    <Sheet className="landing-preview stack gap-3">
      <p className="landing-preview-label">Poin yang perlu kamu jelaskan</p>
      <ol className="landing-outline">
        {DEMO_OUTLINE.map((item, index) => (
          <li key={item.title}>
            <span className="landing-outline-number">{index + 1}</span>
            {item.title}
          </li>
        ))}
      </ol>
    </Sheet>
  );
}

/**
 * Step 2: the recording stage, drawn with the stage's own components so the
 * preview cannot drift from the real screen. A picture, so its parts are not
 * read out one by one.
 */
function BoardPreview() {
  return (
    <div
      data-mood="board"
      className="landing-board"
      role="img"
      aria-label="Contoh layar rekam: papan tulis gelap dengan sisa waktu satu menit empat puluh enam detik, dan tiga bantuan yang masing-masing menurunkan skor maksimal."
    >
      <p className="landing-board-eyebrow">Jelaskan</p>
      <p className="landing-board-title">{DEMO_CHALLENGE.title}</p>
      <StageTimer
        totalSeconds={DEMO_CHALLENGE.recordingDurationSec}
        elapsedSeconds={74}
        started
      />
      <div className="landing-board-hints">
        <HintChip label="Kata kunci" cap={9} revealed={false} />
        <HintChip label="Pertanyaan" cap={8} revealed={false} />
        <HintChip label="Outline" cap={7} revealed={false} />
      </div>
    </div>
  );
}

/** Step 3: a real evaluation of the demo attempt. */
function ResultPreview() {
  return (
    <Sheet className="landing-preview stack gap-4">
      <p className="landing-result-summary">{SAMPLE.summary}</p>
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
      {SAMPLE.quote && (
        <p className="landing-quote">
          <span className="text-muted text-xs">Bukti dari ucapanmu</span>
          <span className="transcript">
            {/* legend-mark: the same highlighter stroke, without pretending
                to be clickable the way it is on the result page. */}
            “<mark className="legend-mark">{SAMPLE.quote}</mark>”
          </span>
        </p>
      )}
    </Sheet>
  );
}

const FLOW = [
  {
    title: "Pelajari",
    body: "Tulis topik apa pun. AI menyusun poin yang perlu kamu kuasai, lengkap dengan sumber belajarnya.",
    preview: <OutlinePreview />,
  },
  {
    title: "Jelaskan",
    body: "Rekam penjelasanmu seperti menerangkan ke teman. Butuh bantuan? Ada, tapi harganya jujur: skor maksimalmu turun.",
    preview: <BoardPreview />,
  },
  {
    title: "Lihat celahmu",
    body: "AI menilai tiap poin dari rekamanmu sendiri, dan menunjukkan kalimat mana yang jadi buktinya.",
    preview: <ResultPreview />,
  },
];

/**
 * The public front page (decision DV6, reworked in V.7): what this is, then
 * the loop shown with the app's real screens instead of three identical icon
 * cards (DESIGN.md §12 bans those). Signed-out visitors land here.
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

      <section className="stack gap-8" aria-labelledby="flow-title">
        <h2 id="flow-title" className="section-title">
          Begini cara kerjanya
        </h2>
        <ol className="landing-flow">
          {FLOW.map((step, index) => (
            <li key={step.title} className="landing-flow-step">
              <div className="landing-flow-text">
                <h3 className="landing-flow-title">
                  <span className="onboarding-step-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  {step.title}
                </h3>
                <p className="landing-flow-body">{step.body}</p>
              </div>
              <div className="landing-flow-preview">{step.preview}</div>
            </li>
          ))}
        </ol>
        <p className="text-muted text-sm">
          Contoh di atas diambil dari tantangan demo {DEMO_CHALLENGE.title}.
        </p>
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
