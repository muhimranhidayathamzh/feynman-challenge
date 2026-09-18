"use client";

import { NewPasswordForm } from "@/components/auth/new-password-form";
import { useToast } from "@/components/ui/toast";

export function PasswordSection() {
  const toast = useToast();
  return (
    <NewPasswordForm
      submitLabel="Ganti kata sandi"
      onDone={() => toast.show({ message: "Kata sandi diganti.", tone: "success" })}
    />
  );
}
