import {
  createEmptyAffinityMap,
  createEmptyDecisionTree,
  isKnownBranchId,
  siblingBranchId,
} from "../config/finalModelConfig";
import {
  ASSISTED_ROUND_COUNT,
  FINAL_EXPERIMENT_LIMIT,
  ROUND_EXPERIMENT_LIMIT,
  ROUND_INQUIRY_MAX,
  ROUND_INQUIRY_MIN,
  getStonesForRound,
} from "../config/roundConfig";
import { STONE_SET, getStoneById } from "../config/stoneSet";
import { evaluateExperiment } from "../engine/asterionRuleEngine";
import { resolveManualCondition } from "../services/conditionAssignment";
import { createStudyEvent } from "../services/studyLogger";
import type {
  AffinityMapState,
  AffinityRelationValue,
  AiProblemSolvingConfidence,
  BranchLabel,
  ChatMessage,
  DecisionConditionId,
  DecisionTreeState,
  EducationLevel,
  EvidenceAssessment,
  ExperimentPhase,
  ExperimentPrediction,
  ExperimentRecord,
  ExperimentalCondition,
  FinalModelSnapshot,
  FinalModelSnapshotReason,
  FinalModelSubmission,
  FinalRuleSubmissionData,
  LlmExperience,
  LlmInteractionRecord,
  MostImportantProperty,
  ParticipantBackground,
  PendingExperiment,
  Stone,
  StudyEvent,
  StudyEventType,
  StudyMode,
  StudyPhase,
  TerminalOutcomeId,
} from "../types";
import { MOST_IMPORTANT_PROPERTIES } from "../types";

export interface ReflectionDraft {
  evidenceAssessment: EvidenceAssessment | null;
  observation: string;
}

export interface BackgroundDraft {
  age: string;
  educationLevel: EducationLevel | "";
  fieldOrOccupation: string;
  llmExperience: LlmExperience | "";
  aiLearningProblemSolvingFrequency: LlmExperience | "";
  aiProblemSolvingConfidence: AiProblemSolvingConfidence | "";
}

export interface FinalModelDraft {
  notes: string;
  confidence: number | null;
}

export interface StudyState {
  participantId: string;
  sessionId: string;
  /** null until the participant chooses a mode on the entry screen. */
  studyMode: StudyMode | null;
  startedAt: string | null;
  background: ParticipantBackground | null;
  backgroundDraft: BackgroundDraft;
  backgroundCompletedAt: string | null;
  /** Set when the participant finishes the pre-study instructions screen. */
  instructionsCompletedAt: string | null;
  /**
   * Authoritative experimental condition. Set once via random assignment
   * (Participant Mode) or manual selection (Testing Mode). Never re-assigned.
   */
  condition: ExperimentalCondition | null;
  conditionAssigned: boolean;
  phase: StudyPhase;
  /** Current assisted round (1–3); meaningful only while phase is ASSISTED. */
  currentAssistedRound: number;
  selectedStoneIds: { a: string | null; b: string | null };
  prediction: ExperimentPrediction | null;
  /** Structured: which property the participant currently thinks matters most. */
  mostImportantProperty: MostImportantProperty | null;
  /** Optional free-text notes for the upcoming / current experiment. */
  notes: string;
  pendingExperiment: PendingExperiment | null;
  reflectionDraft: ReflectionDraft;
  experiments: ExperimentRecord[];
  chatMessages: ChatMessage[];
  llmInteractions: LlmInteractionRecord[];
  /** Participant-built final model, editable during FINAL_INVESTIGATION. */
  decisionTree: DecisionTreeState;
  affinityMap: AffinityMapState;
  finalModelDraft: FinalModelDraft;
  finalModelSubmission: FinalModelSubmission | null;
  modelSnapshots: FinalModelSnapshot[];
  /** @deprecated Legacy free-text submission from pre-round sessions. */
  finalSubmission: FinalRuleSubmissionData | null;
  eventLog: StudyEvent[];
}

