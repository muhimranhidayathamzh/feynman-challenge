"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";

import { useCaptcha } from "./captcha";

interface Props {
  onError: (message: string) => void;
  /**
   * "ghost" under the sign-in form, which already has its own primary action.
   * "primary" on the landing page, where trying the demo IS the main action
   * (DESIGN.md: one accented action per screen).
   */
  variant?: "primary" | "ghost";
  /** The landing phrases the same action as the benefit ("Temukan celahmu"). */
  label?: string;
}

/**
 * "Coba tanpa akun": signs in anonymously (needs Anonymous Sign-Ins enabled in
 * Supabase, see README) and goes straight to "Tantangan baru", so the visitor
 * tries the product on a topic of their own rather than reading a prepared
 * example (V.9). The account can later be kept from Pengaturan.
 *
 * With CAPTCHA on (5.1), the check appears only after the click, so the
 * landing stays clean, and the sign-in continues as soon as it passes.
 */
export function DemoButton({
  onError,
  variant = "ghost",
  label = "Coba tanpa akun",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const captcha = useCaptcha();
  const { token, reset } = captcha;

  const signIn = useCallback(
    async (captchaToken: string | null) => {
      setLoading(true);
      const supabase = createClient();
      const { error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            display_name: "Tamu",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          ...(captchaToken && { captchaToken }),
        },
      });
      if (error) {
        onError(authErrorMessage(error));
        setLoading(false);
        setVerifying(false);
        reset();
        return;
      }

      router.replace("/challenge/new");
      router.refresh();
    },
    [onError, reset, router],
  );

  // CAPTCHA on: wait for the check, then carry on without a second click.
  useEffect(() => {
    if (verifying && token && !loading) void signIn(token);
  }, [verifying, token, loading, signIn]);

  function handleClick() {
    if (captcha.enabled && !token) {
      setVerifying(true);
      return;
    }
    void signIn(token);
  }

  return (
    <>
      <Button
        variant={variant}
        size="lg"
        block
        icon={Sparkles}
        loading={loading || (verifying && !token)}
        onClick={handleClick}
      >
        {label}
      </Button>
      {verifying && captcha.widget}
    </>
  );
}
