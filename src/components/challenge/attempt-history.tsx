"use client";

import { useId, useState } from "react";
import Link from "next/link";

import { Sheet, SheetTitle } from "@/components/ui/sheet";
import { HISTORY_PREVIEW, type HistoryEntry } from "@/lib/utils/attempt-history";

/**
 * Every attempt of this challenge, newest first (Prompt 4.1). Each row opens
 * its result page, including attempts still being judged or whose judging
 * failed: that page picks the evaluation up again.
 */
export function AttemptHistory({ entries }: { entries: HistoryEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  if (entries.length === 0) return null;

  const hidden = entries.length - HISTORY_PREVIEW;
  const shown = expanded ? entries : entries.slice(0, HISTORY_PREVIEW);

  return (
    <Sheet as="section" className="stack gap-3" aria-labelledby="history-title">
      <SheetTitle id="history-title">Riwayat percobaan</SheetTitle>
      <ol id={listId} className="history-list">
        {shown.map((entry) => (
          <li key={entry.id}>
            <Link href={entry.href} className="history-row">
              <span className="history-number">
                <span className="visually-hidden">Percobaan </span>#{entry.number}
              </span>
              <span className="history-body">
                <span className="history-day">{entry.dayLabel}</span>
                <span className="history-hint">
                  {entry.hint ? `Bantuan: ${entry.hint}` : "Tanpa bantuan"}
                </span>
              </span>
              {entry.score !== null ? (
                <span className="history-score">
                  <span className="visually-hidden">Skor </span>
                  {entry.score}
                  <span className="history-score-max"> /{entry.maxScore}</span>
                </span>
              ) : (
                <span className="history-status" data-outcome={entry.outcome}>
                  {entry.statusLabel}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
      {hidden > 0 && (
        <button
          type="button"
          className="history-toggle"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? "Tampilkan lebih sedikit" : `Tampilkan semua (${entries.length})`}
        </button>
      )}
    </Sheet>
  );
}