export type StudyAction =
  | {
      type: "SELECT_STUDY_MODE";
      mode: StudyMode;
      /** Research Partner style chosen on the entry screen. */
      condition?: ExperimentalCondition;
      /** @deprecated Use `condition` — kept for existing tests. */
      testingCondition?: ExperimentalCondition;
    }
  | { type: "UPDATE_BACKGROUND_DRAFT"; patch: Partial<BackgroundDraft> }
  | { type: "SUBMIT_BACKGROUND" }
  | { type: "COMPLETE_INSTRUCTIONS" }
  | { type: "FINISH_ASSISTED_ROUND" }
  | { type: "TOGGLE_STONE"; stoneId: string }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_PREDICTION"; prediction: ExperimentPrediction }
  | { type: "SET_MOST_IMPORTANT_PROPERTY"; value: MostImportantProperty }
  | { type: "SET_NOTES"; value: string }
  | { type: "RUN_EXPERIMENT" }
  | { type: "UPDATE_REFLECTION_DRAFT"; patch: Partial<ReflectionDraft> }
  | { type: "SUBMIT_REFLECTION" }
  | { type: "SET_TREE_NODE"; nodeId: string; condition: DecisionConditionId | null }
  | { type: "SET_TREE_BRANCH"; branchId: string; label: BranchLabel }
  | { type: "SET_TREE_TERMINAL"; terminalId: string; outcome: TerminalOutcomeId | null }
  | { type: "SET_AFFINITY_RELATION"; pairId: string; relation: AffinityRelationValue }
  | { type: "UPDATE_FINAL_MODEL_DRAFT"; patch: Partial<FinalModelDraft> }
  | { type: "SUBMIT_FINAL_MODEL" }
  | {
      type: "ADD_CHAT_MESSAGE";
      message: ChatMessage;
      eventType: "LLM_MESSAGE_SENT" | "LLM_RESPONSE_RECEIVED";
    }
  | { type: "RECORD_LLM_INTERACTION"; interaction: LlmInteractionRecord }
  | { type: "LOG_EVENT"; eventType: StudyEventType; payload?: Record<string, unknown> }
  | { type: "DEV_SET_CONDITION"; condition: ExperimentalCondition }
  | { type: "DEV_CLEAR_CHAT" }
  | { type: "DEV_SET_ROUND"; round: number }
  | { type: "DEV_RESET_ROUND" }
  | { type: "DEV_SKIP_TO_FINAL_INVESTIGATION" }
  | { type: "DEV_SKIP_INSTRUCTIONS" }
  | { type: "RESET_SESSION" };

const EMPTY_REFLECTION_DRAFT: ReflectionDraft = {
  evidenceAssessment: null,
  observation: "",
};

const EMPTY_BACKGROUND_DRAFT: BackgroundDraft = {
  age: "",
  educationLevel: "",
  fieldOrOccupation: "",
  llmExperience: "",
  aiLearningProblemSolvingFrequency: "",
  aiProblemSolvingConfidence: "",
};

const EMPTY_FINAL_MODEL_DRAFT: FinalModelDraft = {
  notes: "",
  confidence: null,
};

export function createInitialState(): StudyState {
  return {
    participantId: `P-${crypto.randomUUID().slice(0, 8)}`,
    sessionId: crypto.randomUUID(),
    studyMode: null,
    startedAt: null,
    background: null,
    backgroundDraft: EMPTY_BACKGROUND_DRAFT,
    backgroundCompletedAt: null,
    instructionsCompletedAt: null,
    condition: null,
    conditionAssigned: false,
    phase: "ENTRY",
    currentAssistedRound: 1,
    selectedStoneIds: { a: null, b: null },
    prediction: null,
    mostImportantProperty: null,
    notes: "",
    pendingExperiment: null,
    reflectionDraft: EMPTY_REFLECTION_DRAFT,
    experiments: [],
    chatMessages: [],
    llmInteractions: [],
    decisionTree: createEmptyDecisionTree(),
    affinityMap: createEmptyAffinityMap(),
    finalModelDraft: EMPTY_FINAL_MODEL_DRAFT,
    finalModelSubmission: null,
    modelSnapshots: [],
    finalSubmission: null,
    eventLog: [],
  };
}

/* ------------------------------- selectors ------------------------------ */

export function getActiveExperimentPhase(state: StudyState): ExperimentPhase | null {
  if (state.phase === "ASSISTED") return "ASSISTED";
  if (state.phase === "FINAL_INVESTIGATION") return "FINAL_INVESTIGATION";
  return null;
}

export function getExperimentsForPhase(
  state: StudyState,
  phase: ExperimentPhase,
): ExperimentRecord[] {
  return state.experiments.filter((record) => record.phase === phase);
}

export function getRoundExperiments(state: StudyState, round: number): ExperimentRecord[] {
  return state.experiments.filter(
    (record) => record.phase === "ASSISTED" && record.round === round,
  );
}

export function getCurrentRoundExperiments(state: StudyState): ExperimentRecord[] {
  return getRoundExperiments(state, state.currentAssistedRound);
}

export function getFinalInvestigationExperiments(state: StudyState): ExperimentRecord[] {
  return getExperimentsForPhase(state, "FINAL_INVESTIGATION");
}

/** Completed + pending experiments in the current stage (round or final). */
export function experimentsUsedInCurrentStage(state: StudyState): number {
  const phase = getActiveExperimentPhase(state);
  if (!phase) return 0;
  const completed =
    phase === "ASSISTED"
      ? getCurrentRoundExperiments(state).length
      : getFinalInvestigationExperiments(state).length;
  const pendingHere =
    state.pendingExperiment?.phase === phase &&
    (phase === "FINAL_INVESTIGATION" ||
      state.pendingExperiment?.round === state.currentAssistedRound)
      ? 1
      : 0;
  return completed + pendingHere;
}

