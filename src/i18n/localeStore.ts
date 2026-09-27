import type { Locale } from "./types";

const LOCALE_KEY = "asterion-locale";

export function loadLocale(): Locale | null {
  try {
    const raw = localStorage.getItem(LOCALE_KEY);
    if (raw === "en" || raw === "he" || raw === "ar") return raw;
    return null;
  } catch {
    return null;
  }
}

export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // Ignore blocked storage.
  }
}
