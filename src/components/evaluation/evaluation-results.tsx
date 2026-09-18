"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AttemptStatusResponseSchema,
  EvaluateResponseSchema,
  describeEvaluationError,
} from "@/lib/api/contracts";
import { fetchJson } from "@/lib/api/fetch-json";
import type { Coverage, EvaluationStatus } from "@/types";

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
  feedback: string | null;
  strengths: string[];
  improvements: string[];
  transcript: string | null;
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

  // ---- Not yet completed: evaluating / polling / stale / error ----
  if (props.status !== "completed" || props.overallScore === null || !props.subScores) {
    return (
      <section
        className="center"
        style={{ minHeight: "60vh", padding: "var(--space-4)" }}
      >
        {view === "error" ? (
          <div
            className="card stack text-center"
            style={{ gap: "var(--space-4)", maxWidth: "28rem" }}
          >
            <h2>😕 Evaluasi gagal</h2>
            <p className="text-secondary">{error}</p>
            <div
              className="row"
              style={{ justifyContent: "center", gap: "var(--space-3)" }}
            >
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void runEvaluation()}
              >
                Coba lagi
              </button>
              <Link href={`/challenge/${props.challengeId}`} className="btn btn-ghost">
                Kembali
              </Link>
            </div>
          </div>
        ) : view === "stale" ? (
          <div
            className="card stack text-center"
            style={{ gap: "var(--space-4)", maxWidth: "28rem" }}
          >
            <h2>⏳ Masih diproses</h2>
            <p className="text-secondary">
              Evaluasi memakan waktu lebih lama dari biasanya. Muat ulang untuk melihat
              status terbaru.
            </p>
            <div
              className="row"
              style={{ justifyContent: "center", gap: "var(--space-3)" }}
            >
              <button type="button" className="btn btn-primary" onClick={startPolling}>
                Muat ulang
              </button>
              <Link href={`/challenge/${props.challengeId}`} className="btn btn-ghost">
                Kembali
              </Link>
            </div>
          </div>
        ) : (
          <div
            className="glass stack center text-center animate-fade-in"
            style={{
              gap: "var(--space-4)",
              maxWidth: "28rem",
              padding: "var(--space-8)",
            }}
            aria-live="polite"
            aria-busy="true"
          >
            <span
              className="animate-spin"
              style={{ fontSize: "2rem" }}
              aria-hidden="true"
            >
              ◌
            </span>
            <h2>Menganalisis penjelasanmu…</h2>
            <p className="text-secondary">
              AI sedang mendengarkan rekaman dan menilainya berdasarkan outline. Biasanya
              butuh 10–30 detik.
            </p>
          </div>
        )}
      </section>
    );
  }

  // ---- Completed ----
  return (
    <section
      className="stack"
      style={{ gap: "var(--space-6)", maxWidth: "44rem", marginInline: "auto" }}
    >
      <div className="stack" style={{ gap: "var(--space-1)" }}>
        <Link href={`/challenge/${props.challengeId}`} className="text-secondary text-sm">
          ← {props.challengeTitle}
        </Link>
        <h1>
          Hasil Evaluasi{" "}
          <span className="text-secondary">· Attempt #{props.attemptNumber}</span>
        </h1>
      </div>

      <div className="card center animate-fade-in-up">
        <ScoreRing score={props.overallScore} previousScore={props.previousScore} />
      </div>

      <div className="card stack animate-fade-in-up" style={{ gap: "var(--space-4)" }}>
        <h3>Rincian Skor</h3>
        <SubScores
          comprehensiveness={props.subScores.comprehensiveness}
          accuracy={props.subScores.accuracy}
          clarity={props.subScores.clarity}
        />
      </div>

      {props.coverage.length > 0 && (
        <div className="card stack" style={{ gap: "var(--space-3)" }}>
          <h3>📋 Coverage Analysis</h3>
          <CoverageChecklist items={props.coverage} />
        </div>
      )}

      <div className="card stack" style={{ gap: "var(--space-3)" }}>
        <h3>📝 Feedback AI</h3>
        <FeedbackCard
          feedback={props.feedback ?? ""}
          strengths={props.strengths}
          improvements={props.improvements}
        />
      </div>

      {props.transcript && <TranscriptView transcript={props.transcript} />}

      <AttemptHistory
        history={props.history}
        currentAttemptNumber={props.attemptNumber}
      />

      <div className="row" style={{ gap: "var(--space-3)", flexWrap: "wrap" }}>
        <Link
          href={`/challenge/${props.challengeId}/record`}
          className="btn btn-primary btn-lg"
        >
          🔄 Coba Lagi
        </Link>
        <Link
          href={`/challenge/${props.challengeId}`}
          className="btn btn-secondary btn-lg"
        >
          📓 Kembali ke Notebook
        </Link>
      </div>
    </section>
  );
}
