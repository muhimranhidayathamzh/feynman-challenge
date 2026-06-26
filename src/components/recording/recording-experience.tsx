"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { effectiveHint } from "@/lib/utils/labels";
import type { HintLevel } from "@/types";

import { CountdownTimer } from "./countdown-timer";
import { HintPanel, type OutlinePoint } from "./hint-panel";
import { RecorderControls } from "./recorder-controls";
import { WaveformVisualizer } from "./waveform-visualizer";

interface Props {
  challengeId: string;
  title: string;
  durationSec: number;
  keywords: string[];
  questions: string[];
  outline: OutlinePoint[];
}

export function RecordingExperience({
  challengeId,
  title,
  durationSec,
  keywords,
  questions,
  outline,
}: Props) {
  const router = useRouter();
  const recorder = useAudioRecorder();
  const [revealed, setRevealed] = useState<ReadonlySet<HintLevel>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitGuard = useRef(false);

  const { status, duration, stop, mimeType } = recorder;
  const hint = effectiveHint(revealed);

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
    setSubmitting(true);
    setSubmitError(null);

    const blob = await stop();
    if (!blob) {
      submitGuard.current = false;
      setSubmitting(false);
      setSubmitError("Tidak ada audio untuk dikirim. Coba rekam lagi.");
      return;
    }

    const ext = mimeType.includes("mp4") ? "mp4" : "webm";
    const form = new FormData();
    form.append("audio", blob, `recording.${ext}`);
    form.append("hint_level_used", hint.level);
    form.append("duration_seconds", String(Math.round(duration)));

    try {
      const res = await fetch(`/api/challenge/${challengeId}/attempt`, {
        method: "POST",
        body: form,
      });
      const data: { attemptId?: string; error?: string } = await res.json();
      if (!res.ok || !data.attemptId) {
        submitGuard.current = false;
        setSubmitting(false);
        setSubmitError(data.error ?? "Gagal mengirim rekaman. Coba lagi.");
        return;
      }
      router.replace(`/challenge/${challengeId}/result/${data.attemptId}`);
    } catch {
      submitGuard.current = false;
      setSubmitting(false);
      setSubmitError("Kesalahan jaringan. Coba lagi.");
    }
  }, [stop, mimeType, hint.level, duration, challengeId, router]);

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
