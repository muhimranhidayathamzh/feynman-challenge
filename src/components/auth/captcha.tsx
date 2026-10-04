"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { turnstileSiteKey } from "@/lib/env.public";

// ---------------------------------------------------------------------------
// Cloudflare Turnstile (Prompt 5.1, D15). Supabase verifies the token itself
// once CAPTCHA is enabled in its dashboard; the app only collects it. With no
// site key nothing renders and every form behaves as before.
// ---------------------------------------------------------------------------

interface TurnstileOptions {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
  theme: "light" | "dark" | "auto";
  language: string;
  size: "flexible";
}

interface TurnstileApi {
  render: (element: HTMLElement, options: TurnstileOptions) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile"));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("turnstile"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/** The app's theme, so the widget matches the page instead of the OS. */
function widgetTheme(): TurnstileOptions["theme"] {
  const theme = document.documentElement.dataset.theme;
  return theme === "light" || theme === "dark" ? theme : "auto";
}

function TurnstileWidget({
  siteKey,
  onToken,
  onExpire,
  onError,
}: {
  siteKey: string;
  onToken: (token: string) => void;
  onExpire: () => void;
  onError: () => void;
}) {
  const container = useRef<HTMLDivElement | null>(null);
  // Latest callbacks without re-rendering the widget when they change.
  const handlers = useRef({ onToken, onExpire, onError });
  handlers.current = { onToken, onExpire, onError };

  useEffect(() => {
    let widgetId: string | null = null;
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled || !container.current) return;
        widgetId = api.render(container.current, {
          sitekey: siteKey,
          callback: (token) => handlers.current.onToken(token),
          "expired-callback": () => handlers.current.onExpire(),
          "error-callback": () => handlers.current.onError(),
          theme: widgetTheme(),
          language: "id",
          size: "flexible",
        });
      })
      .catch(() => {
        if (!cancelled) handlers.current.onError();
      });
    return () => {
      cancelled = true;
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [siteKey]);

  return <div ref={container} className="captcha-widget" />;
}

export interface Captcha {
  /** False when no site key is configured: forms need no token. */
  enabled: boolean;
  /** A fresh token, or null while none is available. */
  token: string | null;
  /** True when the form may submit: CAPTCHA off, or a token in hand. */
  ready: boolean;
  /** Tokens are single-use: call after every auth request that sent one. */
  reset: () => void;
  /** Spread into Supabase auth options. */
  options: { captchaToken?: string };
  /** The widget, plus a message when it fails to load. */
  widget: ReactNode;
}

export function useCaptcha(): Captcha {
  const siteKey = turnstileSiteKey();
  const [token, setToken] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [generation, setGeneration] = useState(0);

  const reset = useCallback(() => {
    setToken(null);
    setFailed(false);
    // A new key remounts the widget, which fetches a new token.
    setGeneration((value) => value + 1);
  }, []);

  const widget = siteKey ? (
    <div className="captcha">
      <TurnstileWidget
        key={generation}
        siteKey={siteKey}
        onToken={(value) => {
          setFailed(false);
          setToken(value);
        }}
        onExpire={() => setToken(null)}
        onError={() => {
          setToken(null);
          setFailed(true);
        }}
      />
      {failed && (
        <p className="text-sm text-secondary" role="alert">
          Pemeriksaan keamanan gagal dimuat.{" "}
          <button type="button" className="text-link" onClick={reset}>
            Coba lagi
          </button>
        </p>
      )}
    </div>
  ) : null;

  return {
    enabled: siteKey !== null,
    token,
    ready: siteKey === null || token !== null,
    reset,
    options: token ? { captchaToken: token } : {},
    widget,
  };
}
