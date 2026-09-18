"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AudioRecorder, isRecorderError, type RecorderError } from "@/lib/audio/recorder";

export type RecorderStatus = "idle" | "recording" | "paused" | "stopped";

export interface UseAudioRecorder {
  status: RecorderStatus;
  duration: number;
  audioBlob: Blob | null;
  mimeType: string;
  stream: MediaStream | null;
  error: RecorderError | null;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<Blob | null>;
  reset: () => void;
}

const TICK_MS = 200;

export function useAudioRecorder(): UseAudioRecorder {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<RecorderError | null>(null);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const accumulatedRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    startedAtRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = accumulatedRef.current + (Date.now() - startedAtRef.current) / 1000;
      setDuration(elapsed);
    }, TICK_MS);
  }, [clearTimer]);

  const accumulate = useCallback(() => {
    accumulatedRef.current += (Date.now() - startedAtRef.current) / 1000;
    setDuration(accumulatedRef.current);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setDuration(0);
    accumulatedRef.current = 0;

    const recorder = new AudioRecorder();
    recorderRef.current = recorder;

    try {
      await recorder.start();
      setStatus("recording");
      startTimer();
    } catch (caught) {
      recorder.dispose();
      recorderRef.current = null;
      setStatus("idle");
      setError(
        isRecorderError(caught)
          ? caught
          : { code: "unknown", message: "Gagal memulai rekaman. Coba lagi." },
      );
    }
  }, [startTimer]);

  const pause = useCallback(() => {
    if (!recorderRef.current || status !== "recording") return;
    recorderRef.current.pause();
    clearTimer();
    accumulate();
    setStatus("paused");
  }, [status, clearTimer, accumulate]);

  const resume = useCallback(() => {
    if (!recorderRef.current || status !== "paused") return;
    recorderRef.current.resume();
    startTimer();
    setStatus("recording");
  }, [status, startTimer]);

  const stop = useCallback(async (): Promise<Blob | null> => {
    const recorder = recorderRef.current;
    if (!recorder || (status !== "recording" && status !== "paused")) {
      return null;
    }

    clearTimer();
    if (status === "recording") {
      accumulate();
    }

    try {
      const blob = await recorder.stop();
      setAudioBlob(blob);
      setStatus("stopped");
      return blob;
    } catch (caught) {
      setError(
        isRecorderError(caught)
          ? caught
          : { code: "unknown", message: "Gagal menghentikan rekaman." },
      );
      setStatus("idle");
      return null;
    }
  }, [status, clearTimer, accumulate]);

  const reset = useCallback(() => {
    clearTimer();
    recorderRef.current?.dispose();
    recorderRef.current = null;
    accumulatedRef.current = 0;
    setStatus("idle");
    setDuration(0);
    setAudioBlob(null);
    setError(null);
  }, [clearTimer]);

  // Cleanup on unmount: stop timer + release the microphone.
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      recorderRef.current?.dispose();
      recorderRef.current = null;
    };
  }, []);

  return {
    status,
    duration,
    audioBlob,
    mimeType: recorderRef.current?.mimeType ?? "",
    stream: recorderRef.current?.getStream() ?? null,
    error,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}
