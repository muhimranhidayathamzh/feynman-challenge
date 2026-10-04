"use client";

import type { ReactNode, Ref } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Mic, RefreshCw, RotateCcw } from "lucide-react";

import { AudioPlayer } from "@/components/ui/audio-player";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Sheet } from "@/components/ui/sheet";
import { AUDIO_ISSUE_MESSAGES } from "@/lib/api/contracts";
import type { AttemptLink } from "@/lib/utils/attempt-history";
import type { CoverageComparison as Comparison } from "@/lib/utils/coverage-progress";
import { nextFocus } from "@/lib/utils/result-digest";
import { splitSummary } from "@/lib/utils/transcript";
import type { AudioIssue } from "@/types";

import { AttemptPager } from "./attempt-pager";
import { CoverageComparison } from "./coverage-comparison";
import { FeedbackNotes } from "./feedback-notes";
import { ResultEvidence, type CoverageRow } from "./result-evidence";
import { ScoreFigure } from "./score-figure";
import { ScoreHistory } from "./score-history";
import { SubScoreBars } from "./sub-score-bars";

type Neighbours = { previous: AttemptLink | null; next: AttemptLink | null };

const NO_NEIGHBOURS: Neighbours = { previous: null, next: null };

function hrefs(challengeId: string) {
  return {
    notebook: `/challenge/${challengeId}`,
    record: `/challenge/${challengeId}/record`,
  };
}

// ---------------------------------------------------------------------------
// Completed, but the audio could not be judged (no score)
// ---------------------------------------------------------------------------
interface RejectedProps {
  challengeId: string;
  audioIssue: Exclude<AudioIssue, "none">;
  feedback: string | null;
  audioUrl: string | null;
  neighbours?: Neighbours;
  headingRef?: Ref<HTMLHeadingElement>;
}