export function getCurrentExperimentLimit(state: StudyState): number {
  const phase = getActiveExperimentPhase(state);
  if (!phase) return 0;
  return phase === "ASSISTED" ? ROUND_EXPERIMENT_LIMIT : FINAL_EXPERIMENT_LIMIT;
}

export function experimentsRemaining(state: StudyState): number {
  const phase = getActiveExperimentPhase(state);
  if (!phase) return 0;
  return Math.max(0, getCurrentExperimentLimit(state) - experimentsUsedInCurrentStage(state));
}

export function isLimitReached(state: StudyState): boolean {
  const phase = getActiveExperimentPhase(state);
  if (!phase) return false;
  const completed =
    phase === "ASSISTED"
      ? getCurrentRoundExperiments(state).length
      : getFinalInvestigationExperiments(state).length;
  return completed >= getCurrentExperimentLimit(state);
}

/** True while the participant may still change selection/forms. */
export function canEditSetup(state: StudyState): boolean {
  return (
    getActiveExperimentPhase(state) !== null &&
    state.pendingExperiment === null &&
    !isLimitReached(state)
  );
}

/** Stones visible in the current stage: round subset or the full set. */
export function getAvailableStones(state: StudyState): Stone[] {
  if (state.phase === "ASSISTED") return getStonesForRound(state.currentAssistedRound);
  if (state.phase === "FINAL_INVESTIGATION" || state.phase === "COMPLETE") {
    return [...STONE_SET];
  }
  return [];
}

/** User inquiries (participant messages) sent during a given round. */
export function inquiriesUsedInRound(state: StudyState, round: number): number {
  return state.chatMessages.filter(
    (message) => message.role === "PARTICIPANT" && message.round === round,
  ).length;
}

export function inquiriesUsedInCurrentRound(state: StudyState): number {
  return inquiriesUsedInRound(state, state.currentAssistedRound);
}

/** Total user inquiries across the whole session. */
export function totalInquiriesUsed(state: StudyState): number {
  return state.chatMessages.filter((message) => message.role === "PARTICIPANT").length;
}

/** The Research Partner exists only during the assisted rounds. */
export function canUseResearchPartner(state: StudyState): boolean {
  return (
    state.phase === "ASSISTED" &&
    state.conditionAssigned &&
    state.condition !== null
  );
}

/** Whether a NEW user inquiry may be sent right now. */
export function canSendInquiry(state: StudyState): boolean {
  return (
    canUseResearchPartner(state) &&
    inquiriesUsedInCurrentRound(state) < ROUND_INQUIRY_MAX
  );
}

/** All round experiments completed and the last reflection submitted. */
export function isRoundExperimentsComplete(state: StudyState): boolean {
  return (
    state.phase === "ASSISTED" &&
    state.pendingExperiment === null &&
    getCurrentRoundExperiments(state).length >= ROUND_EXPERIMENT_LIMIT
  );
}

/** Round may be finished: experiments done AND the minimum inquiries used. */
export function canFinishAssistedRound(state: StudyState): boolean {
  return (
    isRoundExperimentsComplete(state) &&
    inquiriesUsedInCurrentRound(state) >= ROUND_INQUIRY_MIN
  );
}

export function getSelectedStones(state: StudyState): {
  stoneA: Stone | null;
  stoneB: Stone | null;
} {
  return {
    stoneA: state.selectedStoneIds.a ? (getStoneById(state.selectedStoneIds.a) ?? null) : null,
    stoneB: state.selectedStoneIds.b ? (getStoneById(state.selectedStoneIds.b) ?? null) : null,
  };
}

export type RunBlockerKey =
  | "SELECT_STONES"
  | "CHOOSE_PREDICTION"
  | "CHOOSE_PROPERTY";

export function getRunBlockers(state: StudyState): RunBlockerKey[] {
  const blockers: RunBlockerKey[] = [];
  if (!state.selectedStoneIds.a || !state.selectedStoneIds.b) {
    blockers.push("SELECT_STONES");
  }
  if (!state.prediction) blockers.push("CHOOSE_PREDICTION");
  if (!state.mostImportantProperty) blockers.push("CHOOSE_PROPERTY");
  return blockers;
}

export function canRunExperiment(state: StudyState): boolean {
  return canEditSetup(state) && getRunBlockers(state).length === 0;
}

export function isReflectionComplete(draft: ReflectionDraft): boolean {
  return draft.evidenceAssessment !== null;
}

/** Decision tree is revealed after Round 1 and stays available through the final stage. */
export function isDecisionTreeAvailable(state: StudyState): boolean {
  if (state.phase === "FINAL_INVESTIGATION" || state.phase === "COMPLETE") {
    return true;
  }
  return state.phase === "ASSISTED" && state.currentAssistedRound > 1;
}

