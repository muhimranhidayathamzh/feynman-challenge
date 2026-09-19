import { Mic } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Sheet, SheetTitle } from "@/components/ui/sheet";
import type { TrendPoint } from "@/lib/utils/coverage-progress";
import type { DeadlineInfo } from "@/lib/utils/deadline";
import type { ChallengeStatus, MasteryState } from "@/types";

import { NotebookHeader } from "./notebook-header";
import { NotesEditor } from "./notes-editor";
import { OutlineEditor } from "./outline-editor";
import type { OutlineItemData } from "./outline-item";
import { SourceList } from "./source-list";
import type { SourceData } from "./source-item";

interface Props {
  id: string;
  title: string;
  masteryState: MasteryState;
  status: ChallengeStatus;
  deadline: string | null;
  deadlineInfo: DeadlineInfo;
  nextReview: string | null;
  reviewBox: number;
  outline: OutlineItemData[];
  trend: Record<string, TrendPoint[]>;
  sources: SourceData[];
  notes: string;
}

/** Notebook markup. Data is loaded by the page (or the dev gallery). */
export function NotebookView(props: Props) {
  return (
    <section className="page notebook-page">
      <NotebookHeader
        id={props.id}
        initialTitle={props.title}
        masteryState={props.masteryState}
        status={props.status}
        deadline={props.deadline}
        deadlineInfo={props.deadlineInfo}
        nextReview={props.nextReview}
        reviewBox={props.reviewBox}
      />

      <Sheet
        as="section"
        className="stack gap-4"
        aria-label="Poin yang perlu kamu jelaskan"
      >
        <OutlineEditor
          challengeId={props.id}
          initialItems={props.outline}
          trend={props.trend}
        />
      </Sheet>

      <Sheet as="section" className="stack gap-4" aria-labelledby="sources-title">
        <SheetTitle id="sources-title">Sumber belajar</SheetTitle>
        <SourceList challengeId={props.id} initialSources={props.sources} />
      </Sheet>

      <Sheet as="section" className="stack gap-4" aria-labelledby="notes-heading">
        <SheetTitle id="notes-heading">Catatanmu</SheetTitle>
        <NotesEditor challengeId={props.id} initialContent={props.notes} />
      </Sheet>

      {/* Always within reach: sticks above the bottom nav on phones (audit #13). */}
      <div className="notebook-cta">
        <ButtonLink href={`/challenge/${props.id}/record`} size="lg" block icon={Mic}>
          Jelaskan sekarang
        </ButtonLink>
      </div>
    </section>
  );
}
