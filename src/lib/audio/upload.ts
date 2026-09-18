// Browser-only: relies on XMLHttpRequest and the user's session cookie/JWT.
import { publicEnv } from "@/lib/env.public";
import { RECORDINGS_BUCKET } from "@/lib/storage/recording-path";
import { createClient } from "@/lib/supabase/client";

export type UploadErrorCode =
  "unauthenticated" | "too-large" | "unsupported-type" | "failed";

export class UploadError extends Error {
  readonly code: UploadErrorCode;
  constructor(code: UploadErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const MESSAGES: Record<UploadErrorCode, string> = {
  unauthenticated: "Sesi kamu berakhir. Masuk lagi lalu coba kirim ulang.",
  "too-large": "Rekaman terlalu besar (maksimal 10 MB). Coba rekam lebih singkat.",
  "unsupported-type": "Format audio tidak didukung oleh server.",
  failed: "Gagal mengunggah rekaman. Periksa koneksi lalu coba lagi.",
};

function classify(status: number, body: string): UploadErrorCode {
  const text = body.toLowerCase();
  if (status === 413 || text.includes("exceeded the maximum allowed size"))
    return "too-large";
  if (status === 415 || text.includes("mime type")) return "unsupported-type";
  if (status === 401 || status === 403) return "unauthenticated";
  return "failed";
}

/**
 * Uploads a recording straight from the browser to Supabase Storage using the
 * user's own session (RLS scopes them to their {user_id}/ folder).
 *
 * Uses XMLHttpRequest instead of supabase-js `upload()` only because the SDK
 * exposes no upload progress; the endpoint and headers are the same ones the
 * SDK uses. `contentType` must be a bare type ("audio/webm") to pass the
 * bucket's allowed_mime_types check.
 */
export async function uploadRecording(params: {
  blob: Blob;
  path: string;
  contentType: string;
  onProgress?: (fraction: number) => void;
}): Promise<void> {
  const { blob, path, contentType, onProgress } = params;
  const env = publicEnv();
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new UploadError("unauthenticated", MESSAGES.unauthenticated);

  const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${RECORDINGS_BUCKET}/${path}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
        return;
      }
      const code = classify(xhr.status, xhr.responseText);
      reject(new UploadError(code, MESSAGES[code]));
    };
    xhr.onerror = () => reject(new UploadError("failed", MESSAGES.failed));
    xhr.onabort = () => reject(new UploadError("failed", MESSAGES.failed));
    xhr.send(blob);
  });
}
