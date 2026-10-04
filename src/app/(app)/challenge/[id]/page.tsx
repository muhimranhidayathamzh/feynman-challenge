import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotebookView } from "@/components/challenge/notebook-view";
import { createClient } from "@/lib/supabase/server";
import { buildHistory } from "@/lib/utils/attempt-history";
import { parseStoredCoverage } from "@/lib/utils/coverage";
import { TREND_LENGTH, buildCoverageTrend } from "@/lib/utils/coverage-progress";
import { getDeadlineInfo } from "@/lib/utils/deadline";
import { effectiveMasteryState } from "@/lib/utils/mastery";
import { nextReviewLabel } from "@/lib/utils/review";
import { getUserClock } from "@/lib/utils/user-day";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenges")
    .select("title")
    .eq("id", id)
    .maybeSingle();
  return { title: data?.title ?? "Tantangan" };
}

export default async function ChallengePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: challenge } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!challenge) {
    notFound();
  }

  const clock = await getUserClock(supabase, challenge.user_id);
  const review = { box: challenge.review_box, nextReviewAt: challenge.next_review_at };

  const [
    { data: outline },
    { data: sources },
    { data: note },
    { data: recent },
    { data: attempts },
  ] = await Promise.all([
    supabase
      .from("challenge_outlines")
      .select("*")
      .eq("challenge_id", id)
      .order("order_index"),
    supabase
      .from("challenge_sources")
      .select("*")
      .eq("challenge_id", id)
      .order("created_at"),
    supabase.from("challenge_notes").select("*").eq("challenge_id", id).maybeSingle(),
    // Last scored attempts, for the per-point coverage trend.
    supabase
      .from("attempts")
      .select("id, attempt_number, coverage")
      .eq("challenge_id", id)
      .eq("evaluation_status", "completed")
      .not("overall_score", "is", null)
      .order("attempt_number", { ascending: false })
      .limit(TREND_LENGTH),
    // Every attempt, whatever its state, for "Riwayat percobaan" (Prompt 4.1).
    supabase
      .from("attempts")
      .select(
        "id, attempt_number, created_at, evaluation_status, overall_score, max_possible_score, hint_level_used, audio_issue",
      )
      .eq("challenge_id", id)
      .order("attempt_number", { ascending: false }),
  ]);

  const outlineItems = (outline ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
  }));
  const trend = buildCoverageTrend(
    (recent ?? []).map((row) => ({
      attemptNumber: row.attempt_number,
      coverage: parseStoredCoverage(row.coverage),
      href: `/challenge/${id}/result/${row.id}`,
    })),
    outlineItems,
  );

  return (
    <NotebookView
      id={challenge.id}
      title={challenge.title}
      masteryState={effectiveMasteryState(challenge.mastery_state, review, clock.today)}
      status={challenge.status}
      deadline={challenge.deadline}
      deadlineInfo={getDeadlineInfo(challenge.deadline, clock.today)}
      nextReview={nextReviewLabel(review.nextReviewAt, clock.today)}
      reviewBox={review.box}
      outline={outlineItems}
      trend={trend}
      history={buildHistory(attempts ?? [], {
        challengeId: id,
        timeZone: clock.timeZone,
        today: clock.today,
      })}
      sources={(sources ?? []).map((source) => ({
        id: source.id,
        title: source.title,
        url: source.url,
        type: source.source_type,
      }))}
      notes={note?.content ?? ""}
    />
  );
}
