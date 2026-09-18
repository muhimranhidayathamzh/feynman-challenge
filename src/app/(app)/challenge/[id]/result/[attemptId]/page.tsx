import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EvaluationResults } from "@/components/evaluation/evaluation-results";
import { createClient } from "@/lib/supabase/server";
import type { Coverage, Json } from "@/types";

type PageProps = { params: Promise<{ id: string; attemptId: string }> };

function toStringArray(value: Json | null): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function toCoverage(value: Json | null): Coverage[] {
  if (!Array.isArray(value)) return [];
  const out: Coverage[] = [];
  for (const item of value) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const { topic, status, note } = item;
      if (
        typeof topic === "string" &&
        (status === "covered" || status === "partial" || status === "missing") &&
        typeof note === "string"
      ) {
        out.push({ topic, status, note });
      }
    }
  }
  return out;
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

  const { data: historyRows } = await supabase
    .from("attempts")
    .select("attempt_number, overall_score")
    .eq("challenge_id", id)
    .order("attempt_number");

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
      coverage={toCoverage(attempt.coverage)}
      feedback={attempt.feedback}
      strengths={toStringArray(attempt.strengths)}
      improvements={toStringArray(attempt.improvements)}
      transcript={attempt.transcript}
    />
  );
}
