import {
  ASSISTED_ROUND_COUNT,
  ROUND_INQUIRY_MAX,
} from "../config/roundConfig";
import { interpolate } from "../i18n/interpolate";
import { useTranslation } from "../i18n/LocaleProvider";
import {
  experimentsUsedInCurrentStage,
  getActiveExperimentPhase,
  getCurrentExperimentLimit,
  inquiriesUsedInCurrentRound,
  isExperimentPhase,
} from "../state/studyReducer";
import { useStudyStore } from "../state/studyStore";

export function StudyPhaseHeader() {
  const { state } = useStudyStore();
  const { t } = useTranslation();

  if (!isExperimentPhase(state) && state.phase !== "COMPLETE") {
    return null;
  }

  const experimentPhase = getActiveExperimentPhase(state);
  const limit = experimentPhase ? getCurrentExperimentLimit(state) : 0;
  const used = experimentPhase ? experimentsUsedInCurrentStage(state) : 0;
  const inquiriesUsed =
    experimentPhase === "ASSISTED" ? inquiriesUsedInCurrentRound(state) : 0;

  const label =
    state.phase === "ASSISTED"
      ? t.phase.assisted
      : state.phase === "FINAL_INVESTIGATION"
        ? t.phase.finalInvestigation
        : t.phase.complete;

  return (
    <header className="phase-header" aria-label={t.phase.progressAria}>
      <div className="phase-header__text">
        <h2 className="phase-header__phase">
          {label}
          {state.phase === "ASSISTED" && (
            <span className="phase-header__round">
              {" · "}
              {interpolate(t.phase.roundLabel, {
                round: state.currentAssistedRound,
                total: ASSISTED_ROUND_COUNT,
              })}
            </span>
          )}
        </h2>
        {experimentPhase && (
          <p className="phase-header__progress">
            {interpolate(t.phase.experimentsCounter, { used, total: limit })}
            {experimentPhase === "ASSISTED" && (
              <>
                {" · "}
                {interpolate(t.phase.inquiriesCounter, {
                  used: inquiriesUsed,
                  total: ROUND_INQUIRY_MAX,
                })}
              </>
            )}
          </p>
        )}
      </div>
      {experimentPhase && (
        <div
          className="phase-header__meter"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={used}
          aria-label={interpolate(t.phase.experimentsUsedAria, {
            used,
            total: limit,
          })}
        >
          {Array.from({ length: limit }, (_, i) => (
            <span
              key={i}
              className={`phase-header__meter-dot ${i < used ? "phase-header__meter-dot--used" : ""}`}
            />
          ))}
        </div>
      )}
    </header>
  );
}
