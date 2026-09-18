"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import {
  AttemptCreateResponseSchema,
  HintsResponseSchema,
  type AttemptCreateRequest,
} from "@/lib/api/contracts";
import { fetchJson } from "@/lib/api/fetch-json";
import { UploadError, uploadRecording } from "@/lib/audio/upload";
import {
  buildRecordingPath,
  extensionForMime,
  storageContentType,
} from "@/lib/storage/recording-path";
import { MIN_RECORDING_SEC } from "@/lib/utils/constants";
import { effectiveHint } from "@/lib/utils/labels";
import type { HintLevel } from "@/types";

import { CountdownTimer } from "./countdown-timer";
import { HintPanel, type OutlinePoint } from "./hint-panel";
import { RecorderControls } from "./recorder-controls";
import { WaveformVisualizer } from "./waveform-visualizer";

interface Props {
  challengeId: string;
  userId: string;
  title: string;
  durationSec: number;
  keywords: string[];
  questions: string[];
  outline: OutlinePoint[];
  /** Some outline points have no AI hints yet: generate them before recording. */
  hintsMissing: boolean;
}

/** Don't hold the start button hostage if hint generation is slow. */
const HINTS_WAIT_MAX_MS = 12_000;

type SubmitPhase = "idle" | "uploading" | "registering" | "failed";

/**
 * A finished recording that has not been accepted by the server yet. Kept in
 * memory so a failed upload/registration can be retried without re-recording.
 * `uploadedPath` is set once Storage has the file, so a retry skips the upload.
 */
interface PendingRecording {
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
  hintLevel: HintLevel;
  uploadedPath: string | null;
}

