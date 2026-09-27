import { describe, expect, it } from "vitest";

import { matchCoverageToOutline } from "@/lib/utils/coverage-progress";
import { nextFocus } from "@/lib/utils/result-digest";
import { annotateTranscript, splitSummary } from "@/lib/utils/transcript";

import { DEMO_ATTEMPT, DEMO_CHALLENGE, DEMO_OUTLINE, DEMO_SOURCES } from "./fixture";

/**
 * The demo is the first thing every visitor sees, on the landing page and
 * after "Coba tanpa akun". These checks keep it internally consistent, so an
 * edit to the transcript can never silently break a highlight in public.
 */
describe("demo fixture", () => {
  const { transcript, coverage, unexplainedJargon } = DEMO_ATTEMPT;
  const evidence = coverage.map((point) =>
    point.status === "missing" ? "" : point.evidence,
  );
  const annotated = annotateTranscript(transcript, evidence, unexplainedJargon);

  it("finds every quoted piece of evidence in the transcript, word for word", () => {
    coverage.forEach((point, index) => {
      if (point.status === "missing") return;
      expect(annotated.found[index], point.topic).toBe(true);
    });
  });

  it("leaves missing points without evidence", () => {
    for (const point of coverage.filter((p) => p.status === "missing")) {
      expect(point.evidence).toBe("");
    }
  });

  it("underlines every unexplained term somewhere in the transcript", () => {
    for (const term of unexplainedJargon) {
      expect(
        annotated.pieces.some((piece) => piece.jargon === term),
        term,
      ).toBe(true);
    }
  });

  it("shows every kind of verdict, so each part of the result page has content", () => {
    const statuses = new Set(coverage.map((point) => point.status));
    expect(statuses).toEqual(new Set(["covered", "partial", "missing"]));
  });

  it("links every coverage point to its outline item", () => {
    const outline = DEMO_OUTLINE.map((item, index) => ({
      id: `o${index}`,
      title: item.title,
    }));
    expect(matchCoverageToOutline(coverage, outline)).toEqual(outline.map((o) => o.id));
  });

  it("opens the feedback with a one-sentence summary for the page title", () => {
    const { summary, rest } = splitSummary(DEMO_ATTEMPT.feedback);
    expect(summary).toMatch(/\.$/);
    expect(summary?.includes(DEMO_CHALLENGE.title.toLowerCase())).toBe(true);
    expect(rest.length).toBeGreaterThan(0);
  });

  it("gives the result page a next focus from the evaluator", () => {
    expect(nextFocus(DEMO_ATTEMPT.improvements, coverage)).toBe(
      DEMO_ATTEMPT.improvements[0],
    );
  });

  it("points follow-up questions at real outline items", () => {
    for (const question of DEMO_ATTEMPT.followUpQuestions) {
      expect(question.outline_index).toBeGreaterThanOrEqual(1);
      expect(question.outline_index).toBeLessThanOrEqual(DEMO_OUTLINE.length);
    }
  });

  it("gives every outline item keywords and a guiding question for the hints", () => {
    for (const item of DEMO_OUTLINE) {
      expect(item.keywords.length, item.title).toBeGreaterThan(0);
      expect(item.guiding_question.trim(), item.title).not.toBe("");
    }
  });

  it("links only to https sources", () => {
    for (const source of DEMO_SOURCES) {
      expect(new URL(source.url).protocol).toBe("https:");
    }
  });
});
