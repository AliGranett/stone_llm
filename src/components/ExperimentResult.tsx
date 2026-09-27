import { studyConfig } from "../config/studyConfig";
import { useTranslation } from "../i18n/LocaleProvider";
import type { PendingExperiment } from "../types";

interface ExperimentResultProps {
  pending: PendingExperiment;
}

export function ExperimentResult({ pending }: ExperimentResultProps) {
  const { t } = useTranslation();
  const { evaluation, prediction } = pending;
  const outcomeMeta = t.outcomes[evaluation.outcome];
  const predictionMeta = t.outcomes[prediction];
  const predictionCorrect = evaluation.outcome === prediction;

  const winnerLine =
    evaluation.winningStoneId !== null
      ? `${t.experimentStage.winner}: ${evaluation.winningStoneId}`
      : null;

  return (
    <div
      className={`experiment-result experiment-result--${evaluation.outcome.toLowerCase()}`}
      role="status"
      aria-live="assertive"
    >
      <h4 className="experiment-result__outcome">{outcomeMeta.label}</h4>
      <p className="experiment-result__desc">{outcomeMeta.description}</p>
      {winnerLine && <p className="experiment-result__winner">{winnerLine}</p>}
      <p className="experiment-result__prediction">
        {t.experimentStage.yourPrediction}: {predictionMeta.label} —{" "}
        {predictionCorrect ? t.experimentStage.matched : t.experimentStage.notMatched}
      </p>
      {studyConfig.showRuleExplanationsToParticipant && (
        <p className="experiment-result__explanation">
          {evaluation.internalExplanation}
        </p>
      )}
    </div>
  );
}
