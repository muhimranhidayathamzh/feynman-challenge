"use client";

import { useEffect, useState } from "react";
import { Mic, RotateCcw, Send, Square, X } from "lucide-react";

import { AudioPlayer } from "@/components/ui/audio-player";
import { Button } from "@/components/ui/button";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import {
  FollowupResponseSchema,
  type FollowupAnswer,
  type FollowupRequest,
} from "@/lib/api/contracts";
import { fetchJson } from "@/lib/api/fetch-json";
import { UploadError, uploadRecording } from "@/lib/audio/upload";
import {
  buildFollowupPath,
  extensionForMime,
  storageContentType,
} from "@/lib/storage/recording-path";
import { formatClock } from "@/lib/utils/timer";

/** Follow-up answers are short on purpose. */
export const FOLLOWUP_MAX_SEC = 90;
const FOLLOWUP_MIN_SEC = 3;

interface Props {
  attemptId: string;
  challengeId: string;
  userId: string;
  questionIndex: number;
  onAnswered: (answer: FollowupAnswer) => void;
  onCancel: () => void;
}

interface Take {
  blob: Blob;
  mimeType: string;
  seconds: number;
}

/** Record → listen → send, for one follow-up question. */
export function FollowUpRecorder({
  attemptId,
  challengeId,
  userId,
  questionIndex,
  onAnswered,
  onCancel,
}: Props) {
  const recorder = useAudioRecorder();
  const { status, duration, stop, mimeType } = recorder;
  const [take, setTake] = useState<Take | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recording = status === "recording" || status === "paused";

  const takeBlob = take?.blob ?? null;
  useEffect(() => {
    if (!takeBlob) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(takeBlob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [takeBlob]);

  async function finish() {
    const blob = await stop();
    if (!blob || blob.size === 0) {
      setError("Tidak ada audio yang terekam. Coba lagi.");
      return;
    }
    setTake({ blob, mimeType, seconds: Math.round(duration) });
  }

  // Hard stop at the time limit.
  useEffect(() => {
    if (status === "recording" && duration >= FOLLOWUP_MAX_SEC) void finish();
    // finish is stable enough for this guard; re-running on duration is the point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, duration]);

  function redo() {
    recorder.reset();
    setTake(null);
    setError(null);
    void recorder.start();
  }

  async function send() {
    if (!take) return;
    setSending(true);
    setError(null);
    const path = buildFollowupPath(userId, challengeId, extensionForMime(take.mimeType));
    try {
      await uploadRecording({
        blob: take.blob,
        path,
        contentType: storageContentType(take.mimeType),
      });
    } catch (caught) {
      setSending(false);
      setError(
        caught instanceof UploadError ? caught.message : "Gagal mengunggah jawaban.",
      );
      return;
    }
    const body: FollowupRequest = {
      question_index: questionIndex,
      storage_path: path,
      duration_seconds: Math.max(FOLLOWUP_MIN_SEC, Math.min(120, take.seconds)),
    };
    const result = await fetchJson(
      `/api/attempt/${attemptId}/followup`,
      FollowupResponseSchema,
      { method: "POST", json: body },
    );
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onAnswered(result.data.answer);
  }

  return (
    <div className="followup-recorder stack gap-3">
      {(error || recorder.error) && (
        <div className="alert alert-error" role="alert">
          {error ?? recorder.error?.message}
        </div>
      )}

      {take ? (
        <>
          {url && <AudioPlayer src={url} label="Jawaban yang baru direkam" />}
          <div className="row flex-wrap gap-2">
            <Button
              icon={Send}
              onClick={() => void send()}
              loading={sending}
              disabled={take.seconds < FOLLOWUP_MIN_SEC}
            >
              {sending ? "Menilai…" : "Kirim jawaban"}
            </Button>
            <Button
              variant="secondary"
              icon={RotateCcw}
              onClick={redo}
              disabled={sending}
            >
              Rekam ulang
            </Button>
            <Button variant="ghost" icon={X} onClick={onCancel} disabled={sending}>
              Batal
            </Button>
          </div>
        </>
      ) : recording ? (
        <div className="row flex-wrap gap-3 items-center">
          <span className="row gap-2 text-sm" aria-live="polite">
            <span className="record-rec-dot" aria-hidden="true" />
            <span className="tabular-nums">
              {formatClock(duration)} / {formatClock(FOLLOWUP_MAX_SEC)}
            </span>
          </span>
          <Button icon={Square} onClick={() => void finish()}>
            Selesai
          </Button>
        </div>
      ) : (
        <div className="row flex-wrap gap-2">
          <Button icon={Mic} onClick={() => void recorder.start()}>
            Mulai rekam jawaban
          </Button>
          <Button variant="ghost" icon={X} onClick={onCancel}>
            Batal
          </Button>
          <span className="text-muted text-sm">Maksimal {FOLLOWUP_MAX_SEC} detik.</span>
        </div>
      )}
    </div>
  );
}
