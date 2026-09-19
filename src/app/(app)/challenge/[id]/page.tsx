import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotebookView } from "@/components/challenge/notebook-view";
import { createClient } from "@/lib/supabase/server";
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

  const [{ data: outline }, { data: sources }, { data: note }, { data: recent }] =
    await Promise.all([
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
        .select("attempt_number, coverage")
        .eq("challenge_id", id)
        .eq("evaluation_status", "completed")
        .not("overall_score", "is", null)
        .order("attempt_number", { ascending: false })
        .limit(TREND_LENGTH),
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