export function RecordingExperience({
  challengeId,
  userId,
  title,
  durationSec,
  keywords,
  questions,
  outline,
  hintsMissing,
}: Props) {
  const router = useRouter();
  const recorder = useAudioRecorder();
  const [revealed, setRevealed] = useState<ReadonlySet<HintLevel>>(new Set());
  const [phase, setPhase] = useState<SubmitPhase>("idle");
  const [pending, setPending] = useState<PendingRecording | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [preparingHints, setPreparingHints] = useState(hintsMissing);
  const submitGuard = useRef(false);
  const hintsRequested = useRef(false);

  const { status, duration, stop, mimeType } = recorder;
  const hint = effectiveHint(revealed);
  const submitting = phase === "uploading" || phase === "registering";
  const recording = status === "recording";
  const paused = status === "paused";
  const tooShort = duration < MIN_RECORDING_SEC;

  // Fill in missing AI hints once, before the user starts. On success the
  // server re-renders the page with the new hints; on failure the fallback
  // hints computed on the server are used.
  useEffect(() => {
    if (!hintsMissing || hintsRequested.current) return;
    hintsRequested.current = true;
    const giveUp = setTimeout(() => setPreparingHints(false), HINTS_WAIT_MAX_MS);
    void (async () => {
      const result = await fetchJson(
        `/api/challenge/${challengeId}/hints`,
        HintsResponseSchema,
        { method: "POST" },
      );
      if (result.ok && result.data.updated > 0) router.refresh();
      clearTimeout(giveUp);
      setPreparingHints(false);
    })();
    return () => clearTimeout(giveUp);
  }, [hintsMissing, challengeId, router]);

  function handleReveal(level: HintLevel) {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.add(level);
      return next;
    });
  }

  /** Upload (if needed) + register. Never throws; leaves `pending` intact on failure. */
  const submit = useCallback(
    async (item: PendingRecording) => {
      if (submitGuard.current) return;
      submitGuard.current = true;
      setSubmitError(null);
      setUploadProgress(item.uploadedPath ? 1 : 0);

      const fail = (message: string) => {
        submitGuard.current = false;
        setPhase("failed");
        setSubmitError(message);
      };

      // 1. Browser -> Storage directly (skipped when a previous try got this far).
      let path = item.uploadedPath;
      if (!path) {
        setPhase("uploading");
        const candidate = buildRecordingPath(
          userId,
          challengeId,
          extensionForMime(item.mimeType),
        );
        try {
          await uploadRecording({
            blob: item.blob,
            path: candidate,
            contentType: storageContentType(item.mimeType),
            onProgress: setUploadProgress,
          });
        } catch (error) {
          fail(
            error instanceof UploadError
              ? error.message
              : "Gagal mengunggah rekaman. Coba lagi.",
          );
          return;
        }
        path = candidate;
        setPending({ ...item, uploadedPath: path });
      }

      // 2. Register the attempt (server verifies the object exists).
      setPhase("registering");
      const body: AttemptCreateRequest = {
        storage_path: path,
        hint_level_used: item.hintLevel,
        duration_seconds: item.durationSeconds,
      };
      const result = await fetchJson(
        `/api/challenge/${challengeId}/attempt`,
        AttemptCreateResponseSchema,
        { method: "POST", json: body },
      );
      if (!result.ok) {
        fail(result.error);
        return;
      }
      setPending(null);
      router.replace(`/challenge/${challengeId}/result/${result.data.attemptId}`);
    },
    [challengeId, userId, router],
  );

  const handleStopAndSubmit = useCallback(async () => {
    if (submitGuard.current || pending) return;
    const blob = await stop();
    if (!blob) {
      setSubmitError("Tidak ada audio untuk dikirim. Coba rekam lagi.");
      return;
    }
    const item: PendingRecording = {
      blob,
      mimeType,
      durationSeconds: Math.round(duration),
      hintLevel: hint.level,
      uploadedPath: null,
    };
    setPending(item);
    await submit(item);
  }, [pending, stop, mimeType, duration, hint.level, submit]);

  function handleResend() {
    if (pending) void submit(pending);
  }

  function handleRerecord() {
    recorder.reset();
    setPending(null);
    setPhase("idle");
    setSubmitError(null);
    setUploadProgress(0);
  }

  // Auto stop & submit when the countdown runs out.
  useEffect(() => {
    if (recording && duration >= durationSec && !submitGuard.current && !pending) {
      void handleStopAndSubmit();
    }
  }, [recording, duration, durationSec, pending, handleStopAndSubmit]);

  // Warn before leaving while a recording is in progress or not yet sent.
  const mustWarn = recording || paused || pending !== null;
  useEffect(() => {
    if (!mustWarn) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [mustWarn]);

  const progressPct = Math.round(uploadProgress * 100);

  return (
    <main className="record-shell">
      <div className="row-between" style={{ width: "100%" }}>
        <Link href={`/challenge/${challengeId}`} className="btn btn-ghost btn-sm">
          ← Batal
        </Link>
        {recording && (
          <span className="row text-sm" style={{ gap: "var(--space-2)" }}>
            <span className="record-rec-dot" aria-hidden="true" />
            Merekam…
          </span>
        )}
      </div>

      <h1 className="record-title">{title}</h1>

      <CountdownTimer totalSeconds={durationSec} elapsedSeconds={duration} />

      <WaveformVisualizer stream={recorder.stream} active={recording} />

      {recorder.error && (
        <div className="alert alert-error" role="alert" style={{ width: "100%" }}>
          {recorder.error.message}
        </div>
      )}
      {submitError && (
        <div className="alert alert-error" role="alert" style={{ width: "100%" }}>
          {submitError}
        </div>
      )}

      {phase === "failed" && pending ? (
        <div className="stack" style={{ width: "100%", gap: "var(--space-3)" }}>
          <p className="text-secondary text-sm">
            Rekamanmu ({pending.durationSeconds} detik) masih tersimpan di perangkat ini.
          </p>
          <div className="record-controls">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleResend}
            >
              🔁 Kirim ulang
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={handleRerecord}
            >
              🎙️ Rekam ulang
            </button>
          </div>
        </div>
      ) : (
        <>
          <RecorderControls
            status={status}
            submitting={submitting}
            startDisabled={preparingHints}
            startLabel={preparingHints ? "Menyiapkan hint…" : undefined}
            submitDisabled={tooShort}
            onStart={() => void recorder.start()}
            onPause={recorder.pause}
            onResume={recorder.resume}
            onStopAndSubmit={() => void handleStopAndSubmit()}
          />
          {(recording || paused) && tooShort && (
            <p className="text-muted text-sm" aria-live="polite">
              Rekam minimal {MIN_RECORDING_SEC} detik sebelum mengirim.
            </p>
          )}
        </>
      )}

      {submitting && (
        <div className="stack" style={{ width: "100%", gap: "var(--space-2)" }}>
          <div
            className="bar-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPct}
            aria-label="Progres unggah"
          >
            <div
              className="bar-fill"
              style={{ width: `${progressPct}%`, background: "var(--accent-primary)" }}
            />
          </div>
          <span className="text-secondary text-sm" aria-live="polite">
            {phase === "uploading"
              ? `Mengunggah rekaman… ${progressPct}%`
              : "Menyiapkan evaluasi…"}
          </span>
        </div>
      )}

      {(recording || paused) && (
        <HintPanel
          keywords={keywords}
          questions={questions}
          outline={outline}
          revealed={revealed}
          currentCap={hint.cap}
          disabled={submitting}
          onReveal={handleReveal}
        />
      )}
    </main>
  );
}
