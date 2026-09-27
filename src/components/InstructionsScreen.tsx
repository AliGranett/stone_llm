import { useTranslation } from "../i18n/LocaleProvider";
import { useStudyStore } from "../state/studyStore";
import { InstructionsContent } from "./InstructionsContent";
import { LanguageSelector } from "./LanguageSelector";

export function InstructionsScreen() {
  const { dispatch } = useStudyStore();
  const { t } = useTranslation();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="main-column main-column--header app-header__bar">
          <div className="app-header__brand">
            <h1 className="app-header__title">{t.app.title}</h1>
            <p className="app-header__subtitle">{t.app.subtitle}</p>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <main className="main-column instructions-screen" aria-label={t.instructions.pageAria}>
        <section className="panel instructions-panel">
          <InstructionsContent />
          <div className="instructions-panel__actions">
            <button
              type="button"
              className="btn btn--primary btn--large"
              onClick={() => dispatch({ type: "COMPLETE_INSTRUCTIONS" })}
            >
              {t.instructions.startButton}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
