import { useState } from "react";
import { studyConfig } from "../config/studyConfig";
import { studyPersistence } from "../services/studyPersistence";
import {
  downloadExperimentsCsv,
  downloadFinalReportCsv,
  downloadLlmInteractionsCsv,
  downloadParticipantCsv,
  downloadStudyExport,
} from "../services/studyLogger";
import {
  getCurrentRoundExperiments,
  inquiriesUsedInCurrentRound,
} from "../state/studyReducer";
import { useStudyStore } from "../state/studyStore";
import type { ExperimentalCondition } from "../types";

/**
 * Development-only controls. Rendered only when
 * studyConfig.enableDevControls is true (never in production builds).
 */
export function DevPanel() {
  const { state, dispatch } = useStudyStore();
  const [open, setOpen] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showModel, setShowModel] = useState(false);

  if (!studyConfig.enableDevControls) return null;

  return (
    <aside className="dev-panel" aria-label="Development controls">
      <button
        type="button"
        className="dev-panel__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        DEV
      </button>

      {open && (
        <div className="dev-panel__body">
          <p className="dev-panel__row">
            Mode: <strong>{state.studyMode ?? "none"}</strong>
          </p>
          <p className="dev-panel__row">
            Phase: <strong>{state.phase}</strong>
          </p>

          {state.studyMode === "TESTING" && (
            <p className="dev-panel__row">
              <label htmlFor="dev-condition">LLM condition:</label>
              <select
                id="dev-condition"
                className="dev-panel__select"
                value={state.condition ?? "ANALYTICAL"}
                onChange={(event) =>
                  dispatch({
                    type: "DEV_SET_CONDITION",
                    condition: event.target.value as ExperimentalCondition,
                  })
                }
              >
                <option value="ANALYTICAL">ANALYTICAL</option>
                <option value="HYPOTHESIS_DRIVEN">HYPOTHESIS_DRIVEN</option>
              </select>
            </p>
          )}

          {state.phase === "ASSISTED" && (
            <p className="dev-panel__row">
              <label htmlFor="dev-round">Round:</label>
              <select
                id="dev-round"
                className="dev-panel__select"
                value={state.currentAssistedRound}
                onChange={(event) =>
                  dispatch({
                    type: "DEV_SET_ROUND",
                    round: Number(event.target.value),
                  })
                }
              >
                {[1, 2, 3].map((round) => (
                  <option key={round} value={round}>
                    {round}
                  </option>
                ))}
              </select>
              <span>
                exp {getCurrentRoundExperiments(state).length} · inq{" "}
                {inquiriesUsedInCurrentRound(state)}
              </span>
            </p>
          )}

          {state.pendingExperiment && (
            <p className="dev-panel__row">
              Applied rule: <strong>{state.pendingExperiment.evaluation.appliedRule}</strong>
            </p>
          )}

          <div className="dev-panel__actions">
            {state.phase === "INSTRUCTIONS" && (
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => dispatch({ type: "DEV_SKIP_INSTRUCTIONS" })}
              >
                Skip instructions → investigation
              </button>
            )}
            {state.phase === "ASSISTED" && (
              <>
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => dispatch({ type: "DEV_RESET_ROUND" })}
                >
                  Reset current round counters
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => dispatch({ type: "DEV_SKIP_TO_FINAL_INVESTIGATION" })}
                >
                  Skip to final investigation
                </button>
              </>
            )}
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => setShowModel((v) => !v)}
            >
              {showModel ? "Hide" : "Show"} tree/affinity state
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => downloadStudyExport(state)}
            >
              Export study JSON
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => downloadFinalReportCsv(state)}
            >
              Export final_report.csv
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => downloadExperimentsCsv(state)}
            >
              Export experiments.csv ({state.experiments.length})
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => downloadParticipantCsv(state)}
            >
              Export participant.csv
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => downloadLlmInteractionsCsv(state)}
            >
              Export llm_interactions.csv ({state.llmInteractions.length})
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => setShowLog((v) => !v)}
            >
              {showLog ? "Hide" : "Show"} event log ({state.eventLog.length})
            </button>
            <button
              type="button"
              className="btn btn--danger btn--small"
              onClick={() => {
                studyPersistence.clear();
                dispatch({ type: "RESET_SESSION" });
              }}
            >
              Reset session
            </button>
          </div>

          {showModel && (
            <pre className="dev-panel__log">
              {JSON.stringify(
                { decisionTree: state.decisionTree, affinityMap: state.affinityMap },
                null,
                2,
              )}
            </pre>
          )}

          {showLog && (
            <pre className="dev-panel__log">
              {state.eventLog
                .slice(-40)
                .map(
                  (e) =>
                    `${e.timestamp.slice(11, 19)} ${e.eventType} ${JSON.stringify(e.payload)}`,
                )
                .join("\n")}
            </pre>
          )}
        </div>
      )}
    </aside>
  );
}
