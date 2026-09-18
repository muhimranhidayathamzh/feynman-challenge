"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, CalendarClock } from "lucide-react";

import { RescheduleDialog } from "@/components/challenge/reschedule-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ChallengePatchResponseSchema } from "@/lib/api/contracts";
import { fetchJson } from "@/lib/api/fetch-json";

interface Props {
  challengeId: string;
  title: string;
  deadline: string | null;
}

/**
 * Spec §6.5: once even the automatic extension has passed, ask the user —
 * "Mau reschedule atau istirahat dulu?" — instead of nagging.
 */
export function OverdueActions({ challengeId, title, deadline }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [rescheduling, setRescheduling] = useState(false);
  const [parking, setParking] = useState(false);

  async function park() {
    setParking(true);
    const result = await fetchJson(
      `/api/challenge/${challengeId}`,
      ChallengePatchResponseSchema,
      {
        method: "PATCH",
        json: { status: "parked" },
      },
    );
    setParking(false);
    if (!result.ok) {
      toast.show({ message: result.error, tone: "error" });
      return;
    }
    toast.show({ message: `"${title}" diistirahatkan dulu.`, tone: "success" });
    router.refresh();
  }

  return (
    <div className="row flex-wrap gap-2">
      <Button
        variant="secondary"
        size="sm"
        icon={CalendarClock}
        onClick={() => setRescheduling(true)}
        aria-label={`Ubah tenggat "${title}"`}
      >
        Ubah tenggat
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={Archive}
        loading={parking}
        onClick={() => void park()}
        aria-label={`Istirahatkan "${title}"`}
      >
        Istirahat dulu
      </Button>
      <RescheduleDialog
        open={rescheduling}
        onClose={() => setRescheduling(false)}
        challengeId={challengeId}
        currentDeadline={deadline}
      />
    </div>
  );
}
