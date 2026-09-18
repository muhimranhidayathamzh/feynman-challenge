"use client";

import { useState, type FormEvent } from "react";
import { MailCheck, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { authErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";

interface Props {
  /** Email already awaiting verification (user.new_email), if any. */
  pendingEmail: string | null;
}

/**
 * Keeps a demo account: step 1 links an email (Supabase sends a verification
 * link); after the link is opened, the account is permanent and the password
 * section appears for step 2. All data stays, since it is the same user.
 */
export function ConvertAccount({ pendingEmail }: Props) {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(pendingEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = email.trim();
    if (!address) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const next = encodeURIComponent("/pengaturan?akun=tersimpan#kata-sandi");
    const { error: updateError } = await supabase.auth.updateUser(
      { email: address },
      { emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${next}` },
    );
    setLoading(false);
    if (updateError) {
      setError(authErrorMessage(updateError));
      return;
    }
    setSentTo(address);
  }

  if (sentTo) {
    return (
      <div className="stack gap-3">
        <div className="alert alert-success stack gap-1" role="status">
          <span className="row gap-2 font-medium">
            <Icon icon={MailCheck} size={16} />
            Tautan verifikasi dikirim ke {sentTo}
          </span>
          <span>
            Buka tautan itu di browser ini. Setelah terverifikasi, kembali ke halaman ini
            untuk membuat kata sandi.
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => {
            setSentTo(null);
            setEmail("");
          }}
        >
          Pakai email lain
        </Button>
      </div>
    );
  }

  return (
    <form className="stack gap-3" onSubmit={handleSubmit}>
      <ol className="convert-steps text-secondary text-sm">
        <li>Masukkan email, lalu buka tautan verifikasi yang kami kirim.</li>
        <li>Buat kata sandi di halaman ini. Semua tantangan dan hasilmu tetap ada.</li>
      </ol>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      <Field id="convert-email" label="Email">
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
      <Button type="submit" icon={Send} loading={loading} className="self-start">
        Kirim tautan verifikasi
      </Button>
    </form>
  );
}
