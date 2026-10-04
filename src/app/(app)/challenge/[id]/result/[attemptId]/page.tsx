import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EvaluationResults } from "@/components/evaluation/evaluation-results";
import { FollowUpSection } from "@/components/evaluation/follow-up-section";
import { parseStoredFollowUps } from "@/lib/utils/followups";
import { RECORDINGS_BUCKET } from "@/lib/storage/recording-path";
import { createClient } from "@/lib/supabase/server";
import { attemptNeighbours } from "@/lib/utils/attempt-history";
import { parseStoredCoverage } from "@/lib/utils/coverage";
import { compareCoverage, matchCoverageToOutline } from "@/lib/utils/coverage-progress";
import type { Json } from "@/types";

type PageProps = { params: Promise<{ id: string; attemptId: string }> };

const AUDIO_URL_TTL_SEC = 60 * 60;

function toStringArray(value: Json | null): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenges")
    .select("title")
    .eq("id", id)
    .maybeSingle();
  return { title: data?.title ? `Hasil — ${data.title}` : "Hasil evaluasi" };
}

export default async function ResultPage({ params }: PageProps) {
  const { id, attemptId } = await params;
  const supabase = await createClient();

  const { data: attempt } = await supabase
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt || attempt.challenge_id !== id) {
    notFound();
  }

  const { data: challenge } = await supabase
    .from("challenges")
    .select("title")
    .eq("id", id)
    .maybeSingle();
  if (!challenge) {
    notFound();
  }

  // Short-lived signed URL so the learner can replay their own recording
  // (the bucket is private; RLS lets only the owner sign their files).
  let audioUrl: string | null = null;
  if (attempt.audio_storage_path) {
    const { data: signed } = await supabase.storage
      .from(RECORDINGS_BUCKET)
      .createSignedUrl(attempt.audio_storage_path, AUDIO_URL_TTL_SEC);
    audioUrl = signed?.signedUrl ?? null;
  }

  const [
    {
      data: { user },
    },
    { data: historyRows },
    { data: outlineRows },
    { data: followupRows },
    { data: previousAttempt },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("attempts")
      .select("id, attempt_number, overall_score")
      .eq("challenge_id", id)
      .order("attempt_number"),
    supabase
      .from("challenge_outlines")
      .select("id, title")
      .eq("challenge_id", id)
      .order("order_index"),
    supabase
      .from("attempt_followups")
      .select("question_index, transcript, verdict, feedback, hint")
      .eq("attempt_id", attemptId),
    // The previous SCORED attempt (rejected recordings have no coverage).
    supabase
      .from("attempts")
      .select("attempt_number, coverage")
      .eq("challenge_id", id)
      .eq("evaluation_status", "completed")
      .not("overall_score", "is", null)
      .lt("attempt_number", attempt.attempt_number)
      .order("attempt_number", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const outline = outlineRows ?? [];
  const coverage = parseStoredCoverage(attempt.coverage);
  const outlineIds = matchCoverageToOutline(coverage, outline);
  const coverageRows = coverage.map((entry, index) => ({
    ...entry,
    outline_id: outlineIds[index] ?? null,
  }));
  const previousCoverage = parseStoredCoverage(previousAttempt?.coverage ?? null);
  const comparison =
    previousAttempt && coverage.length > 0 && previousCoverage.length > 0
      ? {
          previousAttemptNumber: previousAttempt.attempt_number,
          result: compareCoverage(coverage, previousCoverage, outline),
        }
      : null;

  const followUpQuestions = parseStoredFollowUps(attempt.follow_up_questions);

  const history = (historyRows ?? []).map((row) => ({
    attemptNumber: row.attempt_number,
    score: row.overall_score,
  }));

  // The last scored attempt before this one (history is ordered by number).
  let previous: { score: number; attemptNumber: number } | null = null;
  for (const entry of history) {
    if (entry.attemptNumber < attempt.attempt_number && entry.score !== null) {
      previous = { score: entry.score, attemptNumber: entry.attemptNumber };
    }
  }

  const subScores =
    attempt.comprehensiveness_score !== null &&
    attempt.accuracy_score !== null &&
    attempt.clarity_score !== null
      ? {
          comprehensiveness: attempt.comprehensiveness_score,
          accuracy: attempt.accuracy_score,
          clarity: attempt.clarity_score,
        }
      : null;

  return (
    <EvaluationResults
      challengeId={id}
      attemptId={attemptId}
      challengeTitle={challenge.title}
      attemptNumber={attempt.attempt_number}
      previous={previous}
      maxScore={attempt.max_possible_score ?? 10}
      history={history}
      neighbours={attemptNeighbours(historyRows ?? [], attempt.attempt_number)}
      status={attempt.evaluation_status}
      evaluationError={attempt.evaluation_error}
      overallScore={attempt.overall_score}
      subScores={subScores}
      coverage={coverageRows}
      comparison={comparison}
      audioIssue={attempt.audio_issue}
      unexplainedJargon={toStringArray(attempt.unexplained_jargon)}
      feedback={attempt.feedback}
      strengths={toStringArray(attempt.strengths)}
      improvements={toStringArray(attempt.improvements)}
      transcript={attempt.transcript}
      audioUrl={audioUrl}
      followUp={
        user && followUpQuestions.length > 0 ? (
          <FollowUpSection
            attemptId={attemptId}
            challengeId={id}
            userId={user.id}
            questions={followUpQuestions}
            initialAnswers={followupRows ?? []}
            outlineTitles={outline.map((row) => row.title)}
          />
        ) : null
      }
    />
  );
}
