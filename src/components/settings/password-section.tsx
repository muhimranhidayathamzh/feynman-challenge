"use client";

import { NewPasswordForm } from "@/components/auth/new-password-form";
import { useToast } from "@/components/ui/toast";

interface Props {
  /** A just-converted demo account sets its first password. */
  firstTime?: boolean;
}

export function PasswordSection({ firstTime = false }: Props) {
  const toast = useToast();
  return (
    <NewPasswordForm
      submitLabel={firstTime ? "Simpan kata sandi" : "Ganti kata sandi"}
      onDone={() =>
        toast.show({
          message: firstTime ? "Kata sandi disimpan." : "Kata sandi diganti.",
          tone: "success",
        })
      }
    />
  );
}
