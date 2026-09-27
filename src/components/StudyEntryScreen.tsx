import { useState } from "react";
import { useTranslation } from "../i18n/LocaleProvider";
import { useStudyStore } from "../state/studyStore";
import type { ExperimentalCondition } from "../types";
import { LanguageSelector } from "./LanguageSelector";

const CONDITIONS: ExperimentalCondition[] = ["ANALYTICAL", "HYPOTHESIS_DRIVEN"];

function ConditionOptions({
  id,
  value,
  onChange,
  onBegin,
  beginLabel,
}: {
  id: string;
  value: ExperimentalCondition;
  onChange: (value: ExperimentalCondition) => void;
  onBegin: () => void;
  beginLabel: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="entry-card__options">
      <label className="entry-card__label" htmlFor={id}>
        {t.entry.conditionLabel}
      </label>
      <select
        id={id}
        className="entry-card__select"
        value={value}
        onChange={(event) => onChange(event.target.value as ExperimentalCondition)}
      >
        {CONDITIONS.map((condition) => (
          <option key={condition} value={condition}>
            {condition}
          </option>
        ))}
      </select>
      <button type="button" className="btn btn--primary" onClick={onBegin}>
        {beginLabel}
      </button>
    </div>
  );
}

export function StudyEntryScreen() {
  const { dispatch } = useStudyStore();
  const { t } = useTranslation();
  const [selectedCondition, setSelectedCondition] =
    useState<ExperimentalCondition>("ANALYTICAL");
  const [showParticipantOptions, setShowParticipantOptions] = useState(false);
  const [showTestingOptions, setShowTestingOptions] = useState(false);

  const beginParticipant = () => {
    dispatch({
      type: "SELECT_STUDY_MODE",
      mode: "PARTICIPANT",
      condition: selectedCondition,
    });
  };

  const beginTesting = () => {
    dispatch({
      type: "SELECT_STUDY_MODE",
      mode: "TESTING",
      condition: selectedCondition,
    });
  };

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

      <main className="main-column entry-screen" aria-label={t.entry.title}>
        <section className="panel entry-panel">
          <h2 className="panel__title">{t.entry.title}</h2>
          <p className="panel__hint">{t.entry.subtitle}</p>

          <div className="entry-panel__choices">
            <div className="entry-card entry-card--participant">
              <button
                type="button"
                className="entry-card__main"
                onClick={() => setShowParticipantOptions((value) => !value)}
                aria-expanded={showParticipantOptions}
              >
                <span className="entry-card__title">{t.entry.participantMode}</span>
                <span className="entry-card__body">{t.entry.participantDescription}</span>
              </button>

              {showParticipantOptions && (
                <ConditionOptions
                  id="participant-condition"
                  value={selectedCondition}
                  onChange={setSelectedCondition}
                  onBegin={beginParticipant}
                  beginLabel={t.entry.beginParticipant}
                />
              )}
            </div>

            <div className="entry-card entry-card--testing">
              <button
                type="button"
                className="entry-card__main"
                onClick={() => setShowTestingOptions((value) => !value)}
                aria-expanded={showTestingOptions}
              >
                <span className="entry-card__title">{t.entry.testingMode}</span>
                <span className="entry-card__body">{t.entry.testingDescription}</span>
              </button>

              {showTestingOptions && (
                <ConditionOptions
                  id="testing-condition"
                  value={selectedCondition}
                  onChange={setSelectedCondition}
                  onBegin={beginTesting}
                  beginLabel={t.entry.beginTesting}
                />
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
