"use client";

import type { ReactNode, Ref } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChartColumn,
  CircleAlert,
  Headphones,
  Hourglass,
  ListChecks,
  LoaderCircle,
  MessageSquareText,
  Mic,
  Puzzle,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

import { AudioPlayer } from "@/components/ui/audio-player";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { AUDIO_ISSUE_MESSAGES } from "@/lib/api/contracts";
import type { CoverageComparison as Comparison } from "@/lib/utils/coverage-progress";
import type { AudioIssue } from "@/types";

import { AttemptHistory } from "./attempt-history";
import { CoverageChecklist, type CoverageRow } from "./coverage-checklist";
import { CoverageComparison } from "./coverage-comparison";
import { FeedbackCard } from "./feedback-card";
import { ScoreRing } from "./score-ring";
import { SubScores } from "./sub-scores";
import { TranscriptView } from "./transcript-view";

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
  headingRef?: Ref<HTMLHeadingElement>;
}

export function EvaluationRejectedView(props: RejectedProps) {
  const links = hrefs(props.challengeId);
  return (
    <section className="state-screen">
      <Card className="state-card">
        <Icon icon={Headphones} size={40} className="state-icon" />
        <h2 ref={props.headingRef} tabIndex={-1} className="focus-target">
          Rekaman belum bisa dinilai
        </h2>
        <p className="text-secondary">{AUDIO_ISSUE_MESSAGES[props.audioIssue]}</p>
        {props.feedback && <p className="text-secondary text-sm">{props.feedback}</p>}
        <p className="text-muted text-sm">
          Percobaan ini tidak memengaruhi skor, tingkat penguasaan, maupun streak-mu.
        </p>
        {props.audioUrl && (
          <AudioPlayer src={props.audioUrl} label="Rekaman percobaan ini" />
        )}
        <div className="state-actions">
          <ButtonLink href={links.record} icon={Mic}>
            Rekam ulang
          </ButtonLink>
          <ButtonLink href={links.notebook} variant="ghost">
            Kembali
          </ButtonLink>
        </div>
      </Card>
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
}

export function EvaluationStatusView(props: StatusProps) {
  const links = hrefs(props.challengeId);
  return (
    <section className="state-screen">
      {props.view === "error" ? (
        <Card className="state-card">
          <Icon icon={CircleAlert} size={40} className="state-icon" />
          <h2>Evaluasi gagal</h2>
          <p className="text-secondary" role="alert">
            {props.error}
          </p>
          <div className="state-actions">
            <Button icon={RotateCcw} onClick={props.onRetry}>
              Coba lagi
            </Button>
            <ButtonLink href={links.notebook} variant="ghost">
              Kembali
            </ButtonLink>
          </div>
        </Card>
      ) : props.view === "stale" ? (
        <Card className="state-card">
          <Icon icon={Hourglass} size={40} className="state-icon" />
          <h2>Masih diproses</h2>
          <p className="text-secondary">
            Evaluasi memakan waktu lebih lama dari biasanya. Muat ulang untuk melihat
            status terbaru.
          </p>
          <div className="state-actions">
            <Button icon={RefreshCw} onClick={props.onReload}>
              Muat ulang
            </Button>
            <ButtonLink href={links.notebook} variant="ghost">
              Kembali
            </ButtonLink>
          </div>
        </Card>
      ) : (
        <Card
          variant="glass"
          className="state-card evaluating-card animate-fade-in"
          aria-live="polite"
          aria-busy="true"
        >
          <Icon icon={LoaderCircle} size={36} className="state-icon animate-spin" />
          <h2>Menganalisis penjelasanmu…</h2>
          <p className="text-secondary">
            AI sedang mendengarkan rekaman dan menilainya berdasarkan outline. Biasanya
            butuh 10–30 detik.
          </p>
        </Card>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Completed with a score
// ---------------------------------------------------------------------------
export interface CompletedProps {
  challengeId: string;
  challengeTitle: string;
  attemptNumber: number;
  previousScore: number | null;
  history: { attemptNumber: number; score: number | null }[];
  overallScore: number;
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
  headingRef?: Ref<HTMLHeadingElement>;
}

export function EvaluationCompletedView(props: CompletedProps) {
  const links = hrefs(props.challengeId);
  return (
    <section className="page">
      <div className="stack gap-1">
        <Link href={links.notebook} className="back-link text-secondary text-sm">
          <Icon icon={ArrowLeft} size={14} />
          {props.challengeTitle}
        </Link>
        <h1 ref={props.headingRef} tabIndex={-1} className="focus-target">
          Hasil Evaluasi{" "}
          <span className="text-secondary">· Percobaan #{props.attemptNumber}</span>
        </h1>
      </div>

      <Card className="center animate-fade-in-up">
        <ScoreRing score={props.overallScore} previousScore={props.previousScore} />
      </Card>

      <Card className="stack gap-4 animate-fade-in-up">
        <CardTitle icon={ChartColumn}>Rincian Skor</CardTitle>
        <SubScores
          comprehensiveness={props.subScores.comprehensiveness}
          accuracy={props.subScores.accuracy}
          clarity={props.subScores.clarity}
        />
      </Card>

      {props.coverage.length > 0 && (
        <Card className="stack gap-3">
          <CardTitle icon={ListChecks}>Cakupan Materi</CardTitle>
          <CoverageChecklist items={props.coverage} challengeId={props.challengeId} />
        </Card>
      )}

      {props.comparison && (
        <CoverageComparison
          challengeId={props.challengeId}
          previousAttemptNumber={props.comparison.previousAttemptNumber}
          comparison={props.comparison.result}
        />
      )}

      <Card className="stack gap-3">
        <CardTitle icon={MessageSquareText}>Umpan Balik AI</CardTitle>
        <FeedbackCard
          feedback={props.feedback ?? ""}
          strengths={props.strengths}
          improvements={props.improvements}
        />
      </Card>

      {props.unexplainedJargon.length > 0 && (
        <Card className="stack gap-3">
          <CardTitle icon={Puzzle}>Istilah yang belum kamu jelaskan</CardTitle>
          <p className="text-secondary text-sm">
            Inti Feynman Technique: jelaskan istilah ini dengan kata-kata sederhana di
            percobaan berikutnya.
          </p>
          <ul className="jargon-list">
            {props.unexplainedJargon.map((term) => (
              <li key={term} className="badge">
                {term}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {props.audioUrl && (
        <Card className="stack gap-3">
          <CardTitle icon={Headphones}>Rekamanmu</CardTitle>
          <AudioPlayer
            src={props.audioUrl}
            label={`Rekaman percobaan #${props.attemptNumber}`}
          />
        </Card>
      )}

      {props.transcript && <TranscriptView transcript={props.transcript} />}

      {props.followUp}

      <AttemptHistory
        history={props.history}
        currentAttemptNumber={props.attemptNumber}
      />

      <div className="row flex-wrap gap-3">
        <ButtonLink href={links.record} size="lg" icon={RotateCcw}>
          Coba Lagi
        </ButtonLink>
        <ButtonLink href={links.notebook} variant="secondary" size="lg" icon={BookOpen}>
          Kembali ke Catatan Belajar
        </ButtonLink>
      </div>
    </section>
  );
}
