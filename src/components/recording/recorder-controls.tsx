"use client";

import type { RecorderStatus } from "@/hooks/use-audio-recorder";

interface Props {
  status: RecorderStatus;
  submitting: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStopAndSubmit: () => void;
}

export function RecorderControls({
  status,
  submitting,
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
        <button type="button" className="btn btn-primary btn-lg" onClick={onStart}>
          🎙️ Mulai Rekam
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
      <button type="button" className="btn btn-primary btn-lg" onClick={onStopAndSubmit}>
        ⏹️ Stop &amp; Submit
      </button>
    </div>
  );
}
