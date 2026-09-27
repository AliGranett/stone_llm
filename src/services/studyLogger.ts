import {
  ASSISTED_ROUNDS,
  FINAL_EXPERIMENT_LIMIT,
  ROUND_EXPERIMENT_LIMIT,
  ROUND_INQUIRY_MAX,
  ROUND_INQUIRY_MIN,
} from "../config/roundConfig";
import { studyConfig } from "../config/studyConfig";
import {
  assessExperimentAgainstTree,
  resolveFinalDecisionTree,
} from "../engine/participantTreeEvaluator";
import { buildParticipantFinalReport } from "../engine/finalReportScoring";
import type { StudyEvent, StudyEventType } from "../types";
import type { StudyState } from "../state/studyReducer";

/** Creates a structured, timestamped study event. Appended to state by the reducer. */
export function createStudyEvent(
  state: Pick<StudyState, "participantId" | "sessionId" | "phase" | "experiments" | "pendingExperiment">,
  eventType: StudyEventType,
  payload: Record<string, unknown> = {},
): StudyEvent {
  const experimentNumber =
    state.pendingExperiment?.experimentNumber ??
    (state.experiments.length > 0 ? state.experiments.length : null);
  return {
    eventId: crypto.randomUUID(),
    participantId: state.participantId,
    sessionId: state.sessionId,
    eventType,
    timestamp: new Date().toISOString(),
    phase: state.phase,
    experimentNumber,
    payload,
  };
}

/**
 * Builds the full structured export for researchers. Includes the internal
 * condition and rule metadata — this export is for research use, not for
 * display to participants.
 */
export function buildStudyExport(state: StudyState) {
  const assistedExperiments = state.experiments.filter((e) => e.phase === "ASSISTED");
  const finalInvestigationExperiments = state.experiments.filter(
    (e) => e.phase === "FINAL_INVESTIGATION",
  );
  const phaseHistory = state.eventLog
    .filter((event) =>
      [
        "STUDY_PHASE_STARTED",
        "STUDY_PHASE_COMPLETED",
        "STUDY_PHASE_ENTERED",
        "ASSISTED_ROUND_STARTED",
        "ASSISTED_ROUND_COMPLETED",
        "FINAL_INVESTIGATION_STARTED",
        "TRANSFER_STARTED",
        "TRANSFER_COMPLETED",
      ].includes(event.eventType),
    )
    .map((event) => ({
      eventType: event.eventType,
      phase: event.phase,
      timestamp: event.timestamp,
      payload: event.payload,
    }));

  const rounds = ASSISTED_ROUNDS.map((config) => ({
    round: config.round,
    stoneIds: config.stoneIds,
    experimentsCompleted: assistedExperiments.filter((e) => e.round === config.round)
      .length,
    inquiriesUsed: state.chatMessages.filter(
      (message) => message.role === "PARTICIPANT" && message.round === config.round,
    ).length,
  }));

  return {
    session: {
      studyVersion: studyConfig.studyVersion,
      participantId: state.participantId,
      sessionId: state.sessionId,
      studyMode: state.studyMode,
      startedAt: state.startedAt,
      backgroundCompletedAt: state.backgroundCompletedAt,
      condition: state.condition,
      conditionAssigned: state.conditionAssigned,
      phase: state.phase,
      currentAssistedRound: state.currentAssistedRound,
      roundExperimentLimit: ROUND_EXPERIMENT_LIMIT,
      roundInquiryMin: ROUND_INQUIRY_MIN,
      roundInquiryMax: ROUND_INQUIRY_MAX,
      finalExperimentLimit: FINAL_EXPERIMENT_LIMIT,
      exportedAt: new Date().toISOString(),
    },
    background: state.background,
    phaseHistory,
    rounds,
    assistedExperiments,
    finalInvestigationExperiments,
    experiments: state.experiments,
    pendingExperiment: state.pendingExperiment,
    chat: state.chatMessages,
    llmInteractions: state.llmInteractions,
    finalModel: {
      decisionTree: state.decisionTree,
      affinityMap: state.affinityMap,
      draft: state.finalModelDraft,
      submission: state.finalModelSubmission,
      snapshots: state.modelSnapshots,
    },
    /** Free-text submission from sessions that predate the model builder. */
    legacyFinalSubmission: state.finalSubmission,
    events: state.eventLog,
  };
}

/* ------------------------- LLM interaction export ------------------------ */

