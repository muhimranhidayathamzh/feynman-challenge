"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, CalendarClock, CircleCheck, Play, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ChallengePatchResponseSchema } from "@/lib/api/contracts";
import { fetchJson } from "@/lib/api/fetch-json";
import { statusActions } from "@/lib/utils/challenge-status";
import type { ChallengeStatus } from "@/types";

import { RescheduleDialog } from "./reschedule-dialog";

const ACTION_ICON: Record<ChallengeStatus, LucideIcon> = {
  active: Play,
  parked: Archive,
  completed: CircleCheck,
};

interface Props {
  challengeId: string;
  status: ChallengeStatus;
  deadline: string | null;
}

/** Lifecycle actions for one challenge: reschedule, park, complete, reactivate. */
export function ChallengeActions({ challengeId, status, deadline }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [rescheduling, setRescheduling] = useState(false);
  const [pending, setPending] = useState<ChallengeStatus | null>(null);

  async function changeStatus(nextStatus: ChallengeStatus, done: string) {
    setPending(nextStatus);
    const result = await fetchJson(
      `/api/challenge/${challengeId}`,
      ChallengePatchResponseSchema,
      {
        method: "PATCH",
        json: { status: nextStatus },
      },
    );
    setPending(null);
    if (!result.ok) {
      toast.show({ message: result.error, tone: "error" });
      return;
    }
    toast.show({ message: done, tone: "success" });
    router.refresh();
  }

  return (
    <div className="row flex-wrap gap-2" role="group" aria-label="Aksi tantangan">
      <Button
        variant="secondary"
        size="sm"
        icon={CalendarClock}
        onClick={() => setRescheduling(true)}
        disabled={pending !== null}
      >
        Ubah tenggat
      </Button>
      {statusActions(status).map((action) => (
        <Button
          key={action.nextStatus}
          variant="ghost"
          size="sm"
          icon={ACTION_ICON[action.nextStatus]}
          loading={pending === action.nextStatus}
          disabled={pending !== null && pending !== action.nextStatus}
          onClick={() => void changeStatus(action.nextStatus, action.done)}
        >
          {action.label}
        </Button>
      ))}
      <RescheduleDialog
        open={rescheduling}
        onClose={() => setRescheduling(false)}
        challengeId={challengeId}
        currentDeadline={deadline}
      />
    </div>
  );
}
