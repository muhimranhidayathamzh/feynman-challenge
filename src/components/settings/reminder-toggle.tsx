"use client";

import { useState } from "react";

import { useToast } from "@/components/ui/toast";
import { ProfileResponseSchema } from "@/lib/api/contracts";
import { fetchJson } from "@/lib/api/fetch-json";

/**
 * Review reminder emails on or off (Prompt 5.4). Saved at once; the change is
 * rolled back on screen if saving fails.
 */
export function ReminderToggle({ initial }: { initial: boolean }) {
  const toast = useToast();
  const [on, setOn] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function change(next: boolean) {
    setOn(next);
    setSaving(true);
    const result = await fetchJson("/api/profile", ProfileResponseSchema, {
      method: "PATCH",
      json: { review_reminders: next },
    });
    setSaving(false);
    if (!result.ok) {
      setOn(!next);
      toast.show({ message: result.error, tone: "error" });
      return;
    }
    toast.show({
      message: next ? "Pengingat review menyala." : "Pengingat review dimatikan.",
      tone: "success",
    });
  }

  return (
    <label className="theme-option">
      <input
        type="checkbox"
        checked={on}
        disabled={saving}
        onChange={(event) => void change(event.target.checked)}
      />
      <span className="stack gap-1">
        <span className="font-semibold">Ingatkan aku lewat email</span>
        <span className="text-secondary text-sm">
          Pada hari sebuah review jatuh tempo, paling banyak sekali sehari. Setiap email
          punya tautan untuk berhenti.
        </span>
      </span>
    </label>
  );
}
