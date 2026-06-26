"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

type SaveState = "idle" | "saving" | "saved" | "error";

const STATUS_TEXT: Record<SaveState, string> = {
  idle: "",
  saving: "Menyimpan…",
  saved: "Tersimpan ✓",
  error: "Gagal menyimpan",
};

interface Props {
  challengeId: string;
  initialContent: string;
}

export function NotesEditor({ challengeId, initialContent }: Props) {
  const [content, setContent] = useState(initialContent);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(initialContent);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function save(value: string) {
    if (value === lastSaved.current) return;
    setSaveState("saving");
    try {
      const res = await fetch(`/api/challenge/${challengeId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: value }),
      });
      if (!res.ok) {
        setSaveState("error");
        return;
      }
      lastSaved.current = value;
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    setContent(value);
    setSaveState("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void save(value);
    }, 800);
  }

  return (
    <div className="stack" style={{ gap: "var(--space-2)" }}>
      <textarea
        className="textarea"
        value={content}
        onChange={handleChange}
        placeholder="Tulis catatanmu di sini… (mendukung markdown)"
        style={{ minHeight: "10rem" }}
        aria-label="Catatan pribadi"
      />
      <span
        className="save-status"
        aria-live="polite"
        style={saveState === "error" ? { color: "var(--error)" } : undefined}
      >
        {STATUS_TEXT[saveState]}
      </span>
    </div>
  );
}
