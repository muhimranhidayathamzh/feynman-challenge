import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RecordingExperience } from "@/components/recording/recording-experience";
import { createClient } from "@/lib/supabase/server";

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
    .select("title, description")
    .eq("challenge_id", id)
    .order("order_index");

  const items = outline ?? [];

  return (
    <RecordingExperience
      challengeId={id}
      title={challenge.title}
      durationSec={challenge.recording_duration_sec ?? DEFAULT_DURATION_SEC}
      keywords={items.map((o) => o.title)}
      questions={items.map((o) => `Bisakah kamu menjelaskan: ${o.title}?`)}
      outline={items.map((o) => ({ title: o.title, description: o.description }))}
    />
  );
}
