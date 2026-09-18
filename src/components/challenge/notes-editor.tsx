"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";

import { Textarea } from "@/components/ui/field";
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

interface Props {
  challengeId: string;
  initialContent: string;
}

export function NotesEditor({ challengeId, initialContent }: Props) {
  const [content, setContent] = useState(initialContent);
  const [saveState, setSaveState] = useState<SaveState>("idle");
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

  return (
    <div className="stack gap-2">
      <Textarea
        className="textarea-notes"
        value={content}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Tulis catatanmu di sini… (mendukung markdown)"
        aria-label="Catatan pribadi"
      />
      <span
        className={saveState === "error" ? "save-status text-error" : "save-status"}
        aria-live="polite"
      >
        {STATUS_TEXT[saveState]}
      </span>
    </div>
  );
}
