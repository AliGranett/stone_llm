import { LOCALES } from "../i18n";
import { useLocale } from "../i18n/LocaleProvider";

export function LanguageSelector() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="language-selector">
      <label className="language-selector__label" htmlFor="language-select">
        {t.language.label}
      </label>
      <select
        id="language-select"
        className="language-selector__select"
        value={locale}
        onChange={(e) => setLocale(e.target.value as typeof locale)}
        aria-label={t.language.label}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {t.language[code]}
          </option>
        ))}
      </select>
    </div>
  );
}
