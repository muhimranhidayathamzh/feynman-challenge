"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, UserPlus } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Field, Input } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { GoogleButton } from "@/components/auth/google-button";
import { authErrorMessage } from "@/lib/auth/errors";
import { MIN_PASSWORD_LENGTH, validateNewPassword } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/client";

interface Props {
  /** Google sign-in is enabled in Supabase (hide the button otherwise). */
  googleEnabled: boolean;
}

export function SignupForm({ googleEnabled }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validateNewPassword(password, confirm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName.trim() || null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/api/auth/callback`
            : undefined,
      },
    });

    if (signUpError) {
      setError(authErrorMessage(signUpError));
      setLoading(false);
      return;
    }

    // When email confirmation is disabled, Supabase returns an active session
    // immediately -> go straight to the dashboard.
    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <Sheet as="section" className="stack gap-4 text-center items-center">
        <Icon icon={Mail} size={36} className="state-icon" />
        <h2 className="text-xl">Cek email kamu</h2>
        <p className="text-secondary text-sm">
          Kami mengirim tautan konfirmasi ke <strong>{email}</strong>. Klik tautan itu
          untuk mengaktifkan akunmu.
        </p>
        <ButtonLink href="/login" variant="secondary" block>
          Kembali ke halaman masuk
        </ButtonLink>
      </Sheet>
    );
  }

  return (
    <Sheet as="section" className="stack gap-5">
      <div className="stack gap-1">
        <h2 className="text-xl">Buat akun</h2>
        <p className="text-secondary text-sm">
          Mulai kuasai materi apapun lewat menjelaskan ulang.
        </p>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {googleEnabled && (
        <>
          <GoogleButton next="/" label="Daftar dengan Google" onError={setError} />

          <div className="divider" role="separator">
            <span>atau dengan email</span>
          </div>
        </>
      )}

      <form className="stack" onSubmit={handleSubmit}>
        <Field id="displayName" label="Nama tampilan" optional>
          <Input
            type="text"
            autoComplete="name"
            placeholder="Nama kamu"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            disabled={loading}
          />
        </Field>

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

        <Field id="password" label="Kata sandi">
          <Input
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            placeholder={`Minimal ${MIN_PASSWORD_LENGTH} karakter`}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
          />
        </Field>

        <Field id="confirm" label="Konfirmasi kata sandi">
          <Input
            type="password"
            autoComplete="new-password"
            required
            placeholder="Ulangi kata sandi"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            disabled={loading}
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          block
          className="mt-2"
          icon={UserPlus}
          loading={loading}
        >
          Daftar
        </Button>
      </form>

      <p className="text-muted text-xs">
        Dengan mendaftar, kamu menyetujui{" "}
        <Link href="/syarat" className="text-link">
          Syarat Penggunaan
        </Link>{" "}
        dan{" "}
        <Link href="/privasi" className="text-link">
          Kebijakan Privasi
        </Link>
        . Rekamanmu dikirim ke Google Gemini untuk dinilai, dan bisa kamu hapus kapan
        saja.
      </p>

      <p className="text-secondary text-sm text-center">
        Sudah punya akun?{" "}
        <Link href="/login" className="link-accent">
          Masuk
        </Link>
      </p>
    </Sheet>
  );
}
