import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getLocaleDirection,
  getTranslations,
  type Locale,
  type Translations,
} from "./index";
import { loadLocale, saveLocale } from "./localeStore";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
  dir: "ltr" | "rtl";
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function detectInitialLocale(): Locale {
  const stored = loadLocale();
  if (stored) return stored;

  const browser = navigator.language.toLowerCase();
  if (browser.startsWith("he")) return "he";
  if (browser.startsWith("ar")) return "ar";
  return "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    saveLocale(next);
  };

  const dir = getLocaleDirection(locale);
  const t = useMemo(() => getTranslations(locale), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const value = useMemo(
    () => ({ locale, setLocale, t, dir }),
    [locale, t, dir],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return value;
}

/** Convenience alias used by components. */
export function useTranslation() {
  return useLocale();
}
