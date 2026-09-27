import { MOST_IMPORTANT_PROPERTIES } from "../types";
import type { MostImportantProperty } from "../types";
import { useTranslation } from "../i18n/LocaleProvider";
import { useStudyStore } from "../state/studyStore";
import { canEditSetup } from "./workspaceHelpers";

export function HypothesisForm() {
  const { state, dispatch } = useStudyStore();
  const { t } = useTranslation();
  const editable = canEditSetup(state);

  return (
    <fieldset className="panel hypothesis-form" disabled={!editable}>
      <legend className="panel__title">{t.hypothesis.title}</legend>

      <div className="field">
        <span className="field__label" id="property-choice-label">
          {t.hypothesis.propertyLabel}
        </span>
        <div
          className="hypothesis-form__properties"
          role="radiogroup"
          aria-labelledby="property-choice-label"
          aria-required="true"
        >
          {MOST_IMPORTANT_PROPERTIES.map((value) => {
            const checked = state.mostImportantProperty === value;
            return (
              <label
                key={value}
                className={`chip-option ${checked ? "chip-option--checked" : ""}`}
              >
                <input
                  type="radio"
                  name="most-important-property"
                  value={value}
                  checked={checked}
                  onChange={() =>
                    dispatch({ type: "SET_MOST_IMPORTANT_PROPERTY", value })
                  }
                />
                {t.hypothesis.properties[value]}
              </label>
            );
          })}
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="notes-input">
          {t.hypothesis.notesLabel}
          <span className="field__optional"> {t.hypothesis.notesOptional}</span>
        </label>
        <p className="field__hint" id="notes-hint">
          {t.hypothesis.notesHint}
        </p>
        <textarea
          id="notes-input"
          className="field__textarea"
          rows={2}
          value={state.notes}
          onChange={(e) => dispatch({ type: "SET_NOTES", value: e.target.value })}
          onBlur={() =>
            dispatch({
              type: "LOG_EVENT",
              eventType: "JUSTIFICATION_EDITED",
              payload: { length: state.notes.length },
            })
          }
          aria-describedby="notes-hint"
        />
      </div>
    </fieldset>
  );
}

export function formatMostImportantProperty(
  value: MostImportantProperty,
  labels: Record<MostImportantProperty, string>,
): string {
  return labels[value];
}
