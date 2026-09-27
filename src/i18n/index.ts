import { ar } from "./ar";
import { en } from "./en";
import { he } from "./he";
import type { Locale, Translations } from "./types";

const CATALOG: Record<Locale, Translations> = { en, he, ar };

export function getTranslations(locale: Locale): Translations {
  return CATALOG[locale];
}

export function getLocaleDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "he" || locale === "ar" ? "rtl" : "ltr";
}

export const LOCALES: Locale[] = ["en", "he", "ar"];

export { en, he, ar };
export type { Locale, Translations };
