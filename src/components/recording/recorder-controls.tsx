"use client";

import { Mic, Pause, Play, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  startLabel = "Mulai Rekam",
  submitDisabled = false,
  onStart,
  onPause,
  onResume,
  onStopAndSubmit,
}: Props) {
  if (submitting) {
    return (
      <div className="record-controls">
        <Button size="lg" loading>
          Mengirim…
        </Button>
      </div>
    );
  }

  if (status === "idle" || status === "stopped") {
    return (
      <div className="record-controls">
        <Button
          size="lg"
          icon={Mic}
          onClick={onStart}
          loading={startDisabled}
          disabled={startDisabled}
        >
          {startLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className="record-controls">
      {status === "recording" ? (
        <Button variant="secondary" size="lg" icon={Pause} onClick={onPause}>
          Jeda
        </Button>
      ) : (
        <Button variant="secondary" size="lg" icon={Play} onClick={onResume}>
          Lanjut
        </Button>
      )}
      <Button size="lg" icon={Square} onClick={onStopAndSubmit} disabled={submitDisabled}>
        Stop &amp; Submit
      </Button>
    </div>
  );
}
