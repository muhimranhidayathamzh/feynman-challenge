"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { KeyRound, MailCheck } from "lucide-react";

import { useCaptcha } from "@/components/auth/captcha";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Field, Input } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { authErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const captcha = useCaptcha();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent("/atur-ulang-password")}`,
      ...captcha.options,
    });
    setLoading(false);
    if (resetError) {
      setError(authErrorMessage(resetError));
      captcha.reset();
      return;
    }
    // Same message whether or not the email exists (no account enumeration).
    setSent(true);
  }

  if (sent) {
    return (
      <Sheet as="section" className="stack gap-4 text-center items-center">
        <Icon icon={MailCheck} size={36} className="state-icon" />
        <h2 className="text-xl">Cek email kamu</h2>
        <p className="text-secondary text-sm">
          Kalau <strong>{email}</strong> terdaftar, kami sudah mengirim tautan untuk
          mengatur ulang kata sandi. Tautannya berlaku sebentar, jadi segera buka.
        </p>
        <Link href="/login" className="link-accent text-sm">
          Kembali ke halaman masuk
        </Link>
      </Sheet>
    );
  }

  return (
    <Sheet as="section" className="stack gap-5">
      <div className="stack gap-1">
        <h2 className="text-xl">Lupa kata sandi</h2>
        <p className="text-secondary text-sm">
          Masukkan email akunmu. Kami kirim tautan untuk membuat kata sandi baru.
        </p>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
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
        {captcha.widget}
        <Button
          type="submit"
          size="lg"
          block
          icon={KeyRound}
          loading={loading}
          disabled={!captcha.ready}
        >
          Kirim tautan
        </Button>
      </form>

      <p className="text-secondary text-sm text-center">
        Ingat kata sandimu?{" "}
        <Link href="/login" className="link-accent">
          Masuk
        </Link>
      </p>
    </Sheet>
  );
}
