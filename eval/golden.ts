// Eval-golden (Prompt 4.4): is the grader stable and fair? Every fixture in
// eval/fixtures is evaluated RUNS times through the real Gemini, using the
// same core as /api/evaluate (src/lib/ai/evaluate.ts), and the verdict is
// written to eval/reports/<date>.md.
//
//   npm run eval:golden              # resumes where the last run stopped
//   npm run eval:golden -- --fresh   # start over
//
// Spends real Gemini quota (5 fixtures x 3 runs), so it never runs in CI.
// Calls are spaced 13 s apart for the free tier's 5 a minute (set
// EVAL_SPACING_MS=0 on a billed key). The free tier also stops at 20 a day:
// finished runs are kept in eval/.cache, so running again later completes
// the set instead of starting over. The report is written only when every
// run is in. Uses GEMINI_API_KEY from .env.local; prints scores only.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";

import { EVALUATION_TEMPERATURE, evaluateExplanation } from "../src/lib/ai/evaluate";
import { GEMINI_MODEL } from "../src/lib/gemini/client";
import { GeminiError } from "../src/lib/gemini/retry";
import {
  judgeFixture,
  renderReport,
  type EvalRun,
  type FixtureExpectation,
  type FixtureResult,
} from "../src/lib/utils/eval-report";

const FIXTURES = "eval/fixtures";
const RUNS = 3;
/** Gemini's free tier allows 5 requests a minute per model; stay under it. */
const SPACING_MS = Number(process.env.EVAL_SPACING_MS ?? 13_000);
/** Runs belong to one model and temperature; changing either starts over. */
const CACHE = `eval/.cache/${GEMINI_MODEL}-t${EVALUATION_TEMPERATURE}.json`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Cache = Record<string, EvalRun[]>;

function loadCache(fresh: boolean): Cache {
  if (fresh || !existsSync(CACHE)) return {};
  return JSON.parse(readFileSync(CACHE, "utf8")) as Cache;
}

function saveCache(cache: Cache): void {
  mkdirSync("eval/.cache", { recursive: true });
  writeFileSync(CACHE, JSON.stringify(cache, null, 2));
}

async function main() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  if (process.env.AI_MOCK) {
    throw new Error("Matikan AI_MOCK: eval-golden mengukur Gemini yang asli.");
  }

  const cache = loadCache(process.argv.includes("--fresh"));
  const results: FixtureResult[] = [];
  let calls = 0;

  for (const name of readdirSync(FIXTURES).sort()) {
    const dir = `${FIXTURES}/${name}`;
    const outline = JSON.parse(readFileSync(`${dir}/outline.json`, "utf8")) as {
      title: string;
      description: string | null;
    }[];
    const expected = JSON.parse(
      readFileSync(`${dir}/expected.json`, "utf8"),
    ) as FixtureExpectation;
    const audioBase64 = readFileSync(`${dir}/audio.wav`).toString("base64");

    const runs = cache[name] ?? [];
    for (const [index, run] of runs.entries()) {
      console.log(`${name} #${index + 1}: ${describe(run)} (tersimpan)`);
    }
    while (runs.length < RUNS) {
      if (calls > 0) await sleep(SPACING_MS);
      calls += 1;
      const started = Date.now();
      let outcome;
      try {
        outcome = await evaluateExplanation({
          audioBase64,
          mimeType: "audio/wav",
          outline,
          notes: null,
          hintLevel: "none",
          maxScore: 10,
          budgetMs: 55_000,
        });
      } catch (error) {
        if (error instanceof GeminiError && error.code === "quota") {
          console.log(
            "\nKuota Gemini habis. Hasil yang sudah ada tersimpan; jalankan lagi nanti untuk melanjutkan.",
          );
          process.exit(2);
        }
        throw error;
      }
      const run: EvalRun =
        outcome.kind === "rejected"
          ? {
              overall: null,
              audioIssue: outcome.audioIssue,
              coverage: [],
              latencyMs: Date.now() - started,
            }
          : {
              overall: outcome.overall,
              audioIssue: "none",
              coverage: outcome.coverage.map((entry) => entry.status),
              latencyMs: Date.now() - started,
            };
      runs.push(run);
      cache[name] = runs;
      saveCache(cache);
      console.log(`${name} #${runs.length}: ${describe(run)}`);
    }
    results.push({ name, expected, runs });
  }

  const date = new Date().toISOString().slice(0, 10);
  mkdirSync("eval/reports", { recursive: true });
  const file = `eval/reports/${date}.md`;
  writeFileSync(
    file,
    renderReport(results, {
      date,
      model: GEMINI_MODEL,
      temperature: EVALUATION_TEMPERATURE,
      runsPerFixture: RUNS,
    }),
  );
  rmSync(CACHE, { force: true });
  const passed = results.map(judgeFixture).every((verdict) => verdict.passed);
  console.log(`\n${passed ? "LULUS" : "BELUM LULUS"}: ${file}`);
}

function describe(run: EvalRun): string {
  return run.overall === null
    ? `ditolak (${run.audioIssue})`
    : `${run.overall} ${run.coverage.join("/")}`;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
