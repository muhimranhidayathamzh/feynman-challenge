"use client";

import { useEffect, useState } from "react";

import { scoreColor } from "@/lib/utils/labels";

interface Props {
  comprehensiveness: number;
  accuracy: number;
  clarity: number;
}

const ROWS: { key: keyof Props; label: string; weight: string }[] = [
  { key: "comprehensiveness", label: "Kelengkapan", weight: "40%" },
  { key: "accuracy", label: "Ketepatan", weight: "35%" },
  { key: "clarity", label: "Kejelasan", weight: "25%" },
];

export function SubScores(props: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="stack gap-4">
      {ROWS.map((row) => {
        const value = props[row.key];
        return (
          <div key={row.key} className="stack gap-2">
            <div className="row-between">
              <span className="text-sm">
                {row.label} <span className="text-muted">({row.weight})</span>
              </span>
              <span className="text-sm font-semibold">{value}/10</span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: mounted ? `${value * 10}%` : "0%",
                  background: scoreColor(value),
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
