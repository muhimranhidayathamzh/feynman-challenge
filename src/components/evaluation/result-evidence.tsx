"use client";

import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { BookOpen, Quote } from "lucide-react";

import { AudioPlayer } from "@/components/ui/audio-player";
import { ButtonLink } from "@/components/ui/button";
import { Sheet, SheetTitle } from "@/components/ui/sheet";
import { studyHref } from "@/lib/utils/coverage-progress";
import { COVERAGE_STATUS_LABEL } from "@/lib/utils/labels";
import { annotateTranscript } from "@/lib/utils/transcript";
import { cx } from "@/lib/utils/cx";
import type { Coverage } from "@/types";

import { CoverageMark } from "./coverage-mark";

/** A coverage entry linked to the current outline item (null if it is gone). */
export type CoverageRow = Coverage & { outline_id: string | null };

interface Props {
  challengeId: string;
  attemptNumber: number;
  coverage: CoverageRow[];
  transcript: string | null;
  jargon: string[];
  audioUrl: string | null;
}

/**
 * "Yang kamu jelaskan" beside "Transkripmu" (DESIGN.md §11): every outline
 * point with its verdict, and the transcript with the quoted evidence
 * highlighted. Choosing a point highlights its quote and the other way round.
 */
export function ResultEvidence({
  challengeId,
  attemptNumber,
  coverage,
  transcript,
  jargon,
  audioUrl,
}: Props) {
  const [active, setActive] = useState<number | null>(null);
  const pointRefs = useRef<(HTMLLIElement | null)[]>([]);
  const markRefs = useRef(new Map<number, HTMLElement>());

  const annotated = useMemo(
    () =>
      annotateTranscript(
        transcript ?? "",
        coverage.map((entry) => (entry.status === "missing" ? "" : entry.evidence)),
        jargon,
      ),
    [transcript, coverage, jargon],
  );

  function focusQuote(index: number) {
    setActive(index);
    markRefs.current.get(index)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function focusPoint(index: number) {
    setActive(index);
    pointRefs.current[index]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function onMarkKey(event: KeyboardEvent<HTMLElement>, index: number) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      focusPoint(index);
    }
  }

  const firstMark = new Set<number>();

  return (
    <div className="result-evidence">
      <Sheet as="section" className="stack gap-4" aria-labelledby="points-title">
        <SheetTitle id="points-title">Yang kamu jelaskan</SheetTitle>
        <ol className="point-list">
          {coverage.map((item, index) => (
            <li
              key={`${index}-${item.topic}`}
              ref={(node) => {
                pointRefs.current[index] = node;
              }}
              className="point-row"
              data-active={active === index || undefined}
              style={{ "--i": index } as CSSProperties}
            >
              <CoverageMark status={item.status} className="result-mark" decorative />
              <div className="stack gap-1 flex-1">
                <p className="point-topic">
                  {item.topic}
                  <span className="point-status">
                    {" "}
                    · {COVERAGE_STATUS_LABEL[item.status]}
                  </span>
                </p>
                {item.note && <p className="text-secondary text-sm">{item.note}</p>}
                <div className="row flex-wrap gap-2">
                  {annotated.found[index] && (
                    <button
                      type="button"
                      className="point-quote-link"
                      onClick={() => focusQuote(index)}
                      aria-label={`Lihat bukti untuk ${item.topic} di transkrip`}
                    >
                      <Quote size={14} aria-hidden="true" />
                      Lihat di transkrip
                    </button>
                  )}
                  {item.status !== "covered" && item.outline_id !== null && (
                    <ButtonLink
                      href={studyHref(challengeId, item.outline_id)}
                      variant="ghost"
                      size="sm"
                      icon={BookOpen}
                      aria-label={`Pelajari lagi: ${item.topic}`}
                    >
                      Pelajari lagi
                    </ButtonLink>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Sheet>

      <Sheet
        as="section"
        className="stack gap-4 result-transcript"
        aria-labelledby="transcript-title"
      >
        <SheetTitle id="transcript-title">Transkripmu</SheetTitle>
        {audioUrl && (
          <AudioPlayer src={audioUrl} label={`Rekaman percobaan #${attemptNumber}`} />
        )}
        {transcript?.trim() ? (
          <>
            <p className="transcript">
              {annotated.pieces.map((piece, index) => {
                const key = `${index}-${piece.point ?? "x"}`;
                const term = piece.jargon ? (
                  <span className="jargon-term" title="Istilah ini belum kamu jelaskan">
                    {piece.text}
                  </span>
                ) : (
                  piece.text
                );
                if (piece.point === null) return <span key={key}>{term}</span>;
                const point = piece.point;
                const isFirst = !firstMark.has(point);
                firstMark.add(point);
                return (
                  <mark
                    key={key}
                    ref={(node) => {
                      if (node && isFirst) markRefs.current.set(point, node);
                    }}
                    className={cx("evidence-mark", active === point && "is-active")}
                    style={{ "--i": point } as CSSProperties}
                    tabIndex={isFirst ? 0 : -1}
                    role="button"
                    aria-label={
                      isFirst
                        ? `Bukti untuk ${coverage[point]?.topic ?? "poin"}`
                        : undefined
                    }
                    onClick={() => focusPoint(point)}
                    onKeyDown={(event) => onMarkKey(event, point)}
                  >
                    {term}
                  </mark>
                );
              })}
            </p>
            <p className="transcript-legend text-muted text-xs">
              <span className="legend-mark">Stabilo</span> kutipan yang dipakai sebagai
              bukti.
              {jargon.length > 0 && (
                <>
                  {" "}
                  <span className="jargon-term">Garis titik-titik</span> istilah yang
                  belum kamu jelaskan.
                </>
              )}
            </p>
          </>
        ) : (
          <p className="text-secondary">Transkrip tidak tersedia untuk percobaan ini.</p>
        )}
      </Sheet>
    </div>
  );
}