export function canEditDecisionTree(state: StudyState): boolean {
  return (
    state.phase === "FINAL_INVESTIGATION" ||
    (state.phase === "ASSISTED" && state.currentAssistedRound > 1)
  );
}

export function isBackgroundComplete(draft: BackgroundDraft): boolean {
  const age = Number(draft.age);
  return (
    Number.isFinite(age) &&
    age >= 1 &&
    age <= 120 &&
    draft.educationLevel !== "" &&
    draft.fieldOrOccupation.trim().length > 0 &&
    draft.llmExperience !== "" &&
    draft.aiLearningProblemSolvingFrequency !== "" &&
    draft.aiProblemSolvingConfidence !== ""
  );
}

/** Final model may be submitted after all final experiments + a confidence. */
export function canSubmitFinalModel(state: StudyState): boolean {
  return (
    state.phase === "FINAL_INVESTIGATION" &&
    state.pendingExperiment === null &&
    getFinalInvestigationExperiments(state).length >= FINAL_EXPERIMENT_LIMIT &&
    state.finalModelDraft.confidence !== null
  );
}

export function isExperimentPhase(state: StudyState): boolean {
  return state.phase === "ASSISTED" || state.phase === "FINAL_INVESTIGATION";
}

/* -------------------------------- reducer ------------------------------- */

function withEvent(
  state: StudyState,
  eventType: StudyEventType,
  payload: Record<string, unknown> = {},
): StudyState {
  // Defaults first so explicit payload keys (e.g. a completed phase) win.
  const enriched: Record<string, unknown> = {
    studyMode: state.studyMode,
    phase: state.phase,
    ...(state.phase === "ASSISTED" ? { round: state.currentAssistedRound } : {}),
    ...(state.conditionAssigned && state.condition
      ? { condition: state.condition }
      : {}),
    ...payload,
  };
  return {
    ...state,
    eventLog: [...state.eventLog, createStudyEvent(state, eventType, enriched)],
  };
}

function transitionPhase(
  state: StudyState,
  nextPhase: StudyPhase,
  completedPhase?: StudyPhase,
): StudyState {
  let next = { ...state, phase: nextPhase };
  if (completedPhase) {
    next = withEvent(next, "STUDY_PHASE_COMPLETED", { phase: completedPhase });
  }
  next = withEvent(next, "STUDY_PHASE_STARTED", { phase: nextPhase });
  return withEvent(next, "STUDY_PHASE_ENTERED", { phase: nextPhase });
}

function backgroundFromDraft(draft: BackgroundDraft): ParticipantBackground {
  return {
    age: Number(draft.age),
    educationLevel: draft.educationLevel as EducationLevel,
    fieldOrOccupation: draft.fieldOrOccupation.trim(),
    llmExperience: draft.llmExperience as LlmExperience,
    aiLearningProblemSolvingFrequency:
      draft.aiLearningProblemSolvingFrequency as LlmExperience,
    aiProblemSolvingConfidence:
      draft.aiProblemSolvingConfidence as AiProblemSolvingConfidence,
  };
}

/** Context payload for final-model edit events (research reconstruction). */
function modelEditContext(state: StudyState): Record<string, unknown> {
  return {
    round: state.phase === "ASSISTED" ? state.currentAssistedRound : null,
    experimentsCompleted: state.experiments.length,
    finalStageExperimentsCompleted: getFinalInvestigationExperiments(state).length,
  };
}

/** Appends a compact model snapshot plus its log event. */
function takeModelSnapshot(
  state: StudyState,
  reason: FinalModelSnapshotReason,
): StudyState {
  const snapshot: FinalModelSnapshot = {
    reason,
    timestamp: new Date().toISOString(),
    finalExperimentsCompleted: getFinalInvestigationExperiments(state).length,
    decisionTree: state.decisionTree,
    affinityMap: state.affinityMap,
  };
  const next = { ...state, modelSnapshots: [...state.modelSnapshots, snapshot] };
  return withEvent(next, "FINAL_MODEL_SNAPSHOT_TAKEN", {
    reason,
    finalStageExperimentsCompleted: snapshot.finalExperimentsCompleted,
  });
}

function enterInstructionsPhase(state: StudyState, completedPhase: StudyPhase): StudyState {
  const next = transitionPhase(state, "INSTRUCTIONS", completedPhase);
  return withEvent(next, "INSTRUCTIONS_STARTED", {});
}

function enterAssistedPhase(state: StudyState, completedPhase: StudyPhase): StudyState {
  const next = transitionPhase(
    { ...state, currentAssistedRound: 1 },
    "ASSISTED",
    completedPhase,
  );
  return withEvent(next, "ASSISTED_ROUND_STARTED", { round: 1 });
}

