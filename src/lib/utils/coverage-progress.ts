// ============================================================================
// Coverage progress — pure helpers linking stored per-attempt coverage to the
// CURRENT outline, so the learner can see how each point evolves over time and
// jump from a weak point straight to its notes.
//
// Stored coverage carries the point's 1-based `outline_index` and its title at
// evaluation time (`topic`). The outline may have been reordered, renamed, or
// trimmed since, so matching is done per attempt, in two passes:
//   1. exact title match (survives reordering);
//   2. `outline_index` for the entries still unmatched (survives renaming),
//      but only onto an item no other entry of that attempt claimed and whose
//      title did not appear in that attempt at all (so a deleted point never
//      hands its verdict to the item that slid into its position).
// Old coverage without an index is matched by title only.
// ============================================================================
import type { Coverage, CoverageStatus } from "@/types";

export interface OutlineRef {
  id: string;
  title: string;
}

export interface TrendPoint {
  attemptNumber: number;
  /** null: the point was not assessed in that attempt (e.g. added later). */
  status: CoverageStatus | null;
}

export interface AttemptCoverage {
  attemptNumber: number;
  coverage: readonly Coverage[];
}

export interface CoverageChange {
  topic: string;
  from: CoverageStatus;
  to: CoverageStatus;
  /** Current outline item, when the point still exists. */
  outlineId: string | null;
}

export interface CoverageComparison {
  improved: CoverageChange[];
  declined: CoverageChange[];
  /** Partial or missing in both attempts, without moving up. */
  stillWeak: CoverageChange[];
  /** Points covered in both attempts. */
  steadyCount: number;
}

export const TREND_LENGTH = 5;

const RANK: Record<CoverageStatus, number> = { missing: 0, partial: 1, covered: 2 };

function titleKey(title: string): string {
  return title.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Current outline item id for each coverage entry (same order), or null when
 * the point no longer exists or cannot be matched safely.
 */
export function matchCoverageToOutline(
  coverage: readonly Coverage[],
  outline: readonly OutlineRef[],
): (string | null)[] {
  const byTitle = new Map<string, string>();
  for (const item of outline) {
    const key = titleKey(item.title);
    if (!byTitle.has(key)) byTitle.set(key, item.id);
  }

  const claimed = new Set<string>();
  const result: (string | null)[] = coverage.map((entry) => {
    const id = byTitle.get(titleKey(entry.topic));
    if (id === undefined || claimed.has(id)) return null;
    claimed.add(id);
    return id;
  });

  const topicsInAttempt = new Set(coverage.map((entry) => titleKey(entry.topic)));
  coverage.forEach((entry, index) => {
    if (result[index] !== null || entry.outline_index === undefined) return;
    const item = outline[Math.round(entry.outline_index) - 1];
    if (!item || claimed.has(item.id) || topicsInAttempt.has(titleKey(item.title))) {
      return;
    }
    claimed.add(item.id);
    result[index] = item.id;
  });

  return result;
}

/** Coverage status per current outline item for one attempt. */
function statusByOutlineId(
  coverage: readonly Coverage[],
  outline: readonly OutlineRef[],
): Map<string, CoverageStatus> {
  const ids = matchCoverageToOutline(coverage, outline);
  const out = new Map<string, CoverageStatus>();
  coverage.forEach((entry, index) => {
    const id = ids[index];
    if (id) out.set(id, entry.status);
  });
  return out;
}

/**
 * Per outline item: its status in the last `TREND_LENGTH` attempts, oldest
 * first. Items never assessed in those attempts are left out.
 */
export function buildCoverageTrend(
  attempts: readonly AttemptCoverage[],
  outline: readonly OutlineRef[],
): Record<string, TrendPoint[]> {
  const recent = [...attempts]
    .filter((attempt) => attempt.coverage.length > 0)
    .sort((a, b) => a.attemptNumber - b.attemptNumber)
    .slice(-TREND_LENGTH);
  const perAttempt = recent.map((attempt) => ({
    attemptNumber: attempt.attemptNumber,
    statuses: statusByOutlineId(attempt.coverage, outline),
  }));

  const trend: Record<string, TrendPoint[]> = {};
  for (const item of outline) {
    const points = perAttempt.map(({ attemptNumber, statuses }) => ({
      attemptNumber,
      status: statuses.get(item.id) ?? null,
    }));
    if (points.some((point) => point.status !== null)) trend[item.id] = points;
  }
  return trend;
}

/**
 * Point-by-point comparison of an attempt with the previous one. Points are
 * paired through the current outline; points that no longer exist fall back
 * to pairing by title. Points without a previous verdict are skipped.
 */
export function compareCoverage(
  current: readonly Coverage[],
  previous: readonly Coverage[],
  outline: readonly OutlineRef[],
): CoverageComparison {
  const keyed = (coverage: readonly Coverage[]) => {
    const ids = matchCoverageToOutline(coverage, outline);
    return coverage.map((entry, index) => ({
      entry,
      outlineId: ids[index] ?? null,
      key: ids[index] ?? `title:${titleKey(entry.topic)}`,
    }));
  };

  const before = new Map<string, CoverageStatus>();
  for (const { key, entry } of keyed(previous)) {
    if (!before.has(key)) before.set(key, entry.status);
  }

  const comparison: CoverageComparison = {
    improved: [],
    declined: [],
    stillWeak: [],
    steadyCount: 0,
  };
  for (const { key, entry, outlineId } of keyed(current)) {
    const from = before.get(key);
    if (from === undefined) continue;
    const change: CoverageChange = {
      topic: entry.topic,
      from,
      to: entry.status,
      outlineId,
    };
    if (RANK[entry.status] > RANK[from]) comparison.improved.push(change);
    else if (RANK[entry.status] < RANK[from]) comparison.declined.push(change);
    else if (entry.status === "covered") comparison.steadyCount += 1;
    else comparison.stillWeak.push(change);
  }
  return comparison;
}

/** True when there is nothing worth listing (no previous overlap at all). */
export function isEmptyComparison(comparison: CoverageComparison): boolean {
  return (
    comparison.improved.length === 0 &&
    comparison.declined.length === 0 &&
    comparison.stillWeak.length === 0 &&
    comparison.steadyCount === 0
  );
}

/** DOM id of an outline point in the notebook (target of "Pelajari lagi"). */
export function outlineAnchorId(outlineId: string): string {
  return `outline-${outlineId}`;
}

/** Notebook link that scrolls to and highlights one outline point. */
export function studyHref(challengeId: string, outlineId: string): string {
  return `/challenge/${challengeId}#${outlineAnchorId(outlineId)}`;
}
