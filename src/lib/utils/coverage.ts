// ============================================================================
// Coverage — pure helpers turning the model's per-point verdicts into a
// trustworthy list: exactly one entry per outline point, titles taken from
// OUR outline (never the model's wording), evidence trimmed.
// ============================================================================
import type { Coverage, CoverageStatus, Json } from "@/types";

const MAX_NOTE = 400;
const MAX_EVIDENCE = 300;

export interface RawCoverage {
  outline_index: number;
  status: CoverageStatus;
  note: string;
  evidence: string;
}

function clip(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

/**
 * One entry per outline point, in outline order. `outline_index` from the
 * model is 1-based. Points the model skipped are "missing". Evidence is
 * dropped for "missing" points (there is nothing to quote).
 */
export function normalizeCoverage(
  raw: readonly RawCoverage[],
  titles: readonly string[],
): Coverage[] {
  return titles.map((title, index) => {
    const position = index + 1;
    const entry = raw.find((item) => Math.round(item.outline_index) === position);
    if (!entry) {
      return {
        outline_index: position,
        topic: title,
        status: "missing",
        note: "",
        evidence: "",
      };
    }
    return {
      outline_index: position,
      topic: title,
      status: entry.status,
      note: clip(entry.note, MAX_NOTE),
      evidence: entry.status === "missing" ? "" : clip(entry.evidence, MAX_EVIDENCE),
    };
  });
}

function isStatus(value: unknown): value is CoverageStatus {
  return value === "covered" || value === "partial" || value === "missing";
}

/**
 * Reads coverage stored in attempts.coverage. Accepts both the old shape
 * ({ topic, status, note }) and the new one (+ outline_index, evidence).
 */
export function parseStoredCoverage(value: Json | null): Coverage[] {
  if (!Array.isArray(value)) return [];
  const out: Coverage[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const { topic, status, note, evidence, outline_index } = item;
    if (typeof topic !== "string" || !isStatus(status)) continue;
    out.push({
      topic,
      status,
      note: typeof note === "string" ? note : "",
      evidence: typeof evidence === "string" ? evidence : "",
      ...(typeof outline_index === "number" ? { outline_index } : {}),
    });
  }
  return out;
}

/** Deduplicated, trimmed jargon list (max 8) for storage and display. */
export function normalizeJargon(terms: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of terms) {
    const term = raw.trim();
    const key = term.toLowerCase();
    if (!term || term.length > 60 || seen.has(key)) continue;
    seen.add(key);
    out.push(term);
    if (out.length >= 8) break;
  }
  return out;
}
