"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function validate(): string | null {
    if (password.length < 6) {
      return "Password minimal 6 karakter.";
    }
    if (password !== confirm) {
      return "Konfirmasi password tidak cocok.";
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validate();
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
        data: { display_name: displayName.trim() || null },
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/api/auth/callback`
            : undefined,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
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
      <section className="glass stack text-center" style={{ gap: "var(--space-4)" }}>
        <h2 style={{ fontSize: "var(--text-xl)" }}>Cek email kamu 📬</h2>
        <p className="text-secondary text-sm">
          Kami mengirim tautan konfirmasi ke <strong>{email}</strong>. Klik
          tautan itu untuk mengaktifkan akunmu.
        </p>
        <Link href="/login" className="btn btn-secondary btn-block">
          Kembali ke halaman masuk
        </Link>
      </section>
    );
  }

  return (
    <section className="glass stack" style={{ gap: "var(--space-5)" }}>
      <div className="stack" style={{ gap: "var(--space-1)" }}>
        <h2 style={{ fontSize: "var(--text-xl)" }}>Buat akun</h2>
        <p className="text-secondary text-sm">
          Mulai kuasai materi apapun lewat menjelaskan ulang.
        </p>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <form className="stack" onSubmit={handleSubmit}>
        <div className="field">
          <label className="label" htmlFor="displayName">
            Nama tampilan{" "}
            <span className="text-muted">(opsional)</span>
          </label>
          <input
            id="displayName"
            className="input"
            type="text"
            autoComplete="name"
            placeholder="Nama kamu"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            disabled={loading}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            required
            placeholder="kamu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={loading}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="confirm">
            Konfirmasi password
          </label>
          <input
            id="confirm"
            className="input"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Ulangi password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          style={{ marginTop: "var(--space-2)" }}
          disabled={loading}
        >
          {loading ? "Memproses…" : "Daftar"}
        </button>
      </form>

      <p className="text-secondary text-sm text-center">
        Sudah punya akun?{" "}
        <Link href="/login" className="link-accent">
          Masuk
        </Link>
      </p>
    </section>
  );
}
