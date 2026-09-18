"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
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
    <Card as="section" variant="glass" className="stack gap-5">
      <div className="stack gap-1">
        <h2 className="text-xl">Masuk</h2>
        <p className="text-secondary text-sm">Lanjutkan tantangan belajarmu.</p>
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

        <Field id="password" label="Password">
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
