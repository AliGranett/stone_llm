import { useEffect, useState } from "react";
import { interpolate } from "../i18n/interpolate";
import { useTranslation } from "../i18n/LocaleProvider";
import type { PendingExperiment } from "../types";
import { StoneCard } from "./StoneCard";
import { ExperimentResult } from "./ExperimentResult";
import { ReflectionForm } from "./ReflectionForm";

interface ExperimentStageProps {
  pending: PendingExperiment;
  playAnimation: boolean;
  onRevealed: () => void;
}

const ANIMATION_MS = 1500;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function ExperimentStage({ pending, playAnimation, onRevealed }: ExperimentStageProps) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(!playAnimation || prefersReducedMotion());

  useEffect(() => {
    if (revealed) {
      onRevealed();
      return;
    }
    const timer = setTimeout(() => {
      setRevealed(true);
      onRevealed();
    }, ANIMATION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { evaluation } = pending;
  const stoneAState = revealed
    ? evaluation.outcome === "STONE_B_WINS"
      ? "loser"
      : evaluation.outcome === "MUTUAL_NEUTRALIZATION"
        ? "neutralized"
        : evaluation.outcome === "STONE_A_WINS"
          ? "winner"
          : "stalemate"
    : "colliding";
  const stoneBState = revealed
    ? evaluation.outcome === "STONE_A_WINS"
      ? "loser"
      : evaluation.outcome === "MUTUAL_NEUTRALIZATION"
        ? "neutralized"
        : evaluation.outcome === "STONE_B_WINS"
          ? "winner"
          : "stalemate"
    : "colliding";

  return (
    <section aria-labelledby="stage-heading" className="panel experiment-stage">
      <h3 id="stage-heading" className="panel__title">
        {interpolate(t.experimentStage.title, { number: pending.experimentNumber })}
      </h3>

      <div
        className={`experiment-stage__arena ${revealed ? "" : "experiment-stage__arena--running"}`}
      >
        <div
          className={`experiment-stage__stone experiment-stage__stone--a experiment-stage__stone--${stoneAState}`}
        >
          <span className="experiment-stage__stone-label">{t.experimentStage.stoneA}</span>
          <StoneCard stone={pending.stoneA} selectionSlot={null} compact />
          {revealed && stoneAState === "winner" && (
            <span className="experiment-stage__winner-tag">{t.experimentStage.winner}</span>
          )}
        </div>

        <div className="experiment-stage__center" aria-hidden="true">
          {revealed ? (
            evaluation.outcome === "STALEMATE" ? (
              <span className="experiment-stage__balance">⚖</span>
            ) : null
          ) : (
            <span className="experiment-stage__spark" />
          )}
        </div>

        <div
          className={`experiment-stage__stone experiment-stage__stone--b experiment-stage__stone--${stoneBState}`}
        >
          <span className="experiment-stage__stone-label">{t.experimentStage.stoneB}</span>
          <StoneCard stone={pending.stoneB} selectionSlot={null} compact />
          {revealed && stoneBState === "winner" && (
            <span className="experiment-stage__winner-tag">{t.experimentStage.winner}</span>
          )}
        </div>
      </div>

      {!revealed && (
        <p className="experiment-stage__running-text" role="status">
          {t.experimentStage.running}
        </p>
      )}

      {revealed && (
        <>
          <ExperimentResult pending={pending} />
          <ReflectionForm />
        </>
      )}
    </section>
  );
}
