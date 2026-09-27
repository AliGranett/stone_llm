import { useRef, useState } from "react";
import { ASSISTED_ROUND_COUNT, ROUND_INQUIRY_MIN } from "../config/roundConfig";
import { interpolate } from "../i18n/interpolate";
import { useTranslation } from "../i18n/LocaleProvider";
import {
  canFinishAssistedRound,
  inquiriesUsedInCurrentRound,
  isDecisionTreeAvailable,
  isExperimentPhase,
  isLimitReached,
  isRoundExperimentsComplete,
} from "../state/studyReducer";
import { useStudyStore } from "../state/studyStore";
import { AffinityRelationshipsPanel } from "./AffinityRelationshipsPanel";
import { BackgroundQuestionnaire } from "./BackgroundQuestionnaire";
import { DecisionTreeBuilder } from "./DecisionTreeBuilder";
import { DevPanel } from "./DevPanel";
import { ExperimentControls } from "./ExperimentControls";
import { ExperimentHistory } from "./ExperimentHistory";
import { ExperimentStage } from "./ExperimentStage";
import { FinalInvestigationIntro } from "./FinalInvestigationIntro";
import { FinalModelSubmission } from "./FinalModelSubmission";
import { HypothesisForm } from "./HypothesisForm";
import { InstructionsHelpButton } from "./InstructionsHelpButton";
import { InstructionsScreen } from "./InstructionsScreen";
import { LanguageSelector } from "./LanguageSelector";
import { PredictionForm } from "./PredictionForm";
import { ResearchDataDownloads } from "./ResearchDataDownloads";
import { ResearchPartnerPanel } from "./ResearchPartnerPanel";
import { SelectedStonePair } from "./SelectedStonePair";
import { StoneGrid } from "./StoneGrid";
import { StudyEntryScreen } from "./StudyEntryScreen";
import { StudyPhaseHeader } from "./StudyPhaseHeader";

function ExperimentSetup({ onRun }: { onRun: () => void }) {
  return (
    <>
      <StoneGrid />
      <SelectedStonePair />
      <div className="setup-forms">
        <PredictionForm />
        <HypothesisForm />
      </div>
      <ExperimentControls onRun={onRun} />
    </>
  );
}

/**
 * Shown when the round's experiments are done but the participant has not
 * yet consulted the Research Partner the required number of times.
 */
function RoundInquiryGatePanel() {
  const { state } = useStudyStore();
  const { t } = useTranslation();
  const used = inquiriesUsedInCurrentRound(state);

  return (
    <section className="panel limit-panel" aria-labelledby="round-gate-heading">
      <h3 id="round-gate-heading" className="panel__title">
        {interpolate(t.round.completeTitle, { round: state.currentAssistedRound })}
      </h3>
      <p role="status">
        {interpolate(t.round.needMoreInquiries, {
          used,
          min: ROUND_INQUIRY_MIN,
        })}
      </p>
    </section>
  );
}

/** Shown when the round is complete and the participant may continue. */
function RoundCompletePanel() {
  const { state, dispatch } = useStudyStore();
  const { t } = useTranslation();
  const round = state.currentAssistedRound;
  const isLastRound = round >= ASSISTED_ROUND_COUNT;

  return (
    <section className="panel limit-panel" aria-labelledby="round-complete-heading">
      <h3 id="round-complete-heading" className="panel__title">
        {interpolate(t.round.completeTitle, { round })}
      </h3>
      <p>{t.round.completeBody}</p>
      <button
        type="button"
        className="btn btn--primary btn--large"
        onClick={() => dispatch({ type: "FINISH_ASSISTED_ROUND" })}
      >
        {isLastRound
          ? t.round.continueFinal
          : interpolate(t.round.continueNext, { round: round + 1 })}
      </button>
    </section>
  );
}

