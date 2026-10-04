import { describe, expect, it } from "vitest";

import {
  judgeFixture,
  renderReport,
  type EvalRun,
  type FixtureResult,
} from "./eval-report";

const run = (overall: number | null, coverage: EvalRun["coverage"] = []): EvalRun => ({
  overall,
  audioIssue: overall === null ? "silent" : "none",
  coverage,
  latencyMs: 12_000,
});

const scoredFixture = (runs: EvalRun[]): FixtureResult => ({
  name: "sebagian",
  expected: {
    overall: [4, 7],
    coverage: ["covered", "partial", "missing"],
    rejected: false,
  },
  runs,
});

describe("judgeFixture", () => {
  it("passes a stable, fair grader", () => {
    const verdict = judgeFixture(
      scoredFixture([
        run(6, ["covered", "partial", "missing"]),
        run(5, ["covered", "partial", "missing"]),
        run(6, ["covered", "missing", "missing"]),
      ]),
    );
    expect(verdict).toMatchObject({ spread: 1, inRange: true, passed: true });
    expect(verdict.coverageAgreement).toBeCloseTo(8 / 9);
  });

  it("fails a spread above one point", () => {
    const verdict = judgeFixture(
      scoredFixture([
        run(4, ["covered", "partial", "missing"]),
        run(6, ["covered", "partial", "missing"]),
        run(5, ["covered", "partial", "missing"]),
      ]),
    );
    expect(verdict.passed).toBe(false);
    expect(verdict.problems[0]).toMatch(/selisih skor 2/);
  });

  it("fails coverage agreement under 80%", () => {
    const verdict = judgeFixture(
      scoredFixture([
        run(5, ["partial", "missing", "missing"]),
        run(5, ["partial", "missing", "missing"]),
      ]),
    );
    expect(verdict.coverageAgreement).toBeCloseTo(2 / 6);
    expect(verdict.passed).toBe(false);
  });

  it("flags a score outside the expected range, and a wrongful rejection", () => {
    const verdict = judgeFixture(
      scoredFixture([run(9, ["covered", "partial", "missing"]), run(null)]),
    );
    expect(verdict.inRange).toBe(false);
    expect(verdict.problems).toContain("ditolak padahal seharusnya dinilai");
  });

  it("requires silent or off-topic audio to be rejected every time", () => {
    const silent: FixtureResult = {
      name: "hening",
      expected: { overall: null, coverage: null, rejected: true },
      runs: [run(null), run(null), run(3)],
    };
    expect(judgeFixture(silent)).toMatchObject({
      rejectedEveryRun: false,
      passed: false,
    });
    expect(judgeFixture({ ...silent, runs: [run(null), run(null)] }).passed).toBe(true);
  });
});

describe("renderReport", () => {
  it("summarises every fixture and says what failed", () => {
    const report = renderReport(
      [
        scoredFixture([
          run(4, ["covered", "partial", "missing"]),
          run(6, ["covered", "partial", "missing"]),
        ]),
      ],
      {
        date: "2026-10-04",
        model: "gemini-2.5-flash",
        temperature: 0.2,
        runsPerFixture: 2,
      },
    );
    expect(report).toContain("# Eval-golden 2026-10-04");
    expect(report).toContain("BELUM LULUS");
    expect(report).toContain("| sebagian | 4 · 6 | 2 |");
    expect(report).toContain("## Yang belum memenuhi target");
    expect(report).toContain("median 12.0 s");
  });
});
