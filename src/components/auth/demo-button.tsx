"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";

interface Props {
  onError: (message: string) => void;
  /**
   * "ghost" under the sign-in form, which already has its own primary action.
   * "primary" on the landing page, where trying the demo IS the main action
   * (DESIGN.md: one accented action per screen).
   */
  variant?: "primary" | "ghost";
}

/**
 * "Coba tanpa akun": signs in anonymously (needs Anonymous Sign-Ins enabled in
 * Supabase, see README) and goes straight to "Tantangan baru", so the visitor
 * tries the product on a topic of their own rather than reading a prepared
 * example (V.9). The account can later be kept from Pengaturan.
 */
export function DemoButton({ onError, variant = "ghost" }: Props) {
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

    router.replace("/challenge/new");
    router.refresh();
  }

  return (
    <Button
      variant={variant}
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
