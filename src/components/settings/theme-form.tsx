"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  THEME_LABELS,
  THEME_PREFERENCES,
  themeCookie,
  type ThemePreference,
} from "@/lib/theme";

const DESCRIPTIONS: Record<ThemePreference, string> = {
  system: "Terang di siang hari, gelap saat perangkatmu memakai mode gelap.",
  light: "Kertas hangat, nyaman untuk membaca lama.",
  dark: "Papan tulis gelap, nyaman untuk belajar malam.",
};

/**
 * Theme choice (DV2). Applied at once on this page, saved in a cookie so the
 * server renders the right theme on the next visit. The recording screen is
 * always the dark "papan tulis" regardless of this setting.
 */
export function ThemeForm({ initial }: { initial: ThemePreference }) {
  const router = useRouter();
  const [value, setValue] = useState<ThemePreference>(initial);

  function choose(next: ThemePreference) {
    setValue(next);
    document.cookie = themeCookie(next);
    document.documentElement.dataset.theme = next;
    // Re-render server parts (theme-color meta) with the new cookie.
    router.refresh();
  }

  return (
    <fieldset className="theme-options">
      <legend className="visually-hidden">Tema tampilan</legend>
      {THEME_PREFERENCES.map((theme) => (
        <label key={theme} className="theme-option">
          <input
            type="radio"
            name="theme"
            value={theme}
            checked={value === theme}
            onChange={() => choose(theme)}
          />
          <span className="stack gap-1">
            <span className="font-semibold">{THEME_LABELS[theme]}</span>
            <span className="text-secondary text-sm">{DESCRIPTIONS[theme]}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
