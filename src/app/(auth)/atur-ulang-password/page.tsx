"use client";

import { useRouter } from "next/navigation";

import { NewPasswordForm } from "@/components/auth/new-password-form";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

/**
 * Reached from the recovery email: /api/auth/callback exchanged the code for a
 * session and forwarded here, so the user is signed in and may set a new
 * password. (Not a public path: without that session, middleware sends them
 * to /login.)
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const toast = useToast();

  return (
    <Card as="section" variant="glass" className="stack gap-5">
      <div className="stack gap-1">
        <h2 className="text-xl">Buat kata sandi baru</h2>
        <p className="text-secondary text-sm">
          Setelah disimpan, kamu langsung masuk ke dashboard.
        </p>
      </div>
      <NewPasswordForm
        submitLabel="Simpan kata sandi"
        onDone={() => {
          toast.show({ message: "Kata sandi diperbarui.", tone: "success" });
          router.push("/");
          router.refresh();
        }}
      />
    </Card>
  );
}
