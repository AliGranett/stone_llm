import { EVIDENCE_ORDER } from "../config/affinities";
import { useTranslation } from "../i18n/LocaleProvider";
import { isReflectionComplete } from "../state/studyReducer";
import { useStudyStore } from "../state/studyStore";

export function ReflectionForm() {
  const { state, dispatch } = useStudyStore();
  const { t } = useTranslation();
  const draft = state.reflectionDraft;
  const complete = isReflectionComplete(draft);

  return (
    <fieldset className="panel reflection-form">
      <legend className="panel__title">{t.reflection.title}</legend>
      <p className="panel__hint">{t.reflection.hint}</p>

      <div className="field">
        <span className="field__label" id="evidence-label">
          {t.reflection.evidenceLabel}
        </span>
        <div className="reflection-form__evidence" role="radiogroup" aria-labelledby="evidence-label">
          {EVIDENCE_ORDER.map((value) => {
            const checked = draft.evidenceAssessment === value;
            return (
              <label
                key={value}
                className={`chip-option ${checked ? "chip-option--checked" : ""}`}
              >
                <input
                  type="radio"
                  name="evidence-assessment"
                  value={value}
                  checked={checked}
                  onChange={() => {
                    dispatch({
                      type: "UPDATE_REFLECTION_DRAFT",
                      patch: { evidenceAssessment: value },
                    });
                    dispatch({
                      type: "LOG_EVENT",
                      eventType: "EVIDENCE_ASSESSMENT_SELECTED",
                      payload: { value },
                    });
                  }}
                />
                {t.evidence[value]}
              </label>
            );
          })}
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="observation-input">
          {t.reflection.observationLabel}
          <span className="field__optional"> {t.reflection.observationOptional}</span>
        </label>
        <textarea
          id="observation-input"
          className="field__textarea"
          rows={2}
          value={draft.observation}
          onChange={(e) =>
            dispatch({ type: "UPDATE_REFLECTION_DRAFT", patch: { observation: e.target.value } })
          }
          onBlur={() =>
            dispatch({
              type: "LOG_EVENT",
              eventType: "OBSERVATION_ENTERED",
              payload: { length: draft.observation.length },
            })
          }
        />
      </div>

      {!complete && (
        <p className="reflection-form__hint" aria-live="polite">
          {t.reflection.incomplete}
        </p>
      )}

      <button
        type="button"
        className="btn btn--primary"
        disabled={!complete}
        onClick={() => dispatch({ type: "SUBMIT_REFLECTION" })}
      >
        {t.reflection.submit}
      </button>
    </fieldset>
  );
}
