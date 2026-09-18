import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { RecordingExperience } from "@/components/recording/recording-experience";
import { createClient } from "@/lib/supabase/server";
import { buildHints } from "@/lib/utils/hints";

type PageProps = { params: Promise<{ id: string }> };

const DEFAULT_DURATION_SEC = 180;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenges")
    .select("title")
    .eq("id", id)
    .maybeSingle();
  return { title: data?.title ? `Rekam — ${data.title}` : "Rekam" };
}

export default async function RecordPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: challenge } = await supabase
    .from("challenges")
    .select("title, recording_duration_sec")
    .eq("id", id)
    .maybeSingle();

  if (!challenge) {
    notFound();
  }

  const { data: outline } = await supabase
    .from("challenge_outlines")
    .select("title, description, keywords, guiding_question")
    .eq("challenge_id", id)
    .order("order_index");

  // Shuffle seed = challenge id: stable across visits, different per challenge.
  const hints = buildHints(outline ?? [], id);

  return (
    <RecordingExperience
      challengeId={id}
      userId={user.id}
      title={challenge.title}
      durationSec={challenge.recording_duration_sec ?? DEFAULT_DURATION_SEC}
      keywords={hints.keywords}
      questions={hints.questions}
      outline={hints.outline}
      hintsMissing={hints.missing}
    />
  );
}
