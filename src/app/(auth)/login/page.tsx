import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { safeNext } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Masuk" };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Error CODES the auth callback may forward. Only known codes are shown, so a
 * crafted /login?error=... link cannot put arbitrary text on this page.
 */
const CALLBACK_ERRORS: Record<string, string> = {
  link_invalid: "Tautan tidak valid atau sudah kedaluwarsa. Coba minta tautan baru.",
  oauth_failed: "Masuk dengan Google gagal. Coba lagi.",
};

/**
 * Server wrapper: reads ?next= (validated here, so the client never sees an
 * unsafe target) and ?error= forwarded by the auth callback.
 */
export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const code = Array.isArray(params.error) ? params.error[0] : params.error;
  const initialError = (code && CALLBACK_ERRORS[code]) || null;
  return <LoginForm next={safeNext(params.next)} initialError={initialError} />;
}