const LLM_INTERACTION_COLUMNS = [
  "participant_id",
  "session_id",
  "experiment_id",
  "interaction_id",
  "llm_mode",
  "study_phase",
  "round",
  "round_inquiry_number",
  "global_inquiry_number",
  "experiments_completed_in_round",
  "user_message",
  "llm_response",
  "user_message_timestamp",
  "llm_response_timestamp",
  "response_latency_ms",
  "prompt_version",
  "model",
] as const;

function csvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * Builds llm_interactions.csv. Contains the real model response and the
 * researcher metadata needed to trace it back to a prompt version. Never
 * contains API keys, environment values, or system prompt text.
 */
export function buildLlmInteractionsCsv(state: StudyState): string {
  const rows = state.llmInteractions.map((record) =>
    [
      record.participantId,
      record.sessionId,
      record.experimentId,
      record.interactionId,
      record.llmMode,
      record.studyPhase,
      record.round,
      record.roundInquiryNumber,
      record.globalInquiryNumber,
      record.experimentsCompletedInRound,
      record.userMessage,
      record.llmResponse,
      record.userMessageTimestamp,
      record.llmResponseTimestamp,
      record.responseLatencyMs,
      record.promptVersion,
      record.model,
    ]
      .map(csvCell)
      .join(","),
  );
  return [LLM_INTERACTION_COLUMNS.join(","), ...rows].join("\n");
}

