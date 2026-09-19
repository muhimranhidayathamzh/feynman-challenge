"use client";

import { useEffect, useState } from "react";

interface Props {
  value: number;
  durationMs?: number;
}

/**
 * Counts up to `value` once (DESIGN.md §8, max 600 ms). Shows the final value
 * immediately when the user prefers reduced motion. The animated digits are
 * hidden from screen readers; the final value is announced once.
 */
export function CountUp({ value, durationMs = 600 }: Props) {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    setShown(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return (
    <>
      <span aria-hidden="true">{shown}</span>
      <span className="visually-hidden">{value}</span>
    </>
  );
}
