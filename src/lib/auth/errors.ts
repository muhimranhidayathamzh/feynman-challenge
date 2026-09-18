// ============================================================================
// Supabase Auth errors -> Bahasa Indonesia. Pure, client-safe.
// Supabase exposes a stable `code` on AuthError (e.g. "invalid_credentials");
// the English `message` is only used to recognise a few older error shapes.
// ============================================================================

export interface AuthErrorLike {
  code?: string | undefined;
  message: string;
  status?: number | undefined;
}

const MESSAGES: Record<string, string> = {
  invalid_credentials: "Email atau kata sandi salah. Coba lagi.",
  email_not_confirmed:
    "Email kamu belum dikonfirmasi. Buka tautan di email pendaftaran, atau kirim ulang emailnya.",
  user_already_exists: "Email ini sudah terdaftar. Silakan masuk.",
  email_exists: "Email ini sudah terdaftar. Silakan masuk.",
  weak_password:
    "Kata sandi terlalu lemah. Gunakan minimal 8 karakter dengan campuran huruf dan angka.",
  same_password: "Kata sandi baru harus berbeda dari yang lama.",
  email_address_invalid: "Alamat email tidak valid.",
  validation_failed: "Data yang kamu isi belum lengkap atau tidak valid.",
  signup_disabled: "Pendaftaran akun baru sedang ditutup.",
  over_email_send_rate_limit:
    "Terlalu banyak email dikirim. Tunggu beberapa menit sebelum mencoba lagi.",
  over_request_rate_limit: "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.",
  session_expired: "Sesi kamu berakhir. Silakan masuk lagi.",
  session_not_found: "Sesi kamu berakhir. Silakan masuk lagi.",
  user_not_found: "Akun tidak ditemukan.",
  otp_expired: "Tautan sudah kedaluwarsa. Minta tautan baru.",
  reauthentication_needed:
    "Demi keamanan, keluar lalu masuk lagi sebelum mengganti kata sandi.",
  oauth_provider_not_supported: "Masuk dengan Google belum diaktifkan di server.",
  anonymous_provider_disabled:
    "Mode demo belum diaktifkan di server. Daftar akun gratis dulu.",
};

/** Older API versions return no code; recognise them by their message. */
const MESSAGE_FALLBACKS: [RegExp, string][] = [
  [/invalid login credentials/i, "invalid_credentials"],
  [/email not confirmed/i, "email_not_confirmed"],
  [/already registered|already exists/i, "user_already_exists"],
  [/password should be at least/i, "weak_password"],
  [/rate limit/i, "over_request_rate_limit"],
  [/anonymous sign-ins are disabled/i, "anonymous_provider_disabled"],
  [/provider is not enabled|unsupported provider/i, "oauth_provider_not_supported"],
];

export const GENERIC_AUTH_ERROR = "Terjadi kesalahan. Coba lagi sebentar.";

/** Normalised error code, or null when unknown. */
export function authErrorCode(error: AuthErrorLike): string | null {
  if (error.code && MESSAGES[error.code]) return error.code;
  for (const [pattern, code] of MESSAGE_FALLBACKS) {
    if (pattern.test(error.message)) return code;
  }
  if (error.status === 429) return "over_request_rate_limit";
  return error.code ?? null;
}

/** User-facing message in Bahasa Indonesia; never the raw English text. */
export function authErrorMessage(error: AuthErrorLike): string {
  const code = authErrorCode(error);
  return (code && MESSAGES[code]) || GENERIC_AUTH_ERROR;
}
