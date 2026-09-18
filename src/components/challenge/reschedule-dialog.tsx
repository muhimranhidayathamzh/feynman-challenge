"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { ChallengePatchResponseSchema } from "@/lib/api/contracts";
import { fetchJson } from "@/lib/api/fetch-json";

interface Props {
  open: boolean;
  onClose: () => void;
  challengeId: string;
  /** Current deadline "YYYY-MM-DD", or null. */
  currentDeadline: string | null;
}

/** Pick a new deadline day (or clear it). Refreshes server data on save. */
export function RescheduleDialog({ open, onClose, challengeId, currentDeadline }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState(currentDeadline ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toLocaleDateString("en-CA");

  async function save(deadline: string | null) {
    setSaving(true);
    setError(null);
    const result = await fetchJson(
      `/api/challenge/${challengeId}`,
      ChallengePatchResponseSchema,
      {
        method: "PATCH",
        // Rescheduling also (re)activates: you don't set a date for a paused goal.
        json: { deadline, status: "active" },
      },
    );
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.show({
      message: deadline ? "Tenggat diperbarui." : "Tenggat dihapus.",
      tone: "success",
    });
    onClose();
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!saving) onClose();
      }}
      title="Ubah tenggat"
      description="Pilih hari baru untuk menyelesaikan tantangan ini. Santai saja, yang penting konsisten."
      footer={
        <>
          {currentDeadline ? (
            <Button variant="ghost" onClick={() => void save(null)} disabled={saving}>
              Hapus tenggat
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button onClick={() => void save(value)} loading={saving} disabled={!value}>
            Simpan
          </Button>
        </>
      }
    >
      <Field id={`reschedule-${challengeId}`} label="Tenggat baru" error={error}>
        <Input
          type="date"
          min={today}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={saving}
        />
      </Field>
    </Dialog>
  );
}
