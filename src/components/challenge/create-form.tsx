"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
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
import { sourceLink } from "@/lib/utils/source-link";

type Status = "idle" | "generating" | "preview" | "creating";

/**
 * Starting points for someone facing an empty box (V.7). Everyday topics an
 * adult half-understands, so the first try feels possible, not intimidating.
 */
const TOPIC_SUGGESTIONS = [
  "Kenapa langit berwarna biru",
  "Cara kerja bunga majemuk",
  "Kenapa pesawat bisa terbang",
  "Hukum permintaan dan penawaran",
  "Cara kerja internet",
] as const;

const MIN_TOPIC = 3;

export function CreateForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topicError, setTopicError] = useState<string | null>(null);

  // Local calendar day for the picker's minimum (en-CA formats as YYYY-MM-DD).
  const today = new Date().toLocaleDateString("en-CA");
  const busy = status === "generating" || status === "creating";
  const editing = status === "idle" || status === "generating";

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (topic.trim().length < MIN_TOPIC) {
      setTopicError(
        topic.trim().length === 0
          ? "Tulis topiknya dulu, atau pilih salah satu contoh."
          : `Topik minimal ${MIN_TOPIC} karakter.`,
      );
      return;
    }
    setTopicError(null);
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
        <Sheet as="section" className="stack gap-5">
          {/* noValidate: the message below the field explains itself better
              than the browser's own bubble. */}
          <form className="stack gap-5" onSubmit={handleGenerate} noValidate>
            <div className="stack gap-3">
              <Field id="topic" label="Apa yang ingin kamu pahami?" error={topicError}>
                <Input
                  type="text"
                  placeholder="mis. Kenapa bulan punya fase"
                  value={topic}
                  onChange={(event) => {
                    setTopic(event.target.value);
                    if (topicError) setTopicError(null);
                  }}
                  disabled={busy}
                  maxLength={200}
                  autoFocus
                />
              </Field>

              {topic.trim() === "" && !busy && (
                <div className="stack gap-2">
                  <p id="topic-suggestions-label" className="text-muted text-sm">
                    Atau mulai dari salah satu ini:
                  </p>
                  <ul
                    className="suggestion-list"
                    aria-labelledby="topic-suggestions-label"
                  >
                    {TOPIC_SUGGESTIONS.map((suggestion) => (
                      <li key={suggestion}>
                        <button
                          type="button"
                          className="suggestion-chip"
                          onClick={() => {
                            setTopic(suggestion);
                            setTopicError(null);
                            // The chips unmount once the field has text, which
                            // would drop keyboard focus onto <body>.
                            document.getElementById("topic")?.focus();
                          }}
                        >
                          {suggestion}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Field
              id="deadline"
              label="Tenggat"
              optional
              hint="Kosongkan kalau mau belajar santai. Tenggat yang terlewat diperpanjang sekali, tanpa hukuman."
            >
              <Input
                type="date"
                value={deadline}
                min={today}
                onChange={(event) => setDeadline(event.target.value)}
                disabled={busy}
              />
            </Field>

            <div className="stack gap-2">
              <Button
                type="submit"
                size="lg"
                block
                icon={Sparkles}
                loading={status === "generating"}
                disabled={busy}
              >
                {status === "generating"
                  ? "AI sedang menyusun…"
                  : "Susun rencana belajar"}
              </Button>
              <p className="text-muted text-sm text-center">
                Kamu bisa meninjau rencananya dulu sebelum disimpan.
              </p>
            </div>
          </form>
        </Sheet>
      )}

      {status === "generating" && <PreviewSkeleton />}

      {(status === "preview" || status === "creating") && plan && (
        <Sheet as="section" className="stack gap-5 animate-fade-in-up">
          <div className="row-between">
            <h2 className="sheet-title">Rencana belajar</h2>
            <Badge icon={Timer} title="Estimasi durasi rekaman">
              {formatDuration(plan.estimated_duration_sec)}
            </Badge>
          </div>

          <div className="stack gap-3">
            <h3 className="text-secondary text-sm">Poin yang perlu dijelaskan</h3>
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
              <h3 className="text-secondary text-sm">Sumber belajar</h3>
              <ul className="stack gap-2">
                {plan.sources.map((source, index) => (
                  <li key={`${index}-${source.title}`} className="row gap-2">
                    <Icon
                      icon={SOURCE_TYPE_META[source.type].icon}
                      size={16}
                      label={SOURCE_TYPE_META[source.type].label}
                      className="source-type-icon"
                    />
                    {/* Same rule as the notebook: a title always opens something. */}
                    <span className="stack gap-0">
                      <a
                        href={sourceLink(source).href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-accent text-sm"
                      >
                        {source.title}
                        <span className="visually-hidden">
                          {sourceLink(source).kind === "search"
                            ? " (membuka pencarian di tab baru)"
                            : " (membuka tab baru)"}
                        </span>
                      </a>
                      <span className="text-muted text-xs">
                        {sourceLink(source).label}
                      </span>
                    </span>
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
              Simpan tantangan
            </Button>
            <Button
              variant="ghost"
              onClick={handleBackToEdit}
              disabled={status === "creating"}
            >
              Ganti topik
            </Button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <Sheet className="stack gap-4" aria-hidden="true">
      <Skeleton width="40%" height="1.5rem" />
      <Skeleton width="90%" />
      <Skeleton width="80%" />
      <Skeleton width="85%" />
      <Skeleton width="70%" />
    </Sheet>
  );
}
