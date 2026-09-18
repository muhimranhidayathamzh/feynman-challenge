"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Email atau password salah. Coba lagi.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <section className="glass stack" style={{ gap: "var(--space-5)" }}>
      <div className="stack" style={{ gap: "var(--space-1)" }}>
        <h2 style={{ fontSize: "var(--text-xl)" }}>Masuk</h2>
        <p className="text-secondary text-sm">Lanjutkan tantangan belajarmu.</p>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <form className="stack" onSubmit={handleSubmit}>
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
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          style={{ marginTop: "var(--space-2)" }}
          disabled={loading}
        >
          {loading ? "Memproses…" : "Masuk"}
        </button>
      </form>

      <p className="text-secondary text-sm text-center">
        Belum punya akun?{" "}
        <Link href="/signup" className="link-accent">
          Daftar
        </Link>
      </p>
    </section>
  );
}
