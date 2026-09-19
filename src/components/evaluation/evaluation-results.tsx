"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  AttemptStatusResponseSchema,
  EvaluateResponseSchema,
  describeEvaluationError,
} from "@/lib/api/contracts";
import { fetchJson } from "@/lib/api/fetch-json";
import type { CoverageComparison as Comparison } from "@/lib/utils/coverage-progress";
import type { AudioIssue, EvaluationStatus } from "@/types";

import type { CoverageRow } from "./coverage-checklist";
import {
  EvaluationCompletedView,
  EvaluationRejectedView,
  EvaluationStatusView,
  type EvaluationProgress,
} from "./evaluation-views";

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
  coverage: CoverageRow[];
  /** Per-point progress against the previous scored attempt, if any. */
  comparison: { previousAttemptNumber: number; result: Comparison } | null;
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

type View = EvaluationProgress;

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

  // ---- Completed, but the audio could not be judged (no score) ----
  if (props.status === "completed" && props.audioIssue && props.audioIssue !== "none") {
    return (
      <EvaluationRejectedView
        challengeId={props.challengeId}
        audioIssue={props.audioIssue}
        feedback={props.feedback}
        audioUrl={props.audioUrl}
        headingRef={headingRef}
      />
    );
  }

  // ---- Not yet completed: evaluating / polling / stale / error ----
  if (props.status !== "completed" || props.overallScore === null || !props.subScores) {
    return (
      <EvaluationStatusView
        challengeId={props.challengeId}
        view={view}
        error={error}
        onRetry={() => void runEvaluation()}
        onReload={startPolling}
      />
    );
  }

  // ---- Completed ----
  return (
    <EvaluationCompletedView
      challengeId={props.challengeId}
      challengeTitle={props.challengeTitle}
      attemptNumber={props.attemptNumber}
      previousScore={props.previousScore}
      history={props.history}
      overallScore={props.overallScore}
      subScores={props.subScores}
      coverage={props.coverage}
      comparison={props.comparison}
      unexplainedJargon={props.unexplainedJargon}
      feedback={props.feedback}
      strengths={props.strengths}
      improvements={props.improvements}
      transcript={props.transcript}
      audioUrl={props.audioUrl}
      followUp={props.followUp}
      headingRef={headingRef}
    />
  );
}