function downloadFile(contents: string, filename: string, mimeType: string): void {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadLlmInteractionsCsv(state: StudyState): void {
  downloadFile(
    buildLlmInteractionsCsv(state),
    `llm_interactions-${state.sessionId.slice(0, 8)}.csv`,
    "text/csv;charset=utf-8",
  );
}

/* ------------------------- participant background export ----------------- */

const PARTICIPANT_COLUMNS = [
  "participant_id",
  "session_id",
  "study_mode",
  "condition",
  "started_at",
  "background_completed_at",
  "age",
  "education_level",
  "field_or_occupation",
  "llm_experience",
  "ai_learning_problem_solving_frequency",
  "ai_problem_solving_confidence",
  "current_phase",
  "current_round",
] as const;

export function buildParticipantCsv(state: StudyState): string {
  const row = [
    state.participantId,
    state.sessionId,
    state.studyMode,
    state.condition,
    state.startedAt,
    state.backgroundCompletedAt,
    state.background?.age ?? "",
    state.background?.educationLevel ?? "",
    state.background?.fieldOrOccupation ?? "",
    state.background?.llmExperience ?? "",
    state.background?.aiLearningProblemSolvingFrequency ?? "",
    state.background?.aiProblemSolvingConfidence ?? "",
    state.phase,
    state.phase === "ASSISTED" ? state.currentAssistedRound : "",
  ]
    .map(csvCell)
    .join(",");
  return [PARTICIPANT_COLUMNS.join(","), row].join("\n");
}

export function downloadParticipantCsv(state: StudyState): void {
  downloadFile(
    buildParticipantCsv(state),
    `participant-${state.sessionId.slice(0, 8)}.csv`,
    "text/csv;charset=utf-8",
  );
}

/* ------------------------- experiments export ---------------------------- */

export const EXPERIMENT_CSV_COLUMNS = [
  "participant_id",
  "session_id",
  "condition",
  "study_mode",
  "phase",
  "round",
  "global_experiment_number",
  "round_experiment_number",
  "experiment_id",
  "stone_a_id",
  "stone_a_affinity",
  "stone_a_strength",
  "stone_a_charge",
  "stone_b_id",
  "stone_b_affinity",
  "stone_b_strength",
  "stone_b_charge",
  "predicted_outcome",
  "most_important_property",
  "notes",
  "actual_outcome",
  "winning_stone_id",
  "prediction_correct",
  "evidence_support",
  "learned_from_result",
  "experiment_started_at",
  "result_revealed_at",
  "reflection_completed_at",
  "duration_ms",
  "final_tree_predicted_outcome",
  "final_tree_terminal",
  "final_tree_matches_actual",
  "final_tree_status",
] as const;

function findResultRevealedAt(
  state: StudyState,
  experimentId: string,
): string | null {
  const event = state.eventLog.find(
    (entry) =>
      entry.eventType === "EXPERIMENT_RESULT_REVEALED" &&
      entry.payload.experimentId === experimentId,
  );
  return event?.timestamp ?? null;
}

function durationMs(startedAt: string, completedAt: string): number | null {
  const start = Date.parse(startedAt);
  const end = Date.parse(completedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return end - start;
}

/**
 * Builds experiments.csv — one row per completed crystal experiment.
 * Omits hidden rule-engine fields (appliedRule, internalExplanation).
 * Rows are ordered by global experiment number (chronological).
 */
export function buildExperimentsCsv(state: StudyState): string {
  const sorted = [...state.experiments].sort(
    (a, b) => a.globalExperimentNumber - b.globalExperimentNumber,
  );
  const finalTree = resolveFinalDecisionTree(state);

  const rows = sorted.map((record) => {
    const outcome = record.evaluation.outcome;
    const revealedAt = findResultRevealedAt(state, record.id);
    const duration = durationMs(record.startedAt, record.completedAt);
    const treeAssessment = assessExperimentAgainstTree(
      finalTree,
      record.stoneA,
      record.stoneB,
      outcome,
    );
    const treeMatches =
      treeAssessment.status === "UNEVALUABLE"
        ? ""
        : treeAssessment.status === "MATCH"
          ? "true"
          : "false";

    return [
      state.participantId,
      state.sessionId,
      state.condition,
      state.studyMode,
      record.phase,
      record.round,
      record.globalExperimentNumber,
      record.roundExperimentNumber,
      record.id,
      record.stoneA.id,
      record.stoneA.affinity,
      record.stoneA.strength,
      record.stoneA.charge,
      record.stoneB.id,
      record.stoneB.affinity,
      record.stoneB.strength,
      record.stoneB.charge,
      record.prediction,
      record.mostImportantProperty,
      record.notes,
      outcome,
      record.evaluation.winningStoneId,
      record.prediction === outcome ? "true" : "false",
      record.reflection.evidenceAssessment,
      record.reflection.observation,
      record.startedAt,
      revealedAt,
      record.completedAt,
      duration,
      treeAssessment.predictedOutcome,
      treeAssessment.terminalOutcome,
      treeMatches,
      treeAssessment.status,
    ]
      .map(csvCell)
      .join(",");
  });

  // UTF-8 BOM helps Excel open Hebrew/Arabic correctly.
  return `\uFEFF${[EXPERIMENT_CSV_COLUMNS.join(","), ...rows].join("\n")}`;
}

export function downloadExperimentsCsv(state: StudyState): void {
  downloadFile(
    buildExperimentsCsv(state),
    `experiments-${state.sessionId.slice(0, 8)}.csv`,
    "text/csv;charset=utf-8",
  );
}

/* --------------------------- final report export ------------------------- */

export const FINAL_REPORT_CSV_COLUMNS = [
  "participant_id",
  "session_id",
  "condition",
  "study_mode",
  "nodes_correct",
  "nodes_total",
  "branches_correct",
  "branches_total",
  "terminals_correct",
  "terminals_total",
  "tree_slots_correct",
  "tree_slots_total",
  "experiments_total",
  "experiments_match",
  "experiments_mismatch",
  "experiments_unevaluable",
  "experiments_match_rate",
] as const;

function rateString(numerator: number, denominator: number): string {
  if (denominator <= 0) return "";
  return (numerator / denominator).toFixed(4);
}

/**
 * One-row researcher summary: exact tree accuracy vs the canonical correct
 * tree, plus experiment consistency of that final tree.
 */
export function buildFinalReportCsv(state: StudyState): string {
  const report = buildParticipantFinalReport(state);
  const evaluable = report.experiments.match + report.experiments.mismatch;

  const row = [
    state.participantId,
    state.sessionId,
    state.condition,
    state.studyMode,
    report.tree.nodes.correct,
    report.tree.nodes.total,
    report.tree.branches.correct,
    report.tree.branches.total,
    report.tree.terminals.correct,
    report.tree.terminals.total,
    report.tree.allSlots.correct,
    report.tree.allSlots.total,
    report.experiments.total,
    report.experiments.match,
    report.experiments.mismatch,
    report.experiments.unevaluable,
    rateString(report.experiments.match, evaluable),
  ]
    .map(csvCell)
    .join(",");

  return `\uFEFF${[FINAL_REPORT_CSV_COLUMNS.join(","), row].join("\n")}`;
}

export function downloadFinalReportCsv(state: StudyState): void {
  downloadFile(
    buildFinalReportCsv(state),
    `final_report-${state.sessionId.slice(0, 8)}.csv`,
    "text/csv;charset=utf-8",
  );
}

/** Triggers a JSON download of the study export (dev/researcher tooling). */
export function downloadStudyExport(state: StudyState): void {
  downloadFile(
    JSON.stringify(buildStudyExport(state), null, 2),
    `asterion-export-${state.sessionId.slice(0, 8)}.json`,
    "application/json",
  );
}
