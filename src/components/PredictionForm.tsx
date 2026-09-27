import { OUTCOME_ORDER } from "../config/affinities";
import { useTranslation } from "../i18n/LocaleProvider";
import { useStudyStore } from "../state/studyStore";
import { canEditSetup } from "./workspaceHelpers";

export function PredictionForm() {
  const { state, dispatch } = useStudyStore();
  const { t } = useTranslation();
  const editable = canEditSetup(state);

  return (
    <fieldset className="panel prediction-form" disabled={!editable}>
      <legend className="panel__title">{t.prediction.title}</legend>
      <p className="panel__hint">{t.prediction.hint}</p>
      <div className="prediction-form__options" role="radiogroup" aria-label={t.prediction.aria}>
        {OUTCOME_ORDER.map((outcome) => {
          const meta = t.outcomes[outcome];
          const checked = state.prediction === outcome;
          return (
            <label
              key={outcome}
              className={`prediction-form__option ${checked ? "prediction-form__option--checked" : ""}`}
            >
              <input
                type="radio"
                name="prediction"
                value={outcome}
                checked={checked}
                onChange={() => dispatch({ type: "SET_PREDICTION", prediction: outcome })}
              />
              <span className="prediction-form__option-label">{meta.label}</span>
              <span className="prediction-form__option-desc">{meta.description}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
