"use client";

import { LoaderCircle, Mic, Pause, Play, Square } from "lucide-react";

import { Icon } from "@/components/ui/icon";
import type { RecorderStatus } from "@/hooks/use-audio-recorder";

interface Props {
  status: RecorderStatus;
  /** Blocks starting (e.g. while hints are being prepared). */
  preparing: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  /** Stops recording and moves to review (it never sends by itself). */
  onFinish: () => void;
}

/**
 * One big vermilion button, the only accent on the stage: record, then stop.
 * Pause and resume sit beside it as quiet text buttons.
 */
export function StageControls({
  status,
  preparing,
  onStart,
  onPause,
  onResume,
  onFinish,
}: Props) {
  const live = status === "recording" || status === "paused";

  if (!live) {
    return (
      <div className="stage-controls">
        <button
          type="button"
          className="rec-button"
          onClick={onStart}
          disabled={preparing}
          aria-busy={preparing || undefined}
          aria-label={preparing ? "Menyiapkan petunjuk" : "Mulai merekam"}
        >
          <Icon
            icon={preparing ? LoaderCircle : Mic}
            size={30}
            className={preparing ? "animate-spin" : undefined}
          />
        </button>
        <p className="rec-button-label" aria-hidden="true">
          {preparing ? "Menyiapkan petunjuk…" : "Mulai menjelaskan"}
        </p>
      </div>
    );
  }

  return (
    <div className="stage-controls">
      <div className="stage-controls-row">
        {status === "recording" ? (
          <button type="button" className="stage-side-button" onClick={onPause}>
            <Icon icon={Pause} size={18} />
            Jeda
          </button>
        ) : (
          <button type="button" className="stage-side-button" onClick={onResume}>
            <Icon icon={Play} size={18} />
            Lanjut
          </button>
        )}
        <button type="button" className="rec-button" data-live onClick={onFinish}>
          <Icon icon={Square} size={26} />
          <span className="visually-hidden">Selesai</span>
        </button>
        <span className="stage-side-button stage-side-spacer" aria-hidden="true" />
      </div>
      <p className="rec-button-label" aria-hidden="true">
        {status === "recording" ? "Selesai" : "Dijeda. Lanjutkan kapan saja."}
      </p>
    </div>
  );
}
