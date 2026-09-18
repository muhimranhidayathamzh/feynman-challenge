"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";

import {
  CreateChallengeResponseSchema,
  GenerateResponseSchema,
  type GenerateResponse as GeneratedPlan,
} from "@/lib/api/contracts";
import { fetchJson } from "@/lib/api/fetch-json";
import { SOURCE_TYPE_META, formatDuration } from "@/lib/utils/labels";

type Status = "idle" | "generating" | "preview" | "creating";

export function CreateForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Local calendar day for the picker's minimum (en-CA formats as YYYY-MM-DD).
  const today = new Date().toLocaleDateString("en-CA");
  const busy = status === "generating" || status === "creating";
  const editing = status === "idle" || status === "generating";

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (topic.trim().length < 3) {
      setError("Topik minimal 3 karakter.");
      return;
    }
    setError(null);
    setStatus("generating");

    const result = await fetchJson("/api/challenge/generate", GenerateResponseSchema, {
      method: "POST",
      json: { topic: topic.trim() },
    });
    if (!result.ok) {
      setError(result.error);
      setStatus("idle");
      return;
    }
    setPlan(result.data);
    setStatus("preview");
  }

  async function handleCreate() {
    if (!plan) return;
    setError(null);
    setStatus("creating");

    const result = await fetchJson("/api/challenge", CreateChallengeResponseSchema, {
      method: "POST",
      json: {
        topic: topic.trim(),
        deadline: deadline || null,
        estimated_duration_sec: plan.estimated_duration_sec,
        outline: plan.outline,
        sources: plan.sources,
      },
    });
    if (!result.ok) {
      setError(result.error);
      setStatus("preview");
      return;
    }
    router.push(`/challenge/${result.data.id}`);
  }

  function handleBackToEdit() {
    setStatus("idle");
    setPlan(null);
    setError(null);
  }

  return (
    <div className="stack gap-5">
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {editing && (
        <Card as="section" className="stack gap-5">
          <form className="stack gap-5" onSubmit={handleGenerate}>
            <Field id="topic" label="Apa yang ingin kamu kuasai?">
              <Input
                type="text"
                placeholder="mis. Quantum Entanglement"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                disabled={busy}
                minLength={3}
                maxLength={200}
                required
                autoFocus
              />
            </Field>

            <Field id="deadline" label="Tenggat" optional>
              <Input
                type="date"
                value={deadline}
                min={today}
                onChange={(event) => setDeadline(event.target.value)}
                disabled={busy}
              />
            </Field>

            <Button
              type="submit"
              size="lg"
              block
              icon={Sparkles}
              loading={status === "generating"}
              disabled={busy || topic.trim().length < 3}
            >
              {status === "generating" ? "AI sedang menyusun…" : "Susun Rencana Belajar"}
            </Button>
          </form>
        </Card>
      )}

      {status === "generating" && <PreviewSkeleton />}

      {(status === "preview" || status === "creating") && plan && (
        <Card as="section" className="stack gap-5 animate-fade-in-up">
          <div className="row-between">
            <h3>Rencana Belajar</h3>
            <Badge icon={Timer} title="Estimasi durasi rekaman">
              {formatDuration(plan.estimated_duration_sec)}
            </Badge>
          </div>

          <div className="stack gap-3">
            <h4 className="text-secondary text-sm">Outline Materi</h4>
            <ol className="stack gap-3">
              {plan.outline.map((item, index) => (
                <li key={`${index}-${item.title}`} className="row items-start gap-3">
                  <span className="badge" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div className="stack gap-1">
                    <span className="font-semibold">{item.title}</span>
                    {item.description && (
                      <span className="text-secondary text-sm">{item.description}</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {plan.sources.length > 0 && (
            <div className="stack gap-3">
              <h4 className="text-secondary text-sm">Sumber Belajar</h4>
              <ul className="stack gap-2">
                {plan.sources.map((source, index) => (
                  <li key={`${index}-${source.title}`} className="row gap-2">
                    <Icon
                      icon={SOURCE_TYPE_META[source.type].icon}
                      size={16}
                      label={SOURCE_TYPE_META[source.type].label}
                      className="source-type-icon"
                    />
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-accent text-sm"
                      >
                        {source.title}
                        <span className="visually-hidden"> (membuka tab baru)</span>
                      </a>
                    ) : (
                      <span className="text-sm">{source.title}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="row flex-wrap gap-3">
            <Button
              size="lg"
              icon={Check}
              onClick={handleCreate}
              loading={status === "creating"}
            >
              Buat Tantangan
            </Button>
            <Button
              variant="ghost"
              onClick={handleBackToEdit}
              disabled={status === "creating"}
            >
              Ganti topik
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <Card className="stack gap-4" aria-hidden="true">
      <Skeleton width="40%" height="1.5rem" />
      <Skeleton width="90%" />
      <Skeleton width="80%" />
      <Skeleton width="85%" />
      <Skeleton width="70%" />
    </Card>
  );
}
