import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClipboardList, Library, Mic, NotebookPen } from "lucide-react";

import { NotebookHeader } from "@/components/challenge/notebook-header";
import { NotesEditor } from "@/components/challenge/notes-editor";
import { OutlineEditor } from "@/components/challenge/outline-editor";
import { SourceList } from "@/components/challenge/source-list";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getDeadlineInfo } from "@/lib/utils/deadline";
import { effectiveMasteryState } from "@/lib/utils/mastery";
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

  const [{ data: outline }, { data: sources }, { data: note }] = await Promise.all([
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
  ]);

  return (
    <section className="page">
      <NotebookHeader
        id={challenge.id}
        initialTitle={challenge.title}
        masteryState={effectiveMasteryState(
          challenge.mastery_state,
          challenge.last_attempt_at,
          clock.now,
        )}
        status={challenge.status}
        deadline={challenge.deadline}
        deadlineInfo={getDeadlineInfo(challenge.deadline, clock.today)}
      />

      <Card className="stack gap-4">
        <CardTitle icon={ClipboardList}>Outline Materi</CardTitle>
        <OutlineEditor
          challengeId={challenge.id}
          initialItems={(outline ?? []).map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
          }))}
        />
      </Card>

      <Card className="stack gap-4">
        <CardTitle icon={Library}>Sumber Belajar</CardTitle>
        <SourceList
          challengeId={challenge.id}
          initialSources={(sources ?? []).map((source) => ({
            id: source.id,
            title: source.title,
            url: source.url,
            type: source.source_type,
          }))}
        />
      </Card>

      <Card className="stack gap-4">
        <CardTitle icon={NotebookPen}>Catatan</CardTitle>
        <NotesEditor challengeId={challenge.id} initialContent={note?.content ?? ""} />
      </Card>

      <ButtonLink href={`/challenge/${challenge.id}/record`} size="lg" block icon={Mic}>
        Mulai Rekam
      </ButtonLink>
    </section>
  );
}
