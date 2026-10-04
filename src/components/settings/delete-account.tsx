"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { useCaptcha } from "@/components/auth/captcha";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input } from "@/components/ui/field";
import { OkResponseSchema } from "@/lib/api/contracts";
import { fetchJson } from "@/lib/api/fetch-json";
import { clearAppCaches } from "@/lib/pwa/client";
import { DELETE_CONFIRMATION, isDeleteConfirmed } from "@/lib/utils/account-cleanup";

interface Props {
  /** Email accounts confirm with their password as well (D10). */
  needsPassword: boolean;
  /** Demo accounts lose everything immediately; say so plainly. */
  isDemo: boolean;
}

/** "Zona berbahaya": delete the account and every recording (Prompt 4.2). */
export function DeleteAccount({ needsPassword, isDemo }: Props) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The password is checked through Supabase sign-in, which asks for a
  // CAPTCHA token once CAPTCHA is on.
  const captcha = useCaptcha();
  const captchaReady = !needsPassword || captcha.ready;

  const ready =
    isDeleteConfirmed(confirm) && (!needsPassword || password.length > 0) && captchaReady;

  function close() {
    setOpen(false);
    setConfirm("");
    setPassword("");
    setError(null);
  }

  async function handleDelete() {
    if (!ready) return;
    setBusy(true);
    setError(null);
    const result = await fetchJson("/api/account", OkResponseSchema, {
      method: "DELETE",
      json: {
        confirm,
        ...(needsPassword && { password, ...captcha.options }),
      },
    });
    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      if (needsPassword) captcha.reset();
      return;
    }
    await clearAppCaches();
    // A full load: nothing from the deleted account may stay in memory.
    window.location.assign("/login?pesan=akun_dihapus");
  }

  return (
    <div className="stack gap-3">
      <p className="text-secondary text-sm">
        {isDemo
          ? "Menghapus semua tantangan, rekaman, dan hasil di mode demo ini. Tidak bisa dibatalkan."
          : "Menghapus akunmu beserta semua tantangan, catatan, rekaman suara, dan hasil penilaian. Tidak bisa dibatalkan."}
      </p>
      <div>
        <Button variant="secondary" icon={Trash2} onClick={() => setOpen(true)}>
          Hapus akun
        </Button>
      </div>

      <ConfirmDialog
        open={open}
        title="Hapus akun ini?"
        message="Semua data dan rekamanmu dihapus permanen dari server. Kami tidak bisa memulihkannya."
        confirmLabel="Hapus akun"
        tone="danger"
        busy={busy}
        confirmDisabled={!ready}
        onConfirm={() => void handleDelete()}
        onCancel={close}
      >
        <form
          className="stack gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void handleDelete();
          }}
        >
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}
          <Field
            id="delete-confirm"
            label={`Ketik ${DELETE_CONFIRMATION} untuk melanjutkan`}
          >
            <Input
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              disabled={busy}
            />
          </Field>
          {needsPassword && (
            <Field id="delete-password" label="Kata sandi">
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                disabled={busy}
              />
            </Field>
          )}
          {needsPassword && open && captcha.widget}
          {/* Enter in a field submits; the dialog's own button does the same. */}
          <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
        </form>
      </ConfirmDialog>
    </div>
  );
}
