"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  RECORDINGS_BUCKET,
  buildRecordingPath,
  extensionForMime,
  storageContentType,
} from "@/lib/storage/recording-path";
import { createClient } from "@/lib/supabase/client";
import { MIN_RECORDING_SEC } from "@/lib/utils/constants";
import { effectiveHint } from "@/lib/utils/labels";
import type { HintLevel } from "@/types";

import type { OutlinePoint } from "./stage-hints";
import { RecordingStage } from "./recording-stage";

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

/**
 * idle -> recording/paused (recorder status) -> review -> uploading ->
 * registering -> result page. A failed send returns to review with the same
 * blob, so nothing recorded is ever lost.
 */
type Phase = "record" | "review" | "uploading" | "registering";

/**
 * A finished recording that has not been accepted by the server yet.
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
  // Revealed hints survive "Rekam ulang": once a tier is opened, the cap stays.
  const [revealed, setRevealed] = useState<ReadonlySet<HintLevel>>(new Set());
  const [phase, setPhase] = useState<Phase>("record");
  const [pending, setPending] = useState<PendingRecording | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [preparingHints, setPreparingHints] = useState(hintsMissing);
  const submitGuard = useRef(false);
  const hintsRequested = useRef(false);

  const { status, duration, stop, mimeType } = recorder;
  const hint = effectiveHint(revealed);
  const sending = phase === "uploading" || phase === "registering";
  const recording = status === "recording";
  const paused = status === "paused";

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

  // A playable URL for the pending blob; revoked when the blob changes or on unmount.
  const pendingBlob = pending?.blob ?? null;
  useEffect(() => {
    if (!pendingBlob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingBlob]);

  function handleReveal(level: HintLevel) {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.add(level);
      return next;
    });
  }

  /** Stop recording and go to review (never sends by itself). */
  const handleFinish = useCallback(async () => {
    if (pending) return;
    const blob = await stop();
    if (!blob || blob.size === 0) {
      setSubmitError("Tidak ada audio yang terekam. Coba rekam lagi.");
      return;
    }
    setSubmitError(null);
    setPending({
      blob,
      mimeType,
      durationSeconds: Math.round(duration),
      hintLevel: hint.level,
      uploadedPath: null,
    });
    setPhase("review");
  }, [pending, stop, mimeType, duration, hint.level]);

  /** Upload (if needed) + register. On failure, back to review with the same blob. */
  const submit = useCallback(
    async (item: PendingRecording) => {
      if (submitGuard.current) return;
      submitGuard.current = true;
      setSubmitError(null);
      setUploadProgress(item.uploadedPath ? 1 : 0);

      const fail = (message: string) => {
        submitGuard.current = false;
        setPhase("review");
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

  function discard() {
    // If a previous send got as far as Storage, don't leave the file behind.
    const orphan = pending?.uploadedPath;
    if (orphan) {
      void createClient()
        .storage.from(RECORDINGS_BUCKET)
        .remove([orphan])
        .catch(() => undefined);
    }
    recorder.reset();
    setPending(null);
    setPhase("record");
    setSubmitError(null);
    setUploadProgress(0);
  }

  function rerecord() {
    discard();
    void recorder.start();
  }

  // Time's up: stop and let the user review (no auto-send).
  useEffect(() => {
    if (recording && duration >= durationSec && !pending) {
      void handleFinish();
    }
  }, [recording, duration, durationSec, pending, handleFinish]);

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

  const reviewing = pending !== null && (phase === "review" || sending);

  return (
    <RecordingStage
      challengeId={challengeId}
      title={title}
      durationSec={durationSec}
      elapsedSec={duration}
      status={status}
      stream={recorder.stream}
      recorderError={recorder.error}
      submitError={submitError}
      preparingHints={preparingHints}
      hints={{ keywords, questions, outline, revealed, cap: hint.cap }}
      review={
        reviewing && pending
          ? {
              durationSeconds: pending.durationSeconds,
              previewUrl,
              phase,
              progressPct: Math.round(uploadProgress * 100),
              tooShort: pending.durationSeconds < MIN_RECORDING_SEC,
            }
          : null
      }
      onStart={() => void recorder.start()}
      onPause={recorder.pause}
      onResume={recorder.resume}
      onFinish={() => void handleFinish()}
      onReveal={handleReveal}
      onSubmit={() => {
        if (pending) void submit(pending);
      }}
      onRerecord={rerecord}
      onDiscard={discard}
    />
  );
}