export function EvaluationRejectedView(props: RejectedProps) {
  const links = hrefs(props.challengeId);
  return (
    <section className="state-screen">
      <EmptyState
        illustration="hening"
        title="Rekaman ini belum bisa dinilai"
        headingRef={props.headingRef}
        actions={
          <>
            <ButtonLink href={links.record} icon={Mic}>
              Rekam ulang
            </ButtonLink>
            <ButtonLink href={links.notebook} variant="ghost">
              Kembali ke catatan
            </ButtonLink>
          </>
        }
      >
        <p>{AUDIO_ISSUE_MESSAGES[props.audioIssue]}</p>
        {props.feedback && <p className="text-sm">{props.feedback}</p>}
        <p className="text-sm">
          Tenang, percobaan ini tidak memengaruhi skor, penguasaan, maupun streak-mu.
        </p>
        {props.audioUrl && (
          <AudioPlayer src={props.audioUrl} label="Rekaman percobaan ini" />
        )}
      </EmptyState>
      <AttemptPager
        spelled
        challengeId={props.challengeId}
        {...(props.neighbours ?? NO_NEIGHBOURS)}
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Not yet completed: evaluating / polling / stale / error
// ---------------------------------------------------------------------------
export type EvaluationProgress = "evaluating" | "polling" | "stale" | "error";

interface StatusProps {
  challengeId: string;
  view: EvaluationProgress;
  error: string | null;
  onRetry: () => void;
  onReload: () => void;
  neighbours?: Neighbours;
}

export function EvaluationStatusView(props: StatusProps) {
  const links = hrefs(props.challengeId);
  const pager = (
    <AttemptPager
      spelled
      challengeId={props.challengeId}
      {...(props.neighbours ?? NO_NEIGHBOURS)}
    />
  );
  if (props.view === "error") {
    return (
      <section className="state-screen">
        <EmptyState
          illustration="error"
          title="Penilaian gagal kali ini"
          actions={
            <>
              <Button icon={RotateCcw} onClick={props.onRetry}>
                Nilai ulang
              </Button>
              <ButtonLink href={links.notebook} variant="ghost">
                Kembali ke catatan
              </ButtonLink>
            </>
          }
        >
          <p role="alert">{props.error}</p>
          <p className="text-sm">
            Rekamanmu aman. Menilai ulang tidak perlu merekam lagi.
          </p>
        </EmptyState>
        {pager}
      </section>
    );
  }
  if (props.view === "stale") {
    return (
      <section className="state-screen">
        <EmptyState
          illustration="mendengarkan"
          title="Penilaian lebih lama dari biasanya"
          actions={
            <>
              <Button icon={RefreshCw} onClick={props.onReload}>
                Cek lagi
              </Button>
              <ButtonLink href={links.notebook} variant="ghost">
                Kembali ke catatan
              </ButtonLink>
            </>
          }
        >
          <p>Rekamanmu sudah diterima dan masih dinilai. Cek lagi sebentar.</p>
        </EmptyState>
        {pager}
      </section>
    );
  }
  return (
    <section className="state-screen" aria-live="polite" aria-busy="true">
      <EmptyState illustration="mendengarkan" title="Sedang mendengarkan penjelasanmu">
        <p>
          AI mendengarkan rekamanmu dan mencocokkannya dengan setiap poin outline.
          Biasanya 10 sampai 30 detik.
        </p>
      </EmptyState>
      {pager}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Completed with a score (DESIGN.md §11, reordered in V.7): summary, score,
// the one thing to focus on next, points beside the annotated transcript,
// follow-ups, then the folded notes and comparison. "Jelaskan lagi" sticks
// to the bottom of a phone screen instead of waiting ten screens down.
// ---------------------------------------------------------------------------
export interface CompletedProps {
  challengeId: string;
  challengeTitle: string;
  attemptNumber: number;
  previous: { score: number; attemptNumber: number } | null;
  history: { attemptNumber: number; score: number | null }[];
  overallScore: number;
  maxScore: number;
  subScores: { comprehensiveness: number; accuracy: number; clarity: number };
  coverage: CoverageRow[];
  comparison: { previousAttemptNumber: number; result: Comparison } | null;
  unexplainedJargon: string[];
  feedback: string | null;
  strengths: string[];
  improvements: string[];
  transcript: string | null;
  audioUrl: string | null;
  followUp: ReactNode;
  neighbours?: Neighbours;
  headingRef?: Ref<HTMLHeadingElement>;
}

export function EvaluationCompletedView(props: CompletedProps) {
  const links = hrefs(props.challengeId);
  const { summary, rest } = splitSummary(props.feedback);
  const focus = nextFocus(props.improvements, props.coverage);

  return (
    <section className="page result-page">
      <header className="stack gap-2">
        <Link href={links.notebook} className="back-link text-secondary text-sm">
          <Icon icon={ArrowLeft} size={14} />
          {props.challengeTitle}
        </Link>
        <div className="result-eyebrow-row">
          <p className="result-eyebrow">Percobaan #{props.attemptNumber}</p>
          <AttemptPager
            challengeId={props.challengeId}
            {...(props.neighbours ?? NO_NEIGHBOURS)}
          />
        </div>
        <h1 ref={props.headingRef} tabIndex={-1} className="result-summary focus-target">
          {summary ?? `Hasil percobaan #${props.attemptNumber}`}
        </h1>
      </header>

      <Sheet as="section" className="result-score" aria-label="Skor">
        <div className="stack gap-3">
          <ScoreFigure
            score={props.overallScore}
            max={props.maxScore}
            previous={props.previous}
            animate
          />
          <ScoreHistory
            history={props.history}
            currentAttemptNumber={props.attemptNumber}
          />
        </div>
        <div className="stack gap-3">
          <SubScoreBars
            items={[
              { label: "Kelengkapan", value: props.subScores.comprehensiveness },
              { label: "Ketepatan", value: props.subScores.accuracy },
              { label: "Kejelasan", value: props.subScores.clarity },
            ]}
          />
          <p className="text-muted text-xs">
            Skor akhir menimbang kelengkapan 40%, ketepatan 35%, dan kejelasan 25%.
          </p>
        </div>
      </Sheet>

      {focus && (
        <section className="next-focus" aria-labelledby="focus-title">
          <h2 id="focus-title" className="next-focus-label">
            Fokus berikutnya
          </h2>
          <p className="next-focus-text">{focus}</p>
        </section>
      )}

      {props.coverage.length > 0 && (
        <ResultEvidence
          challengeId={props.challengeId}
          attemptNumber={props.attemptNumber}
          coverage={props.coverage}
          transcript={props.transcript}
          jargon={props.unexplainedJargon}
          audioUrl={props.audioUrl}
        />
      )}

      {props.followUp}

      {/* Secondary material, folded so nobody has to scroll past it (V.7). */}
      <FeedbackNotes
        rest={rest}
        strengths={props.strengths}
        improvements={props.improvements}
        jargon={props.unexplainedJargon}
      />

      {props.comparison && (
        <CoverageComparison
          challengeId={props.challengeId}
          previousAttemptNumber={props.comparison.previousAttemptNumber}
          comparison={props.comparison.result}
        />
      )}

      <div className="result-actions">
        <ButtonLink href={links.notebook} variant="secondary" size="lg" icon={BookOpen}>
          Buka catatan belajar
        </ButtonLink>
      </div>

      {/* The one next step, always within reach on a phone (V.7). */}
      <div className="sticky-cta">
        <ButtonLink href={links.record} size="lg" block icon={RotateCcw}>
          Jelaskan lagi
        </ButtonLink>
      </div>
    </section>
  );
}
