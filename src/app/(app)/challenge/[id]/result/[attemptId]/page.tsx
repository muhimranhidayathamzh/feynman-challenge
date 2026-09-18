import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EvaluationResults } from "@/components/evaluation/evaluation-results";
import { FollowUpSection } from "@/components/evaluation/follow-up-section";
import { parseStoredFollowUps } from "@/lib/utils/followups";
import { RECORDINGS_BUCKET } from "@/lib/storage/recording-path";
import { createClient } from "@/lib/supabase/server";
import { parseStoredCoverage } from "@/lib/utils/coverage";
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
  return { title: data?.title ? `Hasil — ${data.title}` : "Hasil Evaluasi" };
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
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("attempts")
      .select("attempt_number, overall_score")
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
  ]);

  const followUpQuestions = parseStoredFollowUps(attempt.follow_up_questions);

  const history = (historyRows ?? []).map((row) => ({
    attemptNumber: row.attempt_number,
    score: row.overall_score,
  }));

  const priorScores = history
    .filter(
      (entry) => entry.attemptNumber < attempt.attempt_number && entry.score !== null,
    )
    .map((entry) => entry.score)
    .filter((score): score is number => score !== null);
  const previousScore =
    priorScores.length > 0 ? (priorScores[priorScores.length - 1] ?? null) : null;

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
      previousScore={previousScore}
      history={history}
      status={attempt.evaluation_status}
      evaluationError={attempt.evaluation_error}
      overallScore={attempt.overall_score}
      subScores={subScores}
      coverage={parseStoredCoverage(attempt.coverage)}
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
            outlineTitles={(outlineRows ?? []).map((row) => row.title)}
          />
        ) : null
      }
    />
  );
}
