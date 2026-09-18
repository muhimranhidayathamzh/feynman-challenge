"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { authErrorCode, authErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";

import { GoogleButton } from "./google-button";

interface Props {
  /** Already validated with safeNext() on the server. */
  next: string;
  /** Error forwarded by the auth callback (?error=), if any. */
  initialError: string | null;
}

export function LoginForm({ next, initialError }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNeedsConfirmation(false);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(authErrorMessage(signInError));
      setNeedsConfirmation(authErrorCode(signInError) === "email_not_confirmed");
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function handleResendConfirmation() {
    setResendState("sending");
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (resendError) {
      setError(authErrorMessage(resendError));
      setResendState("idle");
      return;
    }
    setResendState("sent");
  }

  return (
    <Card as="section" variant="glass" className="stack gap-5">
      <div className="stack gap-1">
        <h2 className="text-xl">Masuk</h2>
        <p className="text-secondary text-sm">Lanjutkan tantangan belajarmu.</p>
      </div>

      {error && (
        <div className="alert alert-error stack gap-2" role="alert">
          <span>{error}</span>
          {needsConfirmation && resendState !== "sent" && (
            <Button
              variant="secondary"
              size="sm"
              icon={Mail}
              className="self-start"
              loading={resendState === "sending"}
              onClick={() => void handleResendConfirmation()}
            >
              Kirim ulang email konfirmasi
            </Button>
          )}
        </div>
      )}
      {resendState === "sent" && (
        <div className="alert alert-success" role="status">
          Email konfirmasi dikirim ulang ke <strong>{email}</strong>. Cek kotak masuk dan
          folder spam.
        </div>
      )}

      <GoogleButton next={next} onError={setError} />

      <div className="divider" role="separator">
        <span>atau dengan email</span>
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        <Field id="email" label="Email">
          <Input
            type="email"
            autoComplete="email"
            required
            placeholder="kamu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={loading}
          />
        </Field>

        <Field
          id="password"
          label="Kata sandi"
          hint={
            <Link href="/lupa-password" className="link-accent">
              Lupa kata sandi?
            </Link>
          }
        >
          <Input
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          block
          className="mt-2"
          icon={LogIn}
          loading={loading}
        >
          Masuk
        </Button>
      </form>

      <p className="text-secondary text-sm text-center">
        Belum punya akun?{" "}
        <Link href="/signup" className="link-accent">
          Daftar
        </Link>
      </p>
    </Card>
  );
}
