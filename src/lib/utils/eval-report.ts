/**
 * Eval-golden scoring (Prompt 4.4): how stable and how fair is the grader?
 * Each fixture is evaluated several times; this module turns those runs
 * into pass/fail against the targets and a markdown report.
 *
 * Targets: overall score spread at most 1 point across runs, coverage status
 * agreement with the expected verdict at least 80%, and silent or off-topic
 * audio rejected every single time.
 */
import type { CoverageStatus } from "@/types";

export const TARGETS = { maxSpread: 1, minCoverageAgreement: 0.8 } as const;

export interface FixtureExpectation {
  /** Inclusive range the overall score should land in; null for rejected audio. */
  overall: [number, number] | null;
  /** Expected verdict per outline point, in order; null for rejected audio. */
  coverage: CoverageStatus[] | null;
  /** True when the grader must refuse to score (silence, another topic). */
  rejected: boolean;
}

export interface EvalRun {
  /** null when the grader rejected the audio. */
  overall: number | null;
  audioIssue: string;
  coverage: CoverageStatus[];
  latencyMs: number;
}

export interface FixtureResult {
  name: string;
  expected: FixtureExpectation;
  runs: EvalRun[];
}

export interface FixtureVerdict {
  name: string;
  scores: (number | null)[];
  spread: number | null;
  inRange: boolean | null;
  /** Share of (run, point) pairs whose status matched; null for rejected fixtures. */
  coverageAgreement: number | null;
  rejectedEveryRun: boolean;
  passed: boolean;
  problems: string[];
}

export function judgeFixture(fixture: FixtureResult): FixtureVerdict {
  const { expected, runs } = fixture;
  const scores = runs.map((run) => run.overall);
  const problems: string[] = [];
  const rejectedEveryRun = runs.length > 0 && runs.every((run) => run.overall === null);

  if (expected.rejected) {
    if (!rejectedEveryRun) problems.push("tidak selalu ditolak");
    return {
      name: fixture.name,
      scores,
      spread: null,
      inRange: null,
      coverageAgreement: null,
      rejectedEveryRun,
      passed: problems.length === 0,
      problems,
    };
  }

  const scored = scores.filter((score): score is number => score !== null);
  if (scored.length < runs.length) problems.push("ditolak padahal seharusnya dinilai");

  const spread = scored.length > 0 ? Math.max(...scored) - Math.min(...scored) : null;
  if (spread !== null && spread > TARGETS.maxSpread) {
    problems.push(`selisih skor ${spread} > ${TARGETS.maxSpread}`);
  }

  const range = expected.overall;
  const inRange =
    range === null || scored.length === 0
      ? null
      : scored.every((score) => score >= range[0] && score <= range[1]);
  if (inRange === false)
    problems.push(`skor di luar rentang ${range?.[0]}–${range?.[1]}`);

  let coverageAgreement: number | null = null;
  if (expected.coverage) {
    const wanted = expected.coverage;
    let matched = 0;
    let total = 0;
    for (const run of runs) {
      wanted.forEach((status, index) => {
        total += 1;
        if (run.coverage[index] === status) matched += 1;
      });
    }
    coverageAgreement = total === 0 ? null : matched / total;
    if (coverageAgreement !== null && coverageAgreement < TARGETS.minCoverageAgreement) {
      problems.push(
        `kecocokan coverage ${Math.round(coverageAgreement * 100)}% < ${TARGETS.minCoverageAgreement * 100}%`,
      );
    }
  }

  return {
    name: fixture.name,
    scores,
    spread,
    inRange,
    coverageAgreement,
    rejectedEveryRun,
    passed: problems.length === 0,
    problems,
  };
}

function percent(value: number | null): string {
  return value === null ? "–" : `${Math.round(value * 100)}%`;
}

/** The markdown report written to eval/reports/<date>.md. */
export function renderReport(
  fixtures: readonly FixtureResult[],
  meta: { date: string; model: string; temperature: number; runsPerFixture: number },
): string {
  const verdicts = fixtures.map(judgeFixture);
  const allPassed = verdicts.every((verdict) => verdict.passed);
  const lines = [
    `# Eval-golden ${meta.date}`,
    "",
    `Model \`${meta.model}\`, temperature ${meta.temperature}, ${meta.runsPerFixture} run per fixture.`,
    "",
    `**Hasil: ${allPassed ? "LULUS" : "BELUM LULUS"}** (target: selisih skor maks ${TARGETS.maxSpread}, kecocokan coverage min ${TARGETS.minCoverageAgreement * 100}%, audio hening dan topik lain selalu ditolak).`,
    "",
    "| Fixture | Skor per run | Selisih | Dalam rentang | Kecocokan coverage | audio_issue | Lulus |",
    "|---|---|---|---|---|---|---|",
  ];
  verdicts.forEach((verdict, index) => {
    const fixture = fixtures[index];
    const issues = [...new Set(fixture?.runs.map((run) => run.audioIssue) ?? [])].join(
      ", ",
    );
    lines.push(
      `| ${verdict.name} | ${verdict.scores.map((score) => score ?? "ditolak").join(" · ")} | ${verdict.spread ?? "–"} | ${verdict.inRange === null ? "–" : verdict.inRange ? "ya" : "tidak"} | ${percent(verdict.coverageAgreement)} | ${issues} | ${verdict.passed ? "ya" : "tidak"} |`,
    );
  });
  const failing = verdicts.filter((verdict) => !verdict.passed);
  if (failing.length > 0) {
    lines.push("", "## Yang belum memenuhi target", "");
    for (const verdict of failing) {
      lines.push(`- **${verdict.name}**: ${verdict.problems.join("; ")}`);
    }
  }
  const latencies = fixtures.flatMap((fixture) =>
    fixture.runs.map((run) => run.latencyMs),
  );
  if (latencies.length > 0) {
    const sorted = [...latencies].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
    lines.push(
      "",
      `Lama penilaian: median ${(median / 1000).toFixed(1)} s, terlama ${((sorted.at(-1) ?? 0) / 1000).toFixed(1)} s.`,
    );
  }
  return lines.join("\n") + "\n";
}
