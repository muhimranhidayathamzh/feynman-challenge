"use client";

import { useEffect, useRef, useState } from "react";

import { scoreColor } from "@/lib/utils/labels";

interface Props {
  score: number;
  previousScore?: number | null;
}

const SIZE = 220;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const DURATION_MS = 1100;

export function ScoreRing({ score, previousScore = null }: Props) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(score * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [score]);

  const color = scoreColor(score);
  const offset = CIRCUMFERENCE * (1 - Math.min(1, display / 10));
  const delta = previousScore !== null ? score - previousScore : null;

  return (
    <div className="stack center" style={{ gap: "var(--space-3)" }}>
      <div style={{ position: "relative", width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--bg-tertiary)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: "var(--text-5xl)",
              fontWeight: "var(--weight-bold)",
              fontVariantNumeric: "tabular-nums",
              color,
              lineHeight: 1,
            }}
          >
            {Math.round(display)}
          </span>
          <span className="text-muted">/ 10</span>
        </div>
      </div>

      {delta !== null && (
        <span className="text-secondary text-sm">
          {delta > 0
            ? `📈 +${delta} dari sebelumnya (${previousScore}/10)`
            : delta < 0
              ? `📉 ${delta} dari sebelumnya (${previousScore}/10)`
              : `→ sama seperti sebelumnya (${previousScore}/10)`}
        </span>
      )}
    </div>
  );
}
