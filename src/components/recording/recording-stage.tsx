"use client";

import { ArrowLeft, Mic, RotateCcw, Send, Trash2 } from "lucide-react";

import { AudioPlayer } from "@/components/ui/audio-player";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import type { RecorderStatus } from "@/hooks/use-audio-recorder";
import { MIN_RECORDING_SEC } from "@/lib/utils/constants";
import { formatClock } from "@/lib/utils/timer";
import type { HintLevel } from "@/types";

import { CountdownTimer } from "./countdown-timer";
import { HintPanel, type OutlinePoint } from "./hint-panel";
import { RecorderControls } from "./recorder-controls";
import { WaveformVisualizer } from "./waveform-visualizer";

export interface StageHints {
  keywords: string[];
  questions: string[];
  outline: OutlinePoint[];
  revealed: ReadonlySet<HintLevel>;
  /** Max score allowed by the hints revealed so far. */
  cap: number;
}

/** A finished take waiting to be sent (or being sent). */
export interface StageReview {
  durationSeconds: number;
  previewUrl: string | null;
  phase: "review" | "uploading" | "registering";
  /** 0–100 */
  progressPct: number;
  tooShort: boolean;
}

export interface RecordingStageProps {
  challengeId: string;
  title: string;
  durationSec: number;
  elapsedSec: number;
  status: RecorderStatus;
  stream: MediaStream | null;
  recorderError: string | null;
  submitError: string | null;
  preparingHints: boolean;
  hints: StageHints;
  /** Set while reviewing or sending a take; null while recording. */
  review: StageReview | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onReveal: (level: HintLevel) => void;
  onSubmit: () => void;
  onRerecord: () => void;
  onDiscard: () => void;
}

/**
 * The recording screen's markup, driven entirely by props. RecordingExperience
 * owns the recorder, upload, and navigation; the dev gallery renders this with
 * fixed states.
 */
export function RecordingStage(props: RecordingStageProps) {
  const { status, review, hints } = props;
  const recording = status === "recording";
  const paused = status === "paused";
  const sending = review !== null && review.phase !== "review";

  return (
    // Always the dark "papan tulis": explaining is the moment on stage.
    <main className="record-shell" data-mood="board">
      <div className="row-between w-full">
        <ButtonLink
          href={`/challenge/${props.challengeId}`}
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
        >
          Batal
        </ButtonLink>
        {recording && (
          <span className="row text-sm gap-2">
            <span className="record-rec-dot" aria-hidden="true" />
            Merekam…
          </span>
        )}
      </div>

      <h1 className="record-title">{props.title}</h1>

      {props.recorderError && (
        <div className="alert alert-error w-full" role="alert">
          {props.recorderError}
        </div>
      )}
      {props.submitError && (
        <div className="alert alert-error w-full" role="alert">
          {props.submitError}
        </div>
      )}

      {review ? (
        <Card as="section" className="stack gap-4 w-full" aria-labelledby="review-title">
          <div className="row-between">
            <h2 id="review-title" className="text-xl">
              Dengarkan dulu
            </h2>
            <span className="badge tabular-nums">
              {formatClock(review.durationSeconds)}
            </span>
          </div>
          {review.previewUrl && (
            <AudioPlayer src={review.previewUrl} label="Rekaman yang baru dibuat" />
          )}
          <p className="text-secondary text-sm text-left">
            Sudah jelas dan lengkap? Kirim untuk dinilai AI, atau rekam ulang.
            {hints.revealed.size > 0 &&
              ` Petunjuk yang sudah dibuka tetap membatasi skor maks ke ${hints.cap}.`}
          </p>
          {review.tooShort && (
            <p className="text-warning text-sm text-left" role="status">
              Rekaman di bawah {MIN_RECORDING_SEC} detik terlalu pendek untuk dinilai.
            </p>
          )}

          {sending ? (
            <div className="stack gap-2 w-full">
              <div
                className="bar-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={review.progressPct}
                aria-label="Progres unggah"
              >
                <div
                  className="bar-fill bar-fill-accent"
                  style={{ width: `${review.progressPct}%` }}
                />
              </div>
              <span className="text-secondary text-sm" aria-live="polite">
                {review.phase === "uploading"
                  ? `Mengunggah rekaman… ${review.progressPct}%`
                  : "Menyiapkan evaluasi…"}
              </span>
            </div>
          ) : (
            <div className="record-controls">
              <Button
                size="lg"
                icon={Send}
                onClick={props.onSubmit}
                disabled={review.tooShort}
              >
                {props.submitError ? "Kirim ulang" : "Kirim"}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon={RotateCcw}
                onClick={props.onRerecord}
              >
                Rekam ulang
              </Button>
              <Button variant="ghost" size="lg" icon={Trash2} onClick={props.onDiscard}>
                Buang
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <>
          <CountdownTimer
            totalSeconds={props.durationSec}
            elapsedSeconds={props.elapsedSec}
          />

          <WaveformVisualizer stream={props.stream} active={recording} />

          <RecorderControls
            status={status}
            submitting={false}
            startDisabled={props.preparingHints}
            startLabel={props.preparingHints ? "Menyiapkan petunjuk…" : undefined}
            onStart={props.onStart}
            onPause={props.onPause}
            onResume={props.onResume}
            onFinish={props.onFinish}
          />

          {(recording || paused) && (
            <HintPanel
              keywords={hints.keywords}
              questions={hints.questions}
              outline={hints.outline}
              revealed={hints.revealed}
              currentCap={hints.cap}
              disabled={false}
              onReveal={props.onReveal}
            />
          )}
        </>
      )}

      {!review && !recording && !paused && (
        <p className="row gap-2 text-muted text-sm">
          <Icon icon={Mic} size={14} />
          Rekaman bisa kamu dengarkan dulu sebelum dikirim.
        </p>
      )}
    </main>
  );
}
