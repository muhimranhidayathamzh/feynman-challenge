import type { ReactNode } from "react";

import { cx } from "@/lib/utils/cx";

export type IllustrationName =
  "meja-kosong" | "catatan-kosong" | "offline" | "error" | "mendengarkan" | "hening";

interface Props {
  name: IllustrationName;
  className?: string;
}

/**
 * Line illustrations (DESIGN.md §7, decision DV7): single-weight ink strokes
 * like a quick blackboard sketch, with one vermilion element (the wave from
 * the brand mark). Decorative: the text next to them carries the meaning.
 */
export function Illustration({ name, className }: Props) {
  return (
    <svg
      viewBox="0 0 160 120"
      width="160"
      height="120"
      className={cx("illustration", className)}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {DRAWINGS[name]}
    </svg>
  );
}

const WAVE = "var(--accent)";

const DRAWINGS: Record<IllustrationName, ReactNode> = {
  // An open notebook with a wave rising from its spine: ready to explain.
  "meja-kosong": (
    <>
      <path d="M14 98 H146" strokeWidth="2" opacity="0.5" />
      <path d="M80 92 Q56 82 26 88 V44 Q56 38 80 48 Z" fill="var(--surface)" />
      <path d="M80 92 Q104 82 134 88 V44 Q104 38 80 48 Z" fill="var(--surface)" />
      <path
        d="M38 58 Q52 55 68 60 M38 68 Q52 65 68 70 M38 78 Q50 75 60 79"
        strokeWidth="2"
        opacity="0.6"
      />
      <path
        d="M92 60 Q108 55 122 58 M92 70 Q106 65 122 68"
        strokeWidth="2"
        opacity="0.6"
      />
      <path
        d="M80 44 q-5 -3 0 -6 q5 -3 0 -6 q-5 -3 0 -6 q5 -3 0 -6"
        stroke={WAVE}
        strokeWidth="3"
      />
    </>
  ),
  // A blank ruled page and a pencil waiting.
  "catatan-kosong": (
    <>
      <rect x="40" y="16" width="70" height="88" rx="6" fill="var(--surface)" />
      <path
        d="M52 38 H98 M52 52 H98 M52 66 H98 M52 80 H84"
        strokeWidth="2"
        strokeDasharray="2 6"
        opacity="0.6"
      />
      <path d="M104 96 L132 60 L140 66 L112 102 L102 104 Z" fill="var(--surface)" />
      <path d="M128 65 L136 71" strokeWidth="2" />
      <path d="M102 104 L104 96 L112 102 Z" fill={WAVE} stroke={WAVE} strokeWidth="1.5" />
    </>
  ),
  // A blackboard whose diagram lost its wave halfway: no signal.
  offline: (
    <>
      <rect x="24" y="18" width="112" height="70" rx="5" fill="var(--surface)" />
      <path d="M50 88 L44 108 M110 88 L116 108" />
      <path d="M58 74 L80 58 L102 74" />
      <circle cx="80" cy="58" r="2.5" fill="currentColor" />
      <path d="M80 56 q-5 -3 0 -6 q5 -3 0 -6" stroke={WAVE} strokeWidth="3" />
      <path d="M80 38 q-5 -3 0 -6" stroke={WAVE} strokeWidth="3" strokeDasharray="1 5" />
      <path d="M112 30 L120 38 M120 30 L112 38" strokeWidth="2" />
    </>
  ),
  // A voice travelling into an open notebook: the AI is listening and noting.
  mendengarkan: (
    <>
      <path d="M14 98 H146" strokeWidth="2" opacity="0.5" />
      <path
        d="M16 56 q4 -6 8 0 q4 6 8 0 q4 -6 8 0 q4 6 8 0"
        stroke={WAVE}
        strokeWidth="3"
      />
      <path d="M100 92 Q82 84 60 88 V48 Q82 42 100 50 Z" fill="var(--surface)" />
      <path d="M100 92 Q118 84 140 88 V48 Q118 42 100 50 Z" fill="var(--surface)" />
      <path
        d="M70 60 H90 M70 70 H86 M110 62 H130 M110 72 H124"
        strokeWidth="2"
        strokeDasharray="2 5"
        opacity="0.7"
      />
    </>
  ),
  // A voice that fades into a flat line: nothing to hear.
  hening: (
    <>
      <path d="M14 98 H146" strokeWidth="2" opacity="0.5" />
      <path d="M22 60 q5 -12 10 0 q5 12 10 0 q4 -6 8 0" stroke={WAVE} strokeWidth="3" />
      <path d="M50 60 H138" strokeDasharray="1 7" />
      <path d="M96 36 h4 M108 36 h4 M120 36 h4" strokeWidth="3" />
    </>
  ),
  // A line that got tangled on the way: something went wrong, not your fault.
  error: (
    <>
      <path d="M14 98 H146" strokeWidth="2" opacity="0.5" />
      <path d="M22 74 C40 74 44 44 62 50 C80 56 60 84 76 82 C92 80 84 46 100 50 C114 54 104 76 118 74 C128 72 130 62 138 62" />
      <circle cx="140" cy="62" r="3.5" fill={WAVE} stroke={WAVE} />
    </>
  ),
};