function ExperimentFlow() {
  const { state, dispatch } = useStudyStore();
  const animatingIdRef = useRef<string | null>(null);
  const [, forceRender] = useState(0);

  const runExperiment = () => {
    dispatch({ type: "RUN_EXPERIMENT" });
    animatingIdRef.current = "pending-run";
    forceRender((n) => n + 1);
  };

  if (state.pendingExperiment) {
    const playAnimation = animatingIdRef.current === "pending-run";
    return (
      <ExperimentStage
        key={state.pendingExperiment.id}
        pending={state.pendingExperiment}
        playAnimation={playAnimation}
        onRevealed={() => {
          if (animatingIdRef.current === "pending-run") {
            animatingIdRef.current = null;
            dispatch({
              type: "LOG_EVENT",
              eventType: "EXPERIMENT_RESULT_REVEALED",
              payload: { experimentId: state.pendingExperiment?.id },
            });
          }
        }}
      />
    );
  }

  if (state.phase === "ASSISTED" && isRoundExperimentsComplete(state)) {
    return canFinishAssistedRound(state) ? (
      <RoundCompletePanel />
    ) : (
      <RoundInquiryGatePanel />
    );
  }

  if (state.phase === "FINAL_INVESTIGATION" && isLimitReached(state)) {
    return null;
  }

  return <ExperimentSetup onRun={runExperiment} />;
}

function StudyMainColumn() {
  const { state } = useStudyStore();
  const { t } = useTranslation();
  const showTree = isDecisionTreeAvailable(state);

  return (
    <div className="study-workspace__main">
      <StudyPhaseHeader />
      {state.phase === "FINAL_INVESTIGATION" && <FinalInvestigationIntro />}
      <ExperimentHistory />

      {state.phase === "COMPLETE" && (
        <section className="panel complete-panel" aria-labelledby="complete-heading">
          <h3 id="complete-heading" className="panel__title">
            {t.complete.title}
          </h3>
          <p>{t.complete.body}</p>
        </section>
      )}

      {state.phase === "COMPLETE" && <ResearchDataDownloads />}

      {isExperimentPhase(state) && <ExperimentFlow />}

      {showTree && (
        <div className="study-workspace__tree">
          <DecisionTreeBuilder />
        </div>
      )}

      {state.phase === "FINAL_INVESTIGATION" && (
        <>
          <section className="panel model-panel" aria-labelledby="affinity-ref-heading">
            <AffinityRelationshipsPanel
              headingId="affinity-ref-heading"
              asReference
            />
          </section>
          <FinalModelSubmission />
        </>
      )}
    </div>
  );
}

function StudyMainContent() {
  const { state, persistenceStatus } = useStudyStore();
  const { t } = useTranslation();
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const showInstructionsHelp =
    isExperimentPhase(state) || state.phase === "COMPLETE";
  const useSplitLayout = isExperimentPhase(state);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="main-column main-column--header app-header__bar">
          <div className="app-header__brand">
            <h1 className="app-header__title">{t.app.title}</h1>
            <p className="app-header__subtitle">{t.app.subtitle}</p>
            {persistenceStatus === "error" && (
              <p className="app-header__save-error" role="alert">
                {t.app.saveError}
              </p>
            )}
          </div>
          <div className="app-header__actions">
            {showInstructionsHelp && (
              <InstructionsHelpButton
                open={instructionsOpen}
                onOpen={() => setInstructionsOpen(true)}
                onClose={() => setInstructionsOpen(false)}
              />
            )}
            <LanguageSelector />
          </div>
        </div>
      </header>

      <main
        className={`main-column ${useSplitLayout ? "main-column--workspace" : ""}`}
        aria-label={t.app.mainAria}
      >
        {useSplitLayout ? (
          <div className="study-workspace study-workspace--split">
            <aside className="study-workspace__partner" aria-label={t.partner.title}>
              <ResearchPartnerPanel />
            </aside>
            <StudyMainColumn />
          </div>
        ) : (
          <>
            {state.phase === "COMPLETE" && <ResearchPartnerPanel />}
            <StudyMainColumn />
          </>
        )}
      </main>

      <DevPanel />
    </div>
  );
}

export function AsterionExperimentPage() {
  const { state } = useStudyStore();

  if (state.phase === "ENTRY") {
    return (
      <>
        <StudyEntryScreen />
        <DevPanel />
      </>
    );
  }

  if (state.phase === "BACKGROUND") {
    return (
      <>
        <BackgroundQuestionnaire />
        <DevPanel />
      </>
    );
  }

  if (state.phase === "INSTRUCTIONS") {
    return (
      <>
        <InstructionsScreen />
        <DevPanel />
      </>
    );
  }

  return <StudyMainContent />;
}