function enterFinalInvestigation(state: StudyState): StudyState {
  const cleared: StudyState = {
    ...state,
    selectedStoneIds: { a: null, b: null },
    prediction: null,
    notes: "",
  };
  let next = transitionPhase(cleared, "FINAL_INVESTIGATION", "ASSISTED");
  next = withEvent(next, "FINAL_INVESTIGATION_STARTED", {
    finalExperimentLimit: FINAL_EXPERIMENT_LIMIT,
  });
  return takeModelSnapshot(next, "FINAL_STAGE_STARTED");
}

function handleToggleStone(state: StudyState, stoneId: string): StudyState {
  if (!canEditSetup(state)) return state;
  if (!getAvailableStones(state).some((stone) => stone.id === stoneId)) return state;
  const { a, b } = state.selectedStoneIds;

  if (a === stoneId) {
    return withEvent(
      { ...state, selectedStoneIds: { a: null, b } },
      "STONE_DESELECTED",
      { stoneId, slot: "A" },
    );
  }
  if (b === stoneId) {
    return withEvent(
      { ...state, selectedStoneIds: { a, b: null } },
      "STONE_DESELECTED",
      { stoneId, slot: "B" },
    );
  }
  if (a === null) {
    return withEvent(
      { ...state, selectedStoneIds: { a: stoneId, b } },
      "STONE_SELECTED",
      { stoneId, slot: "A" },
    );
  }
  if (b === null) {
    return withEvent(
      { ...state, selectedStoneIds: { a, b: stoneId } },
      "STONE_SELECTED",
      { stoneId, slot: "B" },
    );
  }
  return state;
}

function handleRunExperiment(state: StudyState): StudyState {
  if (!canRunExperiment(state)) return state;
  const experimentPhase = getActiveExperimentPhase(state);
  if (!experimentPhase) return state;

  const stoneA = getStoneById(state.selectedStoneIds.a!);
  const stoneB = getStoneById(state.selectedStoneIds.b!);
  if (!stoneA || !stoneB || !state.prediction) return state;

  // Snapshot the model before each final-stage experiment.
  let base = state;
  if (experimentPhase === "FINAL_INVESTIGATION") {
    base = takeModelSnapshot(state, "BEFORE_EXPERIMENT");
  }

  const round = experimentPhase === "ASSISTED" ? base.currentAssistedRound : null;
  const stageCount =
    experimentPhase === "ASSISTED"
      ? getCurrentRoundExperiments(base).length
      : getFinalInvestigationExperiments(base).length;
  const globalNumber = base.experiments.length + 1;

  const pending: PendingExperiment = {
    id: crypto.randomUUID(),
    experimentNumber: globalNumber,
    phase: experimentPhase,
    round,
    roundExperimentNumber: stageCount + 1,
    globalExperimentNumber: globalNumber,
    startedAt: new Date().toISOString(),
    stoneA: { ...stoneA },
    stoneB: { ...stoneB },
    prediction: base.prediction!,
    mostImportantProperty: base.mostImportantProperty!,
    notes: base.notes,
    evaluation: evaluateExperiment(stoneA, stoneB),
  };

  const next: StudyState = {
    ...base,
    pendingExperiment: pending,
    reflectionDraft: EMPTY_REFLECTION_DRAFT,
  };
  return withEvent(next, "EXPERIMENT_STARTED", {
    experimentId: pending.id,
    experimentPhase,
    round,
    roundExperimentNumber: pending.roundExperimentNumber,
    globalExperimentNumber: pending.globalExperimentNumber,
    stoneA: stoneA.id,
    stoneB: stoneB.id,
    prediction: base.prediction,
    outcome: pending.evaluation.outcome,
  });
}

function handleSubmitReflection(state: StudyState): StudyState {
  const pending = state.pendingExperiment;
  if (!pending || !isReflectionComplete(state.reflectionDraft)) return state;
  const draft = state.reflectionDraft;

  const record: ExperimentRecord = {
    id: pending.id,
    experimentNumber: pending.experimentNumber,
    phase: pending.phase,
    round: pending.round,
    roundExperimentNumber: pending.roundExperimentNumber,
    globalExperimentNumber: pending.globalExperimentNumber,
    startedAt: pending.startedAt,
    completedAt: new Date().toISOString(),
    stoneA: pending.stoneA,
    stoneB: pending.stoneB,
    prediction: pending.prediction,
    mostImportantProperty: pending.mostImportantProperty,
    notes: pending.notes,
    evaluation: pending.evaluation,
    reflection: {
      evidenceAssessment: draft.evidenceAssessment!,
      observation: draft.observation.trim(),
      revisedHypothesis: "",
      hypothesisUnchanged: true,
    },
  };

  let next: StudyState = {
    ...state,
    experiments: [...state.experiments, record],
    pendingExperiment: null,
    reflectionDraft: EMPTY_REFLECTION_DRAFT,
    selectedStoneIds: { a: null, b: null },
    prediction: null,
    notes: "",
  };
  next = withEvent(next, "EXPERIMENT_COMPLETED", {
    experimentId: record.id,
    experimentPhase: record.phase,
    round: record.round,
    roundExperimentNumber: record.roundExperimentNumber,
    globalExperimentNumber: record.globalExperimentNumber,
    evidenceAssessment: record.reflection.evidenceAssessment,
    mostImportantProperty: record.mostImportantProperty,
  });

  // Snapshot the model after each completed final-stage experiment.
  if (record.phase === "FINAL_INVESTIGATION") {
    next = takeModelSnapshot(next, "AFTER_EXPERIMENT");
  }
  return next;
}

