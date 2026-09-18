"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { UploadError, uploadRecording } from "@/lib/audio/upload";
import {
  buildRecordingPath,
  extensionForMime,
  storageContentType,
} from "@/lib/storage/recording-path";
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
}

type SubmitPhase = "idle" | "uploading" | "registering";

export function RecordingExperience({
  challengeId,
  userId,
  title,
  durationSec,
  keywords,
  questions,
  outline,
}: Props) {
  const router = useRouter();
  const recorder = useAudioRecorder();
  const [revealed, setRevealed] = useState<ReadonlySet<HintLevel>>(new Set());
  const [phase, setPhase] = useState<SubmitPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitGuard = useRef(false);

  const { status, duration, stop, mimeType } = recorder;
  const hint = effectiveHint(revealed);
  const submitting = phase !== "idle";

  function handleReveal(level: HintLevel) {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.add(level);
      return next;
    });
  }

  const handleSubmit = useCallback(async () => {
    if (submitGuard.current) return;
    submitGuard.current = true;
    setSubmitError(null);
    setUploadProgress(0);
    setPhase("uploading");

    const fail = (message: string) => {
      submitGuard.current = false;
      setPhase("idle");
      setSubmitError(message);
    };

    const blob = await stop();
    if (!blob) {
      fail("Tidak ada audio untuk dikirim. Coba rekam lagi.");
      return;
    }

    // 1. Browser -> Storage directly (RLS scopes the user to their own folder).
    const path = buildRecordingPath(userId, challengeId, extensionForMime(mimeType));
    try {
      await uploadRecording({
        blob,
        path,
        contentType: storageContentType(mimeType),
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

    // 2. Register the attempt (server verifies the object exists).
    setPhase("registering");
    try {
      const res = await fetch(`/api/challenge/${challengeId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storage_path: path,
          hint_level_used: hint.level,
          duration_seconds: Math.round(duration),
        }),
      });
      const data: { attemptId?: string; error?: string } = await res.json();
      if (!res.ok || !data.attemptId) {
        fail(data.error ?? "Gagal mengirim rekaman. Coba lagi.");
        return;
      }
      router.replace(`/challenge/${challengeId}/result/${data.attemptId}`);
    } catch {
      fail("Kesalahan jaringan. Coba lagi.");
    }
  }, [stop, mimeType, hint.level, duration, challengeId, userId, router]);

  // Auto stop & submit when the countdown runs out.
  useEffect(() => {
    if (status === "recording" && duration >= durationSec && !submitGuard.current) {
      void handleSubmit();
    }
  }, [status, duration, durationSec, handleSubmit]);

  const recording = status === "recording";
  const paused = status === "paused";

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

      <RecorderControls
        status={status}
        submitting={submitting}
        onStart={() => void recorder.start()}
        onPause={recorder.pause}
        onResume={recorder.resume}
        onStopAndSubmit={() => void handleSubmit()}
      />

      {submitting && (
        <div className="stack" style={{ width: "100%", gap: "var(--space-2)" }}>
          <div
            className="bar-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(uploadProgress * 100)}
            aria-label="Progres unggah"
          >
            <div
              className="bar-fill"
              style={{
                width: `${Math.round(uploadProgress * 100)}%`,
                background: "var(--accent-primary)",
              }}
            />
          </div>
          <span className="text-secondary text-sm" aria-live="polite">
            {phase === "uploading"
              ? `Mengunggah rekaman… ${Math.round(uploadProgress * 100)}%`
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
