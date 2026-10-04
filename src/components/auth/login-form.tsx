"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Field, Input } from "@/components/ui/field";
import { authErrorCode, authErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";

import type { AuthFeatures } from "@/lib/auth/auth-features";

import { useCaptcha } from "./captcha";
import { DemoButton } from "./demo-button";
import { GoogleButton } from "./google-button";

interface Props {
  /** Already validated with safeNext() on the server. */
  next: string;
  /** Error forwarded by the auth callback (?error=), if any. */
  initialError: string | null;
  /** A success notice by code from another page (e.g. account deleted). */
  initialNotice?: string | null;
  /** Provider switches from Supabase; disabled options are hidden. */
  features: AuthFeatures;
}

export function LoginForm({ next, initialError, initialNotice = null, features }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
  const [loading, setLoading] = useState(false);
  const captcha = useCaptcha();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNeedsConfirmation(false);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captcha.options,
    });

    if (signInError) {
      setError(authErrorMessage(signInError));
      setNeedsConfirmation(authErrorCode(signInError) === "email_not_confirmed");
      setLoading(false);
      captcha.reset();
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
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        ...captcha.options,
      },
    });
    captcha.reset();
    if (resendError) {
      setError(authErrorMessage(resendError));
      setResendState("idle");
      return;
    }
    setResendState("sent");
  }

  return (
    <Sheet as="section" className="stack gap-5">
      <div className="stack gap-1">
        <h2 className="text-xl">Masuk</h2>
        <p className="text-secondary text-sm">Lanjutkan tantangan belajarmu.</p>
      </div>

      {initialNotice && !error && (
        <div className="alert alert-success" role="status">
          {initialNotice}
        </div>
      )}
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
              disabled={!captcha.ready}
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

      {features.google && (
        <>
          <GoogleButton next={next} onError={setError} />

          <div className="divider" role="separator">
            <span>atau dengan email</span>
          </div>
        </>
      )}

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

        {captcha.widget}

        <Button
          type="submit"
          size="lg"
          block
          className="mt-2"
          icon={LogIn}
          loading={loading}
          disabled={!captcha.ready}
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

      {features.anonymous && (
        <>
          <div className="divider" role="separator">
            <span>atau lihat dulu</span>
          </div>

          <div className="stack gap-2">
            <DemoButton onError={setError} />
            <p className="text-muted text-xs text-center">
              Tanpa email: langsung coba dengan topikmu sendiri. Kuota AI dibatasi, dan
              progresmu bisa disimpan jadi akun kapan saja.
            </p>
          </div>
        </>
      )}
    </Sheet>
  );
}
