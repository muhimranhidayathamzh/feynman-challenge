"use client";

import { ArrowLeft, RotateCcw, Send, Trash2 } from "lucide-react";

import { AudioPlayer } from "@/components/ui/audio-player";
import { Button, ButtonLink } from "@/components/ui/button";
import type { RecorderStatus } from "@/hooks/use-audio-recorder";
import type { RecorderError } from "@/lib/audio/recorder";
import { MIN_RECORDING_SEC } from "@/lib/utils/constants";
import { formatClock } from "@/lib/utils/timer";
import type { HintLevel } from "@/types";

import { StageControls } from "./stage-controls";
import { StageHints, type OutlinePoint } from "./stage-hints";
import { StagePrep } from "./stage-prep";
import { StageTimer } from "./stage-timer";
import { WaveformVisualizer } from "./waveform-visualizer";

export interface StageHintsData {
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
  recorderError: RecorderError | null;
  submitError: string | null;
  preparingHints: boolean;
  hints: StageHintsData;
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

/** What to do when the browser blocks the microphone. */
const PERMISSION_HELP =
  "Buka pengaturan situs di browser (ikon gembok di samping alamat), izinkan mikrofon, lalu muat ulang halaman ini.";

/**
 * The recording stage (DESIGN.md §11): always the dark "papan tulis", one
 * thing on screen at a time — the topic, the clock, your voice as a chalk
 * line, one vermilion button. RecordingExperience owns the recorder, upload,
 * and navigation; the dev gallery renders this with fixed states.
 */
export function RecordingStage(props: RecordingStageProps) {
  const { status, review, hints } = props;
  const recording = status === "recording";
  const paused = status === "paused";
  const live = recording || paused;
  const sending = review !== null && review.phase !== "review";

  return (
    // Always the dark "papan tulis": explaining is the moment on stage.
    <main className="record-shell" data-mood="board">
      <div className="stage-bar">
        <ButtonLink
          href={`/challenge/${props.challengeId}`}
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
        >
          Batal
        </ButtonLink>
        <span className="stage-status" aria-live="polite">
          {recording && (
            <>
              <span className="record-rec-dot" aria-hidden="true" />
              Merekam
            </>
          )}
          {paused && "Dijeda"}
        </span>
      </div>

      <header className="stage-topic">
        <p className="stage-eyebrow">Jelaskan</p>
        <h1 className="stage-title">{props.title}</h1>
      </header>

      {props.recorderError && (
        <div className="alert alert-error stage-alert" role="alert">
          <p>{props.recorderError.message}</p>
          {props.recorderError.code === "permission-denied" && (
            <p className="text-sm">{PERMISSION_HELP}</p>
          )}
        </div>
      )}
      {props.submitError && (
        <div className="alert alert-error stage-alert" role="alert">
          {props.submitError}
        </div>
      )}

      {review ? (
        <section className="stage-review" aria-labelledby="review-title">
          <div className="stage-review-head">
            <h2 id="review-title" className="stage-review-title">
              Dengarkan dulu
            </h2>
            <span className="badge tabular-nums">
              {formatClock(review.durationSeconds)}
            </span>
          </div>
          {review.previewUrl && (
            <AudioPlayer src={review.previewUrl} label="Rekaman yang baru dibuat" />
          )}
          <p className="text-secondary">
            Sudah jelas dan lengkap? Kirim untuk dinilai, atau rekam ulang.
            {hints.revealed.size > 0 &&
              ` Petunjuk yang sudah dibuka tetap membatasi skor maks ke ${hints.cap}.`}
          </p>
          {review.tooShort && (
            <p className="text-warning text-sm" role="status">
              Rekaman di bawah {MIN_RECORDING_SEC} detik terlalu pendek untuk dinilai.
            </p>
          )}

          {sending ? (
            <div className="stack gap-2">
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
                  : "Menyiapkan penilaian…"}
              </span>
            </div>
          ) : (
            <div className="stage-review-actions">
              <Button
                size="lg"
                block
                icon={Send}
                onClick={props.onSubmit}
                disabled={review.tooShort}
              >
                {props.submitError ? "Kirim ulang" : "Kirim untuk dinilai"}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                block
                icon={RotateCcw}
                onClick={props.onRerecord}
              >
                Rekam ulang
              </Button>
              <Button variant="ghost" block icon={Trash2} onClick={props.onDiscard}>
                Buang rekaman ini
              </Button>
            </div>
          )}
        </section>
      ) : (
        <>
          <StageTimer
            totalSeconds={props.durationSec}
            elapsedSeconds={props.elapsedSec}
            started={live}
          />

          <WaveformVisualizer stream={props.stream} active={recording} />

          <StageControls
            status={status}
            preparing={props.preparingHints}
            onStart={props.onStart}
            onPause={props.onPause}
            onResume={props.onResume}
            onFinish={props.onFinish}
          />

          {live ? (
            <StageHints
              keywords={hints.keywords}
              questions={hints.questions}
              outline={hints.outline}
              revealed={hints.revealed}
              currentCap={hints.cap}
              onReveal={props.onReveal}
            />
          ) : (
            <StagePrep
              pointCount={hints.outline.length}
              durationSec={props.durationSec}
            />
          )}
        </>
      )}
    </main>
  );
}
