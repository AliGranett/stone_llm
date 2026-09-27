import { FINAL_EXPERIMENT_LIMIT } from "../config/roundConfig";
import { studyConfig } from "../config/studyConfig";
import { interpolate } from "../i18n/interpolate";
import { useTranslation } from "../i18n/LocaleProvider";
import { canSubmitFinalModel } from "../state/studyReducer";
import { useStudyStore } from "../state/studyStore";

/**
 * Explicit final-model submission: confidence rating (required), optional
 * free-text notes, and the submit button. The structured decision tree and
 * affinity map (edited in their own panels) are the primary final model.
 */
export function FinalModelSubmission() {
  const { state, dispatch } = useStudyStore();
  const { t } = useTranslation();
  const draft = state.finalModelDraft;
  const ready = canSubmitFinalModel(state);
  const { min, max } = studyConfig.confidenceScale;
  const scale = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <section aria-labelledby="final-model-heading" className="panel final-submission">
      <h3 id="final-model-heading" className="panel__title">
        {t.finalModel.title}
      </h3>
      <p className="panel__hint">{t.finalModel.hint}</p>

      <div className="field">
        <label className="field__label" htmlFor="final-model-notes">
          {t.finalModel.notesLabel}
        </label>
        <textarea
          id="final-model-notes"
          className="field__textarea"
          rows={3}
          value={draft.notes}
          onChange={(e) =>
            dispatch({ type: "UPDATE_FINAL_MODEL_DRAFT", patch: { notes: e.target.value } })
          }
        />
      </div>

      <div className="field">
        <span className="field__label" id="final-model-confidence-label">
          {t.finalModel.confidenceLabel} (
          {interpolate(t.finalModel.confidenceHint, { min, max })})
        </span>
        <div
          className="final-submission__confidence"
          role="radiogroup"
          aria-labelledby="final-model-confidence-label"
        >
          {scale.map((value) => {
            const checked = draft.confidence === value;
            return (
              <label
                key={value}
                className={`chip-option chip-option--square ${checked ? "chip-option--checked" : ""}`}
              >
                <input
                  type="radio"
                  name="final-model-confidence"
                  value={value}
                  checked={checked}
                  onChange={() =>
                    dispatch({
                      type: "UPDATE_FINAL_MODEL_DRAFT",
                      patch: { confidence: value },
                    })
                  }
                />
                {value}
              </label>
            );
          })}
        </div>
      </div>

      {!ready && (
        <p className="final-submission__hint" aria-live="polite">
          {interpolate(t.finalModel.incomplete, { count: FINAL_EXPERIMENT_LIMIT })}
        </p>
      )}

      <button
        type="button"
        className="btn btn--primary btn--large"
        disabled={!ready}
        onClick={() => dispatch({ type: "SUBMIT_FINAL_MODEL" })}
      >
        {t.finalModel.submit}
      </button>
    </section>
  );
}
