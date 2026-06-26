"use client";

import { useEffect, useRef } from "react";

interface Props {
  stream: MediaStream | null;
  active: boolean;
}

export function WaveformVisualizer({ stream, active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !stream) return;

    const AudioCtx: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const audioCtx = new AudioCtx();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser); // not connected to destination -> no echo

    const buffer = new Uint8Array(analyser.frequencyBinCount);
    const canvasCtx = canvas.getContext("2d");

    const styles = getComputedStyle(canvas);
    const accent =
      styles.getPropertyValue("--accent-primary").trim() || "hsl(250,85%,65%)";
    const muted =
      styles.getPropertyValue("--text-muted").trim() || "hsl(220,10%,45%)";

    let raf = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!canvasCtx) return;

      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (canvas.width !== Math.floor(cssW * dpr)) {
        canvas.width = Math.floor(cssW * dpr);
        canvas.height = Math.floor(cssH * dpr);
      }
      canvasCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvasCtx.clearRect(0, 0, cssW, cssH);
      canvasCtx.lineWidth = 2;

      if (!activeRef.current) {
        canvasCtx.strokeStyle = muted;
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, cssH / 2);
        canvasCtx.lineTo(cssW, cssH / 2);
        canvasCtx.stroke();
        return;
      }

      analyser.getByteTimeDomainData(buffer);
      canvasCtx.strokeStyle = accent;
      canvasCtx.beginPath();
      const slice = cssW / buffer.length;
      let x = 0;
      for (let i = 0; i < buffer.length; i += 1) {
        const v = (buffer[i] ?? 128) / 128; // 0..2, centered at 1
        const y = (v * cssH) / 2;
        if (i === 0) canvasCtx.moveTo(x, y);
        else canvasCtx.lineTo(x, y);
        x += slice;
      }
      canvasCtx.stroke();
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      source.disconnect();
      void audioCtx.close();
    };
  }, [stream]);

  return <canvas ref={canvasRef} className="record-canvas" aria-hidden="true" />;
}
