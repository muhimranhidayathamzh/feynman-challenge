"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  AUDIO_ISSUE_MESSAGES,
  AttemptStatusResponseSchema,
  EvaluateResponseSchema,
  describeEvaluationError,
} from "@/lib/api/contracts";
import { fetchJson } from "@/lib/api/fetch-json";
import type { AudioIssue, Coverage, EvaluationStatus } from "@/types";

import { AttemptHistory } from "./attempt-history";
import { CoverageChecklist } from "./coverage-checklist";
import { FeedbackCard } from "./feedback-card";
import { ScoreRing } from "./score-ring";
import { SubScores } from "./sub-scores";
import { TranscriptView } from "./transcript-view";

interface Props {
  challengeId: string;
  attemptId: string;
  challengeTitle: string;
  attemptNumber: number;
  previousScore: number | null;
  history: { attemptNumber: number; score: number | null }[];
  status: EvaluationStatus;
  evaluationError: string | null;
  overallScore: number | null;
  subScores: { comprehensiveness: number; accuracy: number; clarity: number } | null;
  coverage: Coverage[];
  /** Set when the audio could not be judged: the attempt has no score. */
  audioIssue: AudioIssue | null;
  unexplainedJargon: string[];
  feedback: string | null;
  strengths: string[];
  improvements: string[];
  transcript: string | null;
  /** Signed URL for the attempt's recording (null when unavailable). */
  audioUrl: string | null;
  /** "Uji Pemahamanmu" section, rendered by the server page. */
  followUp: ReactNode;
}

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_MS = 90_000;

type View = "evaluating" | "polling" | "stale" | "error";

export function EvaluationResults(props: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>(() =>
    props.status === "error"
      ? "error"
      : props.status === "processing"
        ? "polling"
        : "evaluating",
  );
  const [error, setError] = useState<string | null>(() =>
    props.status === "error" ? describeEvaluationError(props.evaluationError) : null,
  );
  const started = useRef(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartedAt = useRef(0);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  const isScored =
    props.status === "completed" &&
    props.overallScore !== null &&
    props.subScores !== null;
  const isRejected =
    props.status === "completed" &&
    props.audioIssue !== null &&
    props.audioIssue !== "none";

  // When a result (or a "could not judge" verdict) appears, move focus to its
  // heading so keyboard and screen-reader users land on the outcome.
  useEffect(() => {
    if (isScored || isRejected) headingRef.current?.focus();
  }, [isScored, isRejected]);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    pollTimer.current = null;
  }, []);

  /** Polls GET status until completed/error, or gives up after POLL_MAX_MS. */
  const startPolling = useCallback(() => {
    stopPolling();
    pollStartedAt.current = Date.now();
    setView("polling");

    const tick = async () => {
      const result = await fetchJson(
        `/api/attempt/${props.attemptId}`,
        AttemptStatusResponseSchema,
        { cache: "no-store" },
      );
      if (result.ok && result.data.evaluation_status === "completed") {
        router.refresh();
        return;
      }
      if (result.ok && result.data.evaluation_status === "error") {
        setError(describeEvaluationError(result.data.evaluation_error));
        setView("error");
        return;
      }
      if (Date.now() - pollStartedAt.current >= POLL_MAX_MS) {
        setView("stale");
        return;
      }
      pollTimer.current = setTimeout(() => void tick(), POLL_INTERVAL_MS);
    };
    pollTimer.current = setTimeout(() => void tick(), POLL_INTERVAL_MS);
  }, [props.attemptId, router, stopPolling]);

  /** Asks the server to evaluate. Only called for pending/error attempts. */
  const runEvaluation = useCallback(async () => {
    setError(null);
    setView("evaluating");
    const result = await fetchJson("/api/evaluate", EvaluateResponseSchema, {
      method: "POST",
      json: { attemptId: props.attemptId },
    });
    if (!result.ok) {
      setError(result.error);
      setView("error");
      return;
    }
    if (result.data.evaluation_status === "completed") {
      router.refresh();
      return;
    }
    // 202: another request holds the claim. Watch it instead of racing it.
    startPolling();
  }, [props.attemptId, router, startPolling]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (props.status === "pending") void runEvaluation();
    else if (props.status === "processing") startPolling();
    return stopPolling;
  }, [props.status, runEvaluation, startPolling, stopPolling]);

  const notebookHref = `/challenge/${props.challengeId}`;
  const recordHref = `/challenge/${props.challengeId}/record`;

  // ---- Completed, but the audio could not be judged (no score) ----
  if (props.status === "completed" && props.audioIssue && props.audioIssue !== "none") {
    return (
      <section className="state-screen">
        <Card className="state-card">
          <Icon icon={Headphones} size={40} className="state-icon" />
          <h2 ref={headingRef} tabIndex={-1} className="focus-target">
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
            <ButtonLink href={recordHref} icon={Mic}>
              Rekam ulang
            </ButtonLink>
            <ButtonLink href={notebookHref} variant="ghost">
              Kembali
            </ButtonLink>
          </div>
        </Card>
      </section>
    );
  }

  // ---- Not yet completed: evaluating / polling / stale / error ----
  if (props.status !== "completed" || props.overallScore === null || !props.subScores) {
    return (
      <section className="state-screen">
        {view === "error" ? (
          <Card className="state-card">
            <Icon icon={CircleAlert} size={40} className="state-icon" />
            <h2>Evaluasi gagal</h2>
            <p className="text-secondary" role="alert">
              {error}
            </p>
            <div className="state-actions">
              <Button icon={RotateCcw} onClick={() => void runEvaluation()}>
                Coba lagi
              </Button>
              <ButtonLink href={notebookHref} variant="ghost">
                Kembali
              </ButtonLink>
            </div>
          </Card>
        ) : view === "stale" ? (
          <Card className="state-card">
            <Icon icon={Hourglass} size={40} className="state-icon" />
            <h2>Masih diproses</h2>
            <p className="text-secondary">
              Evaluasi memakan waktu lebih lama dari biasanya. Muat ulang untuk melihat
              status terbaru.
            </p>
            <div className="state-actions">
              <Button icon={RefreshCw} onClick={startPolling}>
                Muat ulang
              </Button>
              <ButtonLink href={notebookHref} variant="ghost">
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

  // ---- Completed ----
  return (
    <section className="page">
      <div className="stack gap-1">
        <Link href={notebookHref} className="back-link text-secondary text-sm">
          <Icon icon={ArrowLeft} size={14} />
          {props.challengeTitle}
        </Link>
        <h1 ref={headingRef} tabIndex={-1} className="focus-target">
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
          <CoverageChecklist items={props.coverage} />
        </Card>
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
        <ButtonLink href={recordHref} size="lg" icon={RotateCcw}>
          Coba Lagi
        </ButtonLink>
        <ButtonLink href={notebookHref} variant="secondary" size="lg" icon={BookOpen}>
          Kembali ke Catatan Belajar
        </ButtonLink>
      </div>
    </section>
  );
}
