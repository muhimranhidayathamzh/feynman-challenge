import type { ZodType } from "zod";

import { ApiErrorSchema } from "@/lib/api/contracts";

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | {
      ok: false;
      status: number;
      error: string;
      code?: string;
      retryAfterSeconds?: number;
    };

export interface FetchJsonInit extends Omit<RequestInit, "body"> {
  /** Serialized as the JSON body; sets Content-Type automatically. */
  json?: unknown;
}

const NETWORK_ERROR = "Kesalahan jaringan. Periksa koneksi lalu coba lagi.";
const SESSION_ERROR = "Sesi kamu berakhir. Silakan masuk lagi.";
const INVALID_BODY = "Respons server tidak valid.";
const SCHEMA_MISMATCH = "Respons server tidak sesuai yang diharapkan.";

/**
 * fetch + JSON + validation in one place for client components.
 * - Network failure and non-JSON bodies become { ok: false } with a message.
 * - 401 sends the user to /login (the session is gone).
 * - Error bodies are read through ApiErrorSchema; success bodies through `schema`.
 * Never throws.
 */
export async function fetchJson<T>(
  url: string,
  schema: ZodType<T>,
  init: FetchJsonInit = {},
): Promise<ApiResult<T>> {
  const { json, headers, ...rest } = init;
  const requestInit: RequestInit = {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
  };

  let response: Response;
  try {
    response = await fetch(url, requestInit);
  } catch {
    return { ok: false, status: 0, error: NETWORK_ERROR };
  }

  if (response.status === 401) {
    if (typeof window !== "undefined") window.location.assign("/login");
    return { ok: false, status: 401, error: SESSION_ERROR };
  }

  let body: unknown = null;
  const text = await response.text().catch(() => "");
  if (text.length > 0) {
    try {
      body = JSON.parse(text);
    } catch {
      return {
        ok: false,
        status: response.status,
        error: response.ok ? INVALID_BODY : `${INVALID_BODY} (HTTP ${response.status})`,
      };
    }
  }

  if (!response.ok) {
    const parsed = ApiErrorSchema.safeParse(body);
    if (parsed.success) {
      return {
        ok: false,
        status: response.status,
        error: parsed.data.error,
        ...(parsed.data.code !== undefined ? { code: parsed.data.code } : {}),
        ...(parsed.data.retryAfterSeconds !== undefined
          ? { retryAfterSeconds: parsed.data.retryAfterSeconds }
          : {}),
      };
    }
    return {
      ok: false,
      status: response.status,
      error: `Permintaan gagal (HTTP ${response.status}).`,
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, status: response.status, error: SCHEMA_MISMATCH };
  }
  return { ok: true, status: response.status, data: parsed.data };
}