function handleFinishAssistedRound(state: StudyState): StudyState {
  if (state.phase !== "ASSISTED" || !canFinishAssistedRound(state)) return state;

  const round = state.currentAssistedRound;
  let next = withEvent(state, "ASSISTED_ROUND_COMPLETED", {
    round,
    experimentsCompleted: getCurrentRoundExperiments(state).length,
    inquiriesUsed: inquiriesUsedInCurrentRound(state),
  });

  if (round < ASSISTED_ROUND_COUNT) {
    next = {
      ...next,
      currentAssistedRound: round + 1,
      selectedStoneIds: { a: null, b: null },
      prediction: null,
      notes: "",
    };
    return withEvent(next, "ASSISTED_ROUND_STARTED", { round: round + 1 });
  }

  return enterFinalInvestigation(next);
}

function conditionFromEntryAction(action: {
  condition?: ExperimentalCondition;
  testingCondition?: ExperimentalCondition;
}): ExperimentalCondition | null {
  return action.condition ?? action.testingCondition ?? resolveManualCondition();
}

export function studyReducer(state: StudyState, action: StudyAction): StudyState {
  switch (action.type) {
    case "SELECT_STUDY_MODE": {
      if (state.phase !== "ENTRY") return state;
      const now = new Date().toISOString();

      if (action.mode === "PARTICIPANT") {
        const condition = conditionFromEntryAction(action);
        if (!condition) return state;

        const withMode = withEvent(
          withEvent(
            {
              ...state,
              studyMode: "PARTICIPANT",
              startedAt: now,
              condition,
              conditionAssigned: true,
            },
            "STUDY_MODE_SELECTED",
            { studyMode: "PARTICIPANT" },
          ),
          "EXPERIMENTAL_CONDITION_ASSIGNED",
          { assignmentMethod: "manual" },
        );
        const next = transitionPhase(withMode, "BACKGROUND", "ENTRY");
        return withEvent(next, "BACKGROUND_QUESTIONNAIRE_STARTED", {});
      }

      const testingCondition = conditionFromEntryAction(action);
      if (!testingCondition) return state;

      const withMode = withEvent(
        withEvent(
          {
            ...state,
            studyMode: "TESTING",
            startedAt: now,
            condition: testingCondition,
            conditionAssigned: true,
          },
          "STUDY_MODE_SELECTED",
          { studyMode: "TESTING" },
        ),
        "EXPERIMENTAL_CONDITION_ASSIGNED",
        { assignmentMethod: "manual" },
      );
      return enterInstructionsPhase(withMode, "ENTRY");
    }

    case "UPDATE_BACKGROUND_DRAFT":
      if (state.phase !== "BACKGROUND") return state;
      return {
        ...state,
        backgroundDraft: { ...state.backgroundDraft, ...action.patch },
      };

    case "SUBMIT_BACKGROUND": {
      if (state.phase !== "BACKGROUND" || !isBackgroundComplete(state.backgroundDraft)) {
        return state;
      }
      if (state.backgroundCompletedAt) return state;

      const condition = state.condition ?? resolveManualCondition();
      if (!condition) return state;

      const now = new Date().toISOString();
      const withBackground = {
        ...state,
        background: backgroundFromDraft(state.backgroundDraft),
        backgroundCompletedAt: now,
        condition,
        conditionAssigned: true,
      };
      let completed = withEvent(
        withBackground,
        "BACKGROUND_QUESTIONNAIRE_COMPLETED",
        {
          participantId: state.participantId,
          sessionId: state.sessionId,
          background: withBackground.background,
        },
      );
      if (!state.conditionAssigned) {
        completed = withEvent(completed, "EXPERIMENTAL_CONDITION_ASSIGNED", {
          assignmentMethod: "manual",
        });
      }
      return enterInstructionsPhase(completed, "BACKGROUND");
    }

    case "COMPLETE_INSTRUCTIONS": {
      if (state.phase !== "INSTRUCTIONS") return state;
      const now = new Date().toISOString();
      const withTimestamp = {
        ...state,
        instructionsCompletedAt: state.instructionsCompletedAt ?? now,
      };
      const completed = state.instructionsCompletedAt
        ? withTimestamp
        : withEvent(withTimestamp, "INSTRUCTIONS_COMPLETED", {
            instructionsCompletedAt: now,
          });
      return enterAssistedPhase(completed, "INSTRUCTIONS");
    }

    case "FINISH_ASSISTED_ROUND":
      return handleFinishAssistedRound(state);

    case "TOGGLE_STONE":
      return handleToggleStone(state, action.stoneId);

    case "CLEAR_SELECTION": {
      if (!canEditSetup(state)) return state;
      if (!state.selectedStoneIds.a && !state.selectedStoneIds.b) return state;
      return withEvent(
        { ...state, selectedStoneIds: { a: null, b: null } },
        "SELECTION_CLEARED",
      );
    }

    case "SET_PREDICTION": {
      if (!canEditSetup(state)) return state;
      return withEvent(
        { ...state, prediction: action.prediction },
        "PREDICTION_SELECTED",
        { prediction: action.prediction },
      );
    }

    case "SET_MOST_IMPORTANT_PROPERTY": {
      if (!canEditSetup(state)) return state;
      if (!MOST_IMPORTANT_PROPERTIES.includes(action.value)) return state;
      return withEvent(
        { ...state, mostImportantProperty: action.value },
        "HYPOTHESIS_EDITED",
        { mostImportantProperty: action.value },
      );
    }

    case "SET_NOTES":
      if (!canEditSetup(state)) return state;
      return { ...state, notes: action.value };

    case "RUN_EXPERIMENT":
      return handleRunExperiment(state);

    case "UPDATE_REFLECTION_DRAFT": {
      if (!state.pendingExperiment) return state;
      return {
        ...state,
        reflectionDraft: { ...state.reflectionDraft, ...action.patch },
      };
    }

    case "SUBMIT_REFLECTION":
      return handleSubmitReflection(state);

    case "SET_TREE_NODE": {
      if (!canEditDecisionTree(state)) return state;
      if (!(action.nodeId in state.decisionTree.nodes)) return state;
      const previous = state.decisionTree.nodes[action.nodeId];
      if (previous === action.condition) return state;
      const next: StudyState = {
        ...state,
        decisionTree: {
          ...state.decisionTree,
          nodes: { ...state.decisionTree.nodes, [action.nodeId]: action.condition },
        },
      };
      return withEvent(next, "DECISION_TREE_NODE_CHANGED", {
        nodeId: action.nodeId,
        previousValue: previous,
        newValue: action.condition,
        ...modelEditContext(state),
      });
    }

    case "SET_TREE_BRANCH": {
      if (!canEditDecisionTree(state)) return state;
      if (!isKnownBranchId(action.branchId)) return state;
      const previous = state.decisionTree.branches[action.branchId] ?? null;
      if (previous === action.label) return state;

      const branches = { ...state.decisionTree.branches, [action.branchId]: action.label };
      // Keep each binary node with one YES and one NO branch. The participant
      // may still reverse the two — reversals are preserved, not corrected.
      const sibling = siblingBranchId(action.branchId);
      const siblingPrevious = state.decisionTree.branches[sibling] ?? null;
      const siblingNext: BranchLabel = action.label === "YES" ? "NO" : "YES";
      const siblingChanged = siblingPrevious !== siblingNext;
      if (siblingChanged) branches[sibling] = siblingNext;

      let next: StudyState = {
        ...state,
        decisionTree: { ...state.decisionTree, branches },
      };
      next = withEvent(next, "DECISION_TREE_BRANCH_CHANGED", {
        branchId: action.branchId,
        previousValue: previous,
        newValue: action.label,
        ...modelEditContext(state),
      });
      if (siblingChanged) {
        next = withEvent(next, "DECISION_TREE_BRANCH_CHANGED", {
          branchId: sibling,
          previousValue: siblingPrevious,
          newValue: siblingNext,
          implied: true,
          ...modelEditContext(state),
        });
      }
      return next;
    }

    case "SET_TREE_TERMINAL": {
      if (!canEditDecisionTree(state)) return state;
      if (!(action.terminalId in state.decisionTree.terminals)) return state;
      const previous = state.decisionTree.terminals[action.terminalId];
      if (previous === action.outcome) return state;
      const next: StudyState = {
        ...state,
        decisionTree: {
          ...state.decisionTree,
          terminals: {
            ...state.decisionTree.terminals,
            [action.terminalId]: action.outcome,
          },
        },
      };
      return withEvent(next, "DECISION_TREE_TERMINAL_CHANGED", {
        terminalId: action.terminalId,
        previousValue: previous,
        newValue: action.outcome,
        ...modelEditContext(state),
      });
    }

    case "SET_AFFINITY_RELATION": {
      if (state.phase !== "FINAL_INVESTIGATION") return state;
      if (!(action.pairId in state.affinityMap.relations)) return state;
      const previous = state.affinityMap.relations[action.pairId];
      if (previous === action.relation) return state;
      const next: StudyState = {
        ...state,
        affinityMap: {
          relations: { ...state.affinityMap.relations, [action.pairId]: action.relation },
        },
      };
      return withEvent(next, "AFFINITY_RELATIONSHIP_CHANGED", {
        pairId: action.pairId,
        previousValue: previous,
        newValue: action.relation,
        ...modelEditContext(state),
      });
    }

    case "UPDATE_FINAL_MODEL_DRAFT":
      if (state.phase !== "FINAL_INVESTIGATION") return state;
      return {
        ...state,
        finalModelDraft: { ...state.finalModelDraft, ...action.patch },
      };

    case "SUBMIT_FINAL_MODEL": {
      if (!canSubmitFinalModel(state)) return state;
      const submission: FinalModelSubmission = {
        participantId: state.participantId,
        condition: state.condition,
        decisionTree: state.decisionTree,
        affinityMap: state.affinityMap,
        notes: state.finalModelDraft.notes.trim(),
        confidence: state.finalModelDraft.confidence,
        submittedAt: new Date().toISOString(),
      };
      let next: StudyState = { ...state, finalModelSubmission: submission };
      next = takeModelSnapshot(next, "FINAL_SUBMISSION");
      next = withEvent(next, "FINAL_MODEL_SUBMITTED", {
        confidence: submission.confidence,
        finalStageExperimentsCompleted: getFinalInvestigationExperiments(state).length,
      });
      return transitionPhase(next, "COMPLETE", "FINAL_INVESTIGATION");
    }

    case "ADD_CHAT_MESSAGE": {
      if (action.message.role === "PARTICIPANT") {
        if (!canSendInquiry(state)) return state;
        const round = state.currentAssistedRound;
        const roundInquiryNumber = inquiriesUsedInCurrentRound(state) + 1;
        const next: StudyState = {
          ...state,
          chatMessages: [...state.chatMessages, { ...action.message, round }],
        };
        return withEvent(next, action.eventType, {
          messageId: action.message.id,
          length: action.message.content.length,
          round,
          roundInquiryNumber,
          globalInquiryNumber: totalInquiriesUsed(state) + 1,
          experimentsCompletedInRound: getCurrentRoundExperiments(state).length,
          totalExperimentsCompleted: state.experiments.length,
        });
      }

      // Partner replies are allowed whenever the partner itself is available
      // (e.g. the reply to a participant's fourth inquiry of the round).
      if (!canUseResearchPartner(state)) return state;
      const next: StudyState = {
        ...state,
        chatMessages: [
          ...state.chatMessages,
          { ...action.message, round: state.currentAssistedRound },
        ],
      };
      return withEvent(next, action.eventType, {
        messageId: action.message.id,
        length: action.message.content.length,
      });
    }

    case "RECORD_LLM_INTERACTION":
      return {
        ...state,
        llmInteractions: [...state.llmInteractions, action.interaction],
      };

    case "LOG_EVENT":
      return withEvent(state, action.eventType, action.payload ?? {});

    case "DEV_SET_CONDITION":
      if (state.studyMode !== "TESTING") return state;
      return withEvent(
        { ...state, condition: action.condition, conditionAssigned: true },
        "EXPERIMENTAL_CONDITION_ASSIGNED",
        { assignmentMethod: "dev_override" },
      );

    case "DEV_CLEAR_CHAT":
      return { ...state, chatMessages: [] };

    case "DEV_SET_ROUND": {
      if (state.phase !== "ASSISTED") return state;
      const round = Math.min(ASSISTED_ROUND_COUNT, Math.max(1, Math.round(action.round)));
      if (round === state.currentAssistedRound) return state;
      return withEvent(
        {
          ...state,
          currentAssistedRound: round,
          selectedStoneIds: { a: null, b: null },
          prediction: null,
          pendingExperiment: null,
        },
        "ASSISTED_ROUND_STARTED",
        { round, devOverride: true },
      );
    }

    case "DEV_RESET_ROUND": {
      if (state.phase !== "ASSISTED") return state;
      const round = state.currentAssistedRound;
      return {
        ...state,
        experiments: state.experiments.filter(
          (record) => !(record.phase === "ASSISTED" && record.round === round),
        ),
        chatMessages: state.chatMessages.filter((message) => message.round !== round),
        llmInteractions: state.llmInteractions.filter(
          (interaction) => interaction.round !== round,
        ),
        pendingExperiment: null,
        selectedStoneIds: { a: null, b: null },
        prediction: null,
      };
    }

    case "DEV_SKIP_INSTRUCTIONS":
      if (state.phase !== "INSTRUCTIONS") return state;
      return studyReducer(state, { type: "COMPLETE_INSTRUCTIONS" });

    case "DEV_SKIP_TO_FINAL_INVESTIGATION":
      if (state.phase !== "ASSISTED") return state;
      return enterFinalInvestigation(state);

    case "RESET_SESSION":
      return createInitialState();

    default:
      return state;
  }
}
