import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NotebookHeader } from "@/components/challenge/notebook-header";
import { NotesEditor } from "@/components/challenge/notes-editor";
import { OutlineEditor } from "@/components/challenge/outline-editor";
import { SourceList } from "@/components/challenge/source-list";
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
  return { title: data?.title ?? "Challenge" };
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
    <section
      className="stack"
      style={{ gap: "var(--space-6)", maxWidth: "44rem", marginInline: "auto" }}
    >
      <NotebookHeader
        id={challenge.id}
        initialTitle={challenge.title}
        masteryState={effectiveMasteryState(
          challenge.mastery_state,
          challenge.last_attempt_at,
          clock.now,
        )}
        deadlineInfo={getDeadlineInfo(challenge.deadline, clock.today)}
      />

      <div className="card stack" style={{ gap: "var(--space-4)" }}>
        <h3>📋 Learning Outline</h3>
        <OutlineEditor
          challengeId={challenge.id}
          initialItems={(outline ?? []).map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
          }))}
        />
      </div>

      <div className="card stack" style={{ gap: "var(--space-4)" }}>
        <h3>📚 Sumber Belajar</h3>
        <SourceList
          challengeId={challenge.id}
          initialSources={(sources ?? []).map((source) => ({
            id: source.id,
            title: source.title,
            url: source.url,
            type: source.source_type,
          }))}
        />
      </div>

      <div className="card stack" style={{ gap: "var(--space-4)" }}>
        <h3>✏️ Catatan</h3>
        <NotesEditor challengeId={challenge.id} initialContent={note?.content ?? ""} />
      </div>

      <Link
        href={`/challenge/${challenge.id}/record`}
        className="btn btn-primary btn-lg btn-block"
      >
        🎙️ Start Recording
      </Link>
    </section>
  );
}
