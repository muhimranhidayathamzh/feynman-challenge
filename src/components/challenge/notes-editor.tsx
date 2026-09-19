"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { Eye, PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Illustration } from "@/components/ui/illustration";
import { Markdown } from "@/components/ui/markdown";
import { NoteEnvelopeSchema } from "@/lib/api/contracts";
import { fetchJson } from "@/lib/api/fetch-json";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const STATUS_TEXT: Record<SaveState, string> = {
  idle: "",
  dirty: "Belum tersimpan",
  saving: "Menyimpan…",
  saved: "Tersimpan ✓",
  error: "Gagal menyimpan",
};

const DEBOUNCE_MS = 800;

type Tab = "write" | "preview";

interface Props {
  challengeId: string;
  initialContent: string;
}

export function NotesEditor({ challengeId, initialContent }: Props) {
  const [content, setContent] = useState(initialContent);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  // Reading first when there is something to read (audit #12).
  const [tab, setTab] = useState<Tab>(initialContent.trim() ? "preview" : "write");
  const baseId = useId();
  const writeTabRef = useRef<HTMLButtonElement | null>(null);
  const previewTabRef = useRef<HTMLButtonElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(initialContent);
  const lastSaved = useRef(initialContent);
  const endpoint = `/api/challenge/${challengeId}/notes`;

  const save = useCallback(
    async (value: string) => {
      if (value === lastSaved.current) return;
      setSaveState("saving");
      const result = await fetchJson(endpoint, NoteEnvelopeSchema, {
        method: "PUT",
        json: { content: value },
      });
      if (!result.ok) {
        setSaveState("error");
        return;
      }
      lastSaved.current = value;
      // Only show "saved" if nothing newer was typed meanwhile.
      setSaveState(latest.current === value ? "saved" : "dirty");
    },
    [endpoint],
  );

  /**
   * Fire-and-forget save for moments when the page may go away (unmount,
   * navigation, tab hidden). `keepalive` lets the request outlive the page.
   */
  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const value = latest.current;
    if (value === lastSaved.current) return;
    lastSaved.current = value;
    void fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: value }),
      keepalive: true,
    }).catch(() => undefined);
  }, [endpoint]);

  useEffect(() => {
    const onPageHide = () => flush();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
      flush(); // unmount (client-side navigation): don't drop the last keystrokes
    };
  }, [flush]);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    latest.current = value;
    setContent(value);
    setSaveState(value === lastSaved.current ? "idle" : "dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void save(value);
    }, DEBOUNCE_MS);
  }

  function handleBlur() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
      void save(latest.current);
    }
  }

  function selectTab(next: Tab) {
    setTab(next);
    // Keep focus on the newly selected tab (arrow-key navigation).
    (next === "write" ? writeTabRef : previewTabRef).current?.focus();
  }

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      selectTab(tab === "write" ? "preview" : "write");
    }
  }

  return (
    <div className="stack gap-2">
      <div className="tabs tabs-compact" role="tablist" aria-label="Mode catatan">
        <button
          ref={previewTabRef}
          type="button"
          role="tab"
          id={`${baseId}-preview-tab`}
          aria-selected={tab === "preview"}
          aria-controls={`${baseId}-preview-panel`}
          tabIndex={tab === "preview" ? 0 : -1}
          className="tab"
          onClick={() => {
            handleBlur();
            setTab("preview");
          }}
          onKeyDown={handleTabKey}
        >
          <Icon icon={Eye} size={14} />
          Baca
        </button>
        <button
          ref={writeTabRef}
          type="button"
          role="tab"
          id={`${baseId}-write-tab`}
          aria-selected={tab === "write"}
          aria-controls={`${baseId}-write-panel`}
          tabIndex={tab === "write" ? 0 : -1}
          className="tab"
          onClick={() => setTab("write")}
          onKeyDown={handleTabKey}
        >
          <Icon icon={PenLine} size={14} />
          Tulis
        </button>
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-write-panel`}
        aria-labelledby={`${baseId}-write-tab`}
        hidden={tab !== "write"}
      >
        <Textarea
          className="textarea-notes"
          value={content}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Tulis catatanmu di sini… Mendukung markdown: **tebal**, _miring_, - daftar, [tautan](https://…)"
          aria-label="Catatan pribadi"
        />
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-preview-panel`}
        aria-labelledby={`${baseId}-preview-tab`}
        hidden={tab !== "preview"}
        className="notes-preview"
        tabIndex={0}
      >
        {content.trim() ? (
          <Markdown>{content}</Markdown>
        ) : (
          <div className="notes-empty">
            <Illustration name="catatan-kosong" />
            <p className="text-secondary">
              Belum ada catatan. Tulis ringkasan dengan kata-katamu sendiri: itu latihan
              menjelaskan yang paling murah.
            </p>
            <Button
              variant="secondary"
              size="sm"
              icon={PenLine}
              onClick={() => selectTab("write")}
            >
              Mulai menulis
            </Button>
          </div>
        )}
      </div>

      <span
        className={saveState === "error" ? "save-status text-error" : "save-status"}
        aria-live="polite"
      >
        {STATUS_TEXT[saveState]}
      </span>
    </div>
  );
}
