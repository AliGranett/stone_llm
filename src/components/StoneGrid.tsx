import { useTranslation } from "../i18n/LocaleProvider";
import { getAvailableStones } from "../state/studyReducer";
import { useStudyStore } from "../state/studyStore";
import { canEditSetup, getSelectionSlotLookup } from "./workspaceHelpers";
import { StoneCard } from "./StoneCard";

export function StoneGrid() {
  const { state, dispatch } = useStudyStore();
  const { t } = useTranslation();
  const editable = canEditSetup(state);
  const slotFor = getSelectionSlotLookup(state);
  const stones = getAvailableStones(state);

  return (
    <section aria-labelledby="stone-grid-heading" className="panel">
      <h3 id="stone-grid-heading" className="panel__title">
        {t.stones.available}
      </h3>
      <p className="panel__hint">{t.stones.hint}</p>
      <div className="stone-grid" role="group" aria-label={t.stones.ariaGroup}>
        {stones.map((stone) => (
          <StoneCard
            key={stone.id}
            stone={stone}
            selectionSlot={slotFor(stone.id)}
            disabled={!editable}
            onToggle={(stoneId) => dispatch({ type: "TOGGLE_STONE", stoneId })}
          />
        ))}
      </div>
    </section>
  );
}
