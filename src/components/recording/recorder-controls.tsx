"use client";

import type { RecorderStatus } from "@/hooks/use-audio-recorder";

interface Props {
  status: RecorderStatus;
  submitting: boolean;
  /** Blocks starting (e.g. while hints are being prepared). */
  startDisabled?: boolean;
  startLabel?: string;
  /** Blocks "Stop & Submit" (e.g. below the minimum duration). */
  submitDisabled?: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStopAndSubmit: () => void;
}

export function RecorderControls({
  status,
  submitting,
  startDisabled = false,
  startLabel = "🎙️ Mulai Rekam",
  submitDisabled = false,
  onStart,
  onPause,
  onResume,
  onStopAndSubmit,
}: Props) {
  if (submitting) {
    return (
      <div className="record-controls">
        <button type="button" className="btn btn-primary btn-lg" disabled>
          <span className="animate-spin" aria-hidden="true">
            ◌
          </span>
          Mengirim…
        </button>
      </div>
    );
  }

  if (status === "idle" || status === "stopped") {
    return (
      <div className="record-controls">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={onStart}
          disabled={startDisabled}
        >
          {startLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="record-controls">
      {status === "recording" ? (
        <button type="button" className="btn btn-secondary btn-lg" onClick={onPause}>
          ⏸️ Jeda
        </button>
      ) : (
        <button type="button" className="btn btn-secondary btn-lg" onClick={onResume}>
          ▶️ Lanjut
        </button>
      )}
      <button
        type="button"
        className="btn btn-primary btn-lg"
        onClick={onStopAndSubmit}
        disabled={submitDisabled}
      >
        ⏹️ Stop &amp; Submit
      </button>
    </div>
  );
}
