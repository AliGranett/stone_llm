import { useTranslation } from "../i18n/LocaleProvider";
import {
  canRunExperiment,
  getRunBlockers,
  type RunBlockerKey,
} from "../state/studyReducer";
import { useStudyStore } from "../state/studyStore";

interface ExperimentControlsProps {
  onRun: () => void;
}

const BLOCKER_LABELS: Record<
  RunBlockerKey,
  keyof ReturnType<typeof useTranslation>["t"]["controls"]
> = {
  SELECT_STONES: "selectStones",
  CHOOSE_PREDICTION: "choosePrediction",
  CHOOSE_PROPERTY: "chooseProperty",
};

export function ExperimentControls({ onRun }: ExperimentControlsProps) {
  const { state } = useStudyStore();
  const { t } = useTranslation();
  const blockers = getRunBlockers(state).map((key) => t.controls[BLOCKER_LABELS[key]]);
  const ready = canRunExperiment(state);

  return (
    <div className="experiment-controls">
      {blockers.length > 0 && (
        <ul className="experiment-controls__blockers" aria-live="polite">
          {blockers.map((blocker) => (
            <li key={blocker}>{blocker}</li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="btn btn--primary btn--large"
        disabled={!ready}
        onClick={onRun}
      >
        {t.controls.run}
      </button>
    </div>
  );
}
