"use client";

import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { authErrorMessage } from "@/lib/auth/errors";
import { MIN_PASSWORD_LENGTH, validateNewPassword } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/client";

interface Props {
  submitLabel: string;
  onDone: () => void;
}

/** New password + confirmation, saved with supabase.auth.updateUser. */
export function NewPasswordForm({ submitLabel, onDone }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = validateNewPassword(password, confirm);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setLoading(true);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(authErrorMessage(updateError));
      return;
    }
    setPassword("");
    setConfirm("");
    onDone();
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      <Field
        id="new-password"
        label="Kata sandi baru"
        hint={`Minimal ${MIN_PASSWORD_LENGTH} karakter.`}
      >
        <Input
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={loading}
        />
      </Field>
      <Field id="confirm-password" label="Konfirmasi kata sandi baru">
        <Input
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          disabled={loading}
        />
      </Field>
      <Button type="submit" icon={KeyRound} loading={loading} className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
