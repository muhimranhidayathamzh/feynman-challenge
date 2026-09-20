"use client";

import { useState } from "react";
import { Lightbulb, Mic } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTitle } from "@/components/ui/sheet";
import { Icon } from "@/components/ui/icon";
import type { FollowupAnswer } from "@/lib/api/contracts";
import { VERDICT_META, type FollowUpQuestion } from "@/lib/utils/followups";

import { FollowUpRecorder } from "./follow-up-recorder";

interface Props {
  attemptId: string;
  challengeId: string;
  userId: string;
  questions: FollowUpQuestion[];
  initialAnswers: FollowupAnswer[];
  /** Outline titles in order, to label which point a question targets. */
  outlineTitles: string[];
}

/**
 * "Uji Pemahamanmu": Socratic follow-ups from the evaluation. Answering is
 * for learning only; it never changes the score, mastery, or review schedule.
 */
export function FollowUpSection({
  attemptId,
  challengeId,
  userId,
  questions,
  initialAnswers,
  outlineTitles,
}: Props) {
  const [answers, setAnswers] = useState<Map<number, FollowupAnswer>>(
    () => new Map(initialAnswers.map((answer) => [answer.question_index, answer])),
  );
  const [active, setActive] = useState<number | null>(null);

  if (questions.length === 0) return null;

  return (
    <Sheet as="section" className="stack gap-4" aria-labelledby="followup-title">
      <div className="stack gap-1">
        <SheetTitle>
          <span id="followup-title">Uji pemahamanmu</span>
        </SheetTitle>
        <p className="text-secondary text-sm">
          Jawab singkat secara lisan. Ini untuk belajar, tidak mengubah skormu.
        </p>
      </div>

      <ol className="stack gap-4">
        {questions.map((question, index) => {
          const answer = answers.get(index);
          const point =
            question.outline_index !== null
              ? outlineTitles[question.outline_index - 1]
              : undefined;
          const verdict = answer?.verdict ? VERDICT_META[answer.verdict] : null;
          return (
            <li
              key={`${index}-${question.question}`}
              className="followup-item stack gap-3"
            >
              <div className="stack gap-1">
                {point && <span className="text-muted text-xs">Poin: {point}</span>}
                <p className="font-medium">{question.question}</p>
              </div>

              {answer && active !== index && (
                <div className="stack gap-2" aria-live="polite">
                  {verdict && (
                    <Badge tone={verdict.tone} className="self-start">
                      {verdict.label}
                    </Badge>
                  )}
                  {answer.feedback && (
                    <p className="text-secondary text-sm">{answer.feedback}</p>
                  )}
                  {answer.hint && (
                    <p className="followup-hint text-sm">
                      <Icon icon={Lightbulb} size={14} />
                      <span>{answer.hint}</span>
                    </p>
                  )}
                  {answer.transcript && (
                    <details className="text-sm">
                      <summary className="text-muted">Transkrip jawabanmu</summary>
                      <p className="text-secondary pre-wrap mt-2">{answer.transcript}</p>
                    </details>
                  )}
                </div>
              )}

              {active === index ? (
                <FollowUpRecorder
                  attemptId={attemptId}
                  challengeId={challengeId}
                  userId={userId}
                  questionIndex={index}
                  onCancel={() => setActive(null)}
                  onAnswered={(next) => {
                    setAnswers((prev) => new Map(prev).set(index, next));
                    setActive(null);
                  }}
                />
              ) : (
                <Button
                  variant={answer ? "ghost" : "secondary"}
                  size="sm"
                  icon={Mic}
                  className="self-start"
                  disabled={active !== null}
                  onClick={() => setActive(index)}
                >
                  {answer ? "Jawab lagi" : "Jawab"}
                </Button>
              )}
            </li>
          );
        })}
      </ol>
    </Sheet>
  );
}
