"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DemoSeedResponseSchema } from "@/lib/api/contracts";
import { fetchJson } from "@/lib/api/fetch-json";
import { authErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";

interface Props {
  onError: (message: string) => void;
}

/**
 * "Coba tanpa akun": signs in anonymously (needs Anonymous Sign-Ins enabled in
 * Supabase, see README), seeds the example challenge, and lands on its
 * evaluated attempt. The account can later be kept from Pengaturan.
 */
export function DemoButton({ onError }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInAnonymously({
      options: {
        data: {
          display_name: "Tamu",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      },
    });
    if (error) {
      onError(authErrorMessage(error));
      setLoading(false);
      return;
    }

    const result = await fetchJson("/api/demo/seed", DemoSeedResponseSchema, {
      method: "POST",
    });
    // The demo account works even if seeding failed: fall back to the dashboard.
    const target = !result.ok
      ? "/"
      : result.data.attemptId
        ? `/challenge/${result.data.challengeId}/result/${result.data.attemptId}`
        : `/challenge/${result.data.challengeId}`;
    router.replace(target);
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="lg"
      block
      icon={Sparkles}
      loading={loading}
      onClick={() => void handleClick()}
    >
      Coba tanpa akun
    </Button>
  );
}
