"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { ProfileResponseSchema } from "@/lib/api/contracts";
import { fetchJson } from "@/lib/api/fetch-json";

interface Props {
  initialDisplayName: string;
  initialTimezone: string;
  /** IANA zones supported by the server runtime. */
  timezones: string[];
}

export function ProfileForm({ initialDisplayName, initialTimezone, timezones }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const options = timezones.includes(timezone) ? timezones : [timezone, ...timezones];
  const dirty = displayName.trim() !== initialDisplayName || timezone !== initialTimezone;

  function applyDeviceTimezone() {
    const device = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (device) setTimezone(device);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const result = await fetchJson("/api/profile", ProfileResponseSchema, {
      method: "PATCH",
      json: { display_name: displayName.trim() || null, timezone },
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.show({ message: "Profil disimpan.", tone: "success" });
    router.refresh(); // header shows the new name
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      <Field id="display-name" label="Nama tampilan">
        <Input
          type="text"
          autoComplete="name"
          maxLength={60}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          disabled={saving}
        />
      </Field>
      <Field
        id="timezone"
        label="Zona waktu"
        hint="Dipakai untuk menghitung streak dan tenggat sesuai hari di tempatmu."
      >
        <Select
          className="w-full"
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
          disabled={saving}
        >
          {options.map((zone) => (
            <option key={zone} value={zone}>
              {zone.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
      </Field>
      <div className="row flex-wrap gap-2">
        <Button type="submit" icon={Save} loading={saving} disabled={!dirty}>
          Simpan profil
        </Button>
        <Button variant="ghost" icon={LocateFixed} onClick={applyDeviceTimezone}>
          Pakai zona waktu perangkat
        </Button>
      </div>
    </form>
  );
}
