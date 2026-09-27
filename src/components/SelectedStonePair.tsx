import { useTranslation } from "../i18n/LocaleProvider";
import { getSelectedStones } from "../state/studyReducer";
import { useStudyStore } from "../state/studyStore";
import { canEditSetup } from "./workspaceHelpers";
import { StoneCard } from "./StoneCard";

export function SelectedStonePair() {
  const { state, dispatch } = useStudyStore();
  const { t } = useTranslation();
  const { stoneA, stoneB } = getSelectedStones(state);
  const editable = canEditSetup(state);
  const hasSelection = stoneA !== null || stoneB !== null;

  return (
    <section aria-labelledby="selected-pair-heading" className="panel selected-pair">
      <div className="panel__header-row">
        <h3 id="selected-pair-heading" className="panel__title">
          {t.selectedPair.title}
        </h3>
        <button
          type="button"
          className="btn btn--ghost btn--small"
          onClick={() => dispatch({ type: "CLEAR_SELECTION" })}
          disabled={!editable || !hasSelection}
        >
          {t.selectedPair.clear}
        </button>
      </div>
      <div className="selected-pair__slots">
        <div className="selected-pair__slot">
          <span className="selected-pair__slot-label">{t.selectedPair.stoneA}</span>
          {stoneA ? (
            <StoneCard
              stone={stoneA}
              selectionSlot="A"
              compact
              disabled={!editable}
              onToggle={(stoneId) => dispatch({ type: "TOGGLE_STONE", stoneId })}
            />
          ) : (
            <div className="selected-pair__placeholder">{t.selectedPair.selectFirst}</div>
          )}
        </div>
        <span className="selected-pair__vs" aria-hidden="true">
          {t.selectedPair.vs}
        </span>
        <div className="selected-pair__slot">
          <span className="selected-pair__slot-label">{t.selectedPair.stoneB}</span>
          {stoneB ? (
            <StoneCard
              stone={stoneB}
              selectionSlot="B"
              compact
              disabled={!editable}
              onToggle={(stoneId) => dispatch({ type: "TOGGLE_STONE", stoneId })}
            />
          ) : (
            <div className="selected-pair__placeholder">{t.selectedPair.selectSecond}</div>
          )}
        </div>
      </div>
    </section>
  );
}
