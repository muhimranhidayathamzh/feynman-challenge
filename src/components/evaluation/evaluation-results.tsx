"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  overallScore: number | null;
  subScores: { comprehensiveness: number; accuracy: number; clarity: number } | null;
  coverage: Coverage[];
  feedback: string | null;
  strengths: string[];
  improvements: string[];
  transcript: string | null;
}

export function EvaluationResults(props: Props) {
  const router = useRouter();
  const isPending = props.status === "pending" || props.status === "processing";
  const [error, setError] = useState<string | null>(
    props.status === "error" ? "Evaluasi sebelumnya gagal." : null,
  );
  const triggered = useRef(false);

  const runEvaluation = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: props.attemptId }),
      });
      const data: { error?: string } = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Evaluasi gagal. Coba lagi.");
        return;
      }
      router.refresh();
    } catch {
      setError("Kesalahan jaringan. Coba lagi.");
    }
  }, [props.attemptId, router]);

  useEffect(() => {
    if (isPending && !triggered.current) {
      triggered.current = true;
      void runEvaluation();
    }
  }, [isPending, runEvaluation]);

  function retry() {
    triggered.current = true;
    void runEvaluation();
  }

  // ---- Not yet completed: evaluating spinner or error ----
  if (props.status !== "completed" || props.overallScore === null || !props.subScores) {
    return (
      <section
        className="center"
        style={{ minHeight: "60vh", padding: "var(--space-4)" }}
      >
        {error ? (
          <div
            className="card stack text-center"
            style={{ gap: "var(--space-4)", maxWidth: "28rem" }}
          >
            <h2>😕 Evaluasi gagal</h2>
            <p className="text-secondary">{error}</p>
            <div className="row" style={{ justifyContent: "center", gap: "var(--space-3)" }}>
              <button type="button" className="btn btn-primary" onClick={retry}>
                Coba lagi
              </button>
              <Link
                href={`/challenge/${props.challengeId}`}
                className="btn btn-ghost"
              >
                Kembali
              </Link>
            </div>
          </div>
        ) : (
          <div
            className="glass stack center text-center animate-fade-in"
            style={{ gap: "var(--space-4)", maxWidth: "28rem", padding: "var(--space-8)" }}
          >
            <span className="animate-spin" style={{ fontSize: "2rem" }} aria-hidden="true">
              ◌
            </span>
            <h2>Menganalisis penjelasanmu…</h2>
            <p className="text-secondary">
              AI sedang mendengarkan rekaman dan menilainya berdasarkan outline.
              Biasanya butuh 10–30 detik.
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
        <Link
          href={`/challenge/${props.challengeId}`}
          className="text-secondary text-sm"
        >
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
