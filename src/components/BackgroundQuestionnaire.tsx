import { useMemo, useState, type FormEvent } from "react";
import { hasManualCondition } from "../services/conditionAssignment";
import { useTranslation } from "../i18n/LocaleProvider";
import { isBackgroundComplete } from "../state/studyReducer";
import { useStudyStore } from "../state/studyStore";
import type { LlmExperience } from "../types";
import {
  AI_PROBLEM_SOLVING_CONFIDENCE_LEVELS,
  EDUCATION_LEVELS,
  LLM_EXPERIENCE_LEVELS,
} from "../types";
import { LanguageSelector } from "./LanguageSelector";

const LLM_EXPERIENCE_LABEL_KEYS = {
  NEVER: "never",
  RARELY: "rarely",
  SOMETIMES: "sometimes",
  FREQUENTLY: "frequently",
  VERY_FREQUENTLY: "veryFrequently",
} as const;

const EDUCATION_LABEL_KEYS = {
  HIGH_SCHOOL_OR_BELOW: "highSchoolOrBelow",
  BACHELORS: "bachelors",
  MASTERS: "masters",
  DOCTORATE: "doctorate",
  OTHER: "other",
} as const;

const CONFIDENCE_LABEL_KEYS = {
  1: "notAtAll",
  2: "slightly",
  3: "moderately",
  4: "very",
  5: "extremely",
} as const;

function FrequencyFieldset({
  legend,
  name,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  value: LlmExperience | "";
  onChange: (value: LlmExperience) => void;
}) {
  const { t } = useTranslation();

  return (
    <fieldset className="background-form__field">
      <legend>{legend}</legend>
      {LLM_EXPERIENCE_LEVELS.map((option) => (
        <label key={option} className="background-form__radio">
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
          />
          <span>{t.llmExperience[LLM_EXPERIENCE_LABEL_KEYS[option]]}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function BackgroundQuestionnaire() {
  const { state, dispatch } = useStudyStore();
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);

  const draft = state.backgroundDraft;
  const conditionReady = state.conditionAssigned || hasManualCondition();
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!conditionReady) {
      errors.push(t.background.conditionMissing);
    }
    const age = Number(draft.age);
    if (!Number.isFinite(age) || age < 1 || age > 120) {
      errors.push(t.background.validationAge);
    }
    if (draft.educationLevel === "") {
      errors.push(t.background.validationEducation);
    }
    if (draft.fieldOrOccupation.trim().length === 0) {
      errors.push(t.background.validationField);
    }
    if (draft.llmExperience === "") {
      errors.push(t.background.validationLlmExperience);
    }
    if (draft.aiLearningProblemSolvingFrequency === "") {
      errors.push(t.background.validationAiLearningFrequency);
    }
    if (draft.aiProblemSolvingConfidence === "") {
      errors.push(t.background.validationAiConfidence);
    }
    return errors;
  }, [draft, t, conditionReady]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!conditionReady || !isBackgroundComplete(draft)) return;
    dispatch({ type: "SUBMIT_BACKGROUND" });
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

      <main className="main-column" aria-label={t.background.title}>
        <section className="panel background-panel">
          <h2 className="panel__title">{t.background.title}</h2>
          <p className="panel__hint">{t.background.subtitle}</p>

          <p className="background-panel__meta">
            <span className="background-panel__meta-label">{t.background.participantId}:</span>{" "}
            <span>{state.participantId}</span>
          </p>

          <form className="background-form" onSubmit={submit} noValidate>
            <label className="background-form__field">
              <span>{t.background.ageLabel}</span>
              <input
                type="number"
                min={1}
                max={120}
                inputMode="numeric"
                value={draft.age}
                onChange={(event) =>
                  dispatch({
                    type: "UPDATE_BACKGROUND_DRAFT",
                    patch: { age: event.target.value },
                  })
                }
                aria-describedby="age-hint"
                aria-required="true"
              />
              <span id="age-hint" className="background-form__hint">
                {t.background.ageHint}
              </span>
            </label>

            <fieldset className="background-form__field">
              <legend>{t.background.educationLabel}</legend>
              {EDUCATION_LEVELS.map((option) => (
                <label key={option} className="background-form__radio">
                  <input
                    type="radio"
                    name="educationLevel"
                    value={option}
                    checked={draft.educationLevel === option}
                    onChange={() =>
                      dispatch({
                        type: "UPDATE_BACKGROUND_DRAFT",
                        patch: { educationLevel: option },
                      })
                    }
                  />
                  <span>{t.educationLevel[EDUCATION_LABEL_KEYS[option]]}</span>
                </label>
              ))}
            </fieldset>

            <label className="background-form__field">
              <span>{t.background.fieldLabel}</span>
              <input
                type="text"
                value={draft.fieldOrOccupation}
                placeholder={t.background.fieldPlaceholder}
                onChange={(event) =>
                  dispatch({
                    type: "UPDATE_BACKGROUND_DRAFT",
                    patch: { fieldOrOccupation: event.target.value },
                  })
                }
                aria-required="true"
              />
            </label>

            <FrequencyFieldset
              legend={t.background.llmExperienceLabel}
              name="llmExperience"
              value={draft.llmExperience}
              onChange={(option) =>
                dispatch({
                  type: "UPDATE_BACKGROUND_DRAFT",
                  patch: { llmExperience: option },
                })
              }
            />

            <FrequencyFieldset
              legend={t.background.aiLearningFrequencyLabel}
              name="aiLearningProblemSolvingFrequency"
              value={draft.aiLearningProblemSolvingFrequency}
              onChange={(option) =>
                dispatch({
                  type: "UPDATE_BACKGROUND_DRAFT",
                  patch: { aiLearningProblemSolvingFrequency: option },
                })
              }
            />

            <fieldset className="background-form__field">
              <legend>{t.background.aiConfidenceLabel}</legend>
              {AI_PROBLEM_SOLVING_CONFIDENCE_LEVELS.map((level) => (
                <label key={level} className="background-form__radio">
                  <input
                    type="radio"
                    name="aiProblemSolvingConfidence"
                    value={level}
                    checked={draft.aiProblemSolvingConfidence === level}
                    onChange={() =>
                      dispatch({
                        type: "UPDATE_BACKGROUND_DRAFT",
                        patch: { aiProblemSolvingConfidence: level },
                      })
                    }
                  />
                  <span>
                    {level} — {t.aiProblemSolvingConfidence[CONFIDENCE_LABEL_KEYS[level]]}
                  </span>
                </label>
              ))}
            </fieldset>

            {submitted && validationErrors.length > 0 && (
              <ul className="background-form__errors" role="alert">
                {validationErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}

            {!conditionReady && (
              <p className="background-form__condition-warning" role="status">
                {t.background.conditionMissing}
              </p>
            )}

            <button
              type="submit"
              className="btn btn--primary btn--large background-form__submit"
              disabled={!conditionReady}
            >
              {t.background.beginStudy}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
