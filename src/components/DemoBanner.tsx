import { useTranslation } from "../i18n/LocaleProvider";

/** Shown only on the static demo build, where replies are sample text. */
export function DemoBanner() {
  const { t } = useTranslation();
  if (import.meta.env.VITE_DEMO_MODE !== "true") return null;

  return (
    <p className="demo-banner" role="status">
      {t.app.demoNotice}
    </p>
  );
}
