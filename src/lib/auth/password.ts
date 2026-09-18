// Client-side password rules. Keep in sync with Supabase Auth
// (Dashboard > Authentication > Providers > Email > Minimum password length).

export const MIN_PASSWORD_LENGTH = 8;

/** Error message in Indonesian, or null when the pair is acceptable. */
export function validateNewPassword(password: string, confirm: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  }
  if (password !== confirm) {
    return "Konfirmasi kata sandi tidak cocok.";
  }
  return null;
}
