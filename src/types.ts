export type Affinity = "TIDE" | "EMBER" | "GALE" | "GROVE";

export type Charge = "POSITIVE" | "NEGATIVE";

export type Strength = 1 | 2 | 3;

export interface Stone {
  id: string;
  affinity: Affinity;
  strength: Strength;
  charge: Charge;
}

export type ExperimentOutcome =
  | "STONE_A_WINS"
  | "STONE_B_WINS"
  | "STALEMATE"
  | "MUTUAL_NEUTRALIZATION";

/** Predictions use the same vocabulary as outcomes. */
export type ExperimentPrediction = ExperimentOutcome;

export type AppliedRule =
  | "SAME_CHARGE_STALEMATE"
  | "SAME_CHARGE_STRENGTH"
  | "SAME_AFFINITY_NEUTRALIZATION"
  | "NEUTRAL_PAIR_STALEMATE"
  | "NEUTRAL_PAIR_STRENGTH"
  | "AFFINITY_DOMINANCE";

/**
 * Full result of the hidden rule engine. `appliedRule` and
 * `internalExplanation` are research metadata and must never be rendered to
 * participants unless the study configuration explicitly enables it.
 */
export interface ExperimentEvaluation {
  outcome: ExperimentOutcome;
  winningStoneId: string | null;
  appliedRule: AppliedRule;
  internalExplanation: string;
}

export type EvidenceAssessment =
  | "SUPPORTED"
  | "PARTIALLY_SUPPORTED"
  | "CONTRADICTED"
  | "UNCLEAR";

/**
 * Structured pre-experiment judgment: which property the participant currently
 * thinks matters most. Stable IDs — never store translated labels.
 */
export type MostImportantProperty =
  | "STRENGTH"
  | "CHARGE"
  | "AFFINITY"
  | "UNSURE";

export const MOST_IMPORTANT_PROPERTIES: readonly MostImportantProperty[] = [
  "STRENGTH",
  "CHARGE",
  "AFFINITY",
  "UNSURE",
] as const;

export interface Reflection {
  evidenceAssessment: EvidenceAssessment;
  /** Optional free-text: what the participant learned from the result. */
  observation: string;
  /**
   * Legacy field kept so older persisted sessions remain readable.
   * New reflections always store an empty string.
   */
  revisedHypothesis: string;
  /**
   * Legacy field kept for older sessions. New reflections always store true
   * (no revised-hypothesis step in the current protocol).
   */
  hypothesisUnchanged: boolean;
}

export interface ExperimentRecord {
  id: string;
  /** Global sequence number across the whole session (same as globalExperimentNumber). */
  experimentNumber: number;
  /** Phase in which this experiment was conducted. */
  phase: ExperimentPhase;
  /** Assisted round (1–3), or null for final-investigation experiments. */
  round: number | null;
  /** 1-based position within the round (or within the final stage). */
  roundExperimentNumber: number;
  /** 1-based position across the entire session; never resets. */
  globalExperimentNumber: number;
  startedAt: string;
  completedAt: string;
  /** Immutable snapshots taken at run time. */
  stoneA: Stone;
  stoneB: Stone;
  prediction: ExperimentPrediction;
  /** Structured property judgment at run time. */
  mostImportantProperty: MostImportantProperty;
  /** Optional free-text notes at run time. */
  notes: string;
  evaluation: ExperimentEvaluation;
  reflection: Reflection;
}

/** An experiment that has been run but whose reflection is not yet complete. */
export interface PendingExperiment {
  id: string;
  experimentNumber: number;
  phase: ExperimentPhase;
  round: number | null;
  roundExperimentNumber: number;
  globalExperimentNumber: number;
  startedAt: string;
  stoneA: Stone;
  stoneB: Stone;
  prediction: ExperimentPrediction;
  mostImportantProperty: MostImportantProperty;
  notes: string;
  evaluation: ExperimentEvaluation;
}

export type StudyPhase =
  | "ENTRY"
  | "BACKGROUND"
  | "INSTRUCTIONS"
  | "ASSISTED"
  | "FINAL_INVESTIGATION"
  | "COMPLETE";

/** Experiments may only occur during these phases. */
export type ExperimentPhase = "ASSISTED" | "FINAL_INVESTIGATION";

/** Assisted investigation rounds. */
export type AssistedRound = 1 | 2 | 3;

export type StudyMode = "PARTICIPANT" | "TESTING";

export type LlmExperience =
  | "NEVER"
  | "RARELY"
  | "SOMETIMES"
  | "FREQUENTLY"
  | "VERY_FREQUENTLY";

export type EducationLevel =
  | "HIGH_SCHOOL_OR_BELOW"
  | "BACHELORS"
  | "MASTERS"
  | "DOCTORATE"
  | "OTHER";

/** 1 = not at all confident … 5 = extremely confident */
export type AiProblemSolvingConfidence = 1 | 2 | 3 | 4 | 5;

export const EDUCATION_LEVELS: readonly EducationLevel[] = [
  "HIGH_SCHOOL_OR_BELOW",
  "BACHELORS",
  "MASTERS",
  "DOCTORATE",
  "OTHER",
] as const;

export const LLM_EXPERIENCE_LEVELS: readonly LlmExperience[] = [
  "NEVER",
  "RARELY",
  "SOMETIMES",
  "FREQUENTLY",
  "VERY_FREQUENTLY",
] as const;

export const AI_PROBLEM_SOLVING_CONFIDENCE_LEVELS: readonly AiProblemSolvingConfidence[] =
  [1, 2, 3, 4, 5] as const;

export interface ParticipantBackground {
  age: number;
  educationLevel: EducationLevel;
  fieldOrOccupation: string;
  llmExperience: LlmExperience;
  aiLearningProblemSolvingFrequency: LlmExperience;
  aiProblemSolvingConfidence: AiProblemSolvingConfidence;
}

/** Internal only — must never surface in the participant-facing UI. */
export type ExperimentalCondition = "ANALYTICAL" | "HYPOTHESIS_DRIVEN";

export interface ChatMessage {
  id: string;
  role: "PARTICIPANT" | "PARTNER";
  content: string;
  timestamp: string;
  /** Assisted round in which the message was sent; null for legacy messages. */
  round: number | null;
}

/**
 * One completed Research Partner exchange, kept for research export.
 * Researcher-side data: it records the internal condition and prompt version
 * and is never rendered in the participant UI.
 */
export interface LlmInteractionRecord {
  interactionId: string;
  participantId: string;
  sessionId: string;
  /** Experiment in progress when the message was sent, if any. */
  experimentId: string | null;
  llmMode: ExperimentalCondition;
  studyPhase: StudyPhase;
  /** Assisted round in which the inquiry was made (null for legacy records). */
  round: number | null;
  /** 1-based user-inquiry number within the round. */
  roundInquiryNumber: number;
  /** 1-based user-inquiry number across the whole session. */
  globalInquiryNumber: number;
  /** Completed experiments in the round when the inquiry was sent. */
  experimentsCompletedInRound: number;
  userMessage: string;
  llmResponse: string;
  userMessageTimestamp: string;
  llmResponseTimestamp: string;
  responseLatencyMs: number;
  promptVersion: string;
  model: string;
}

/** @deprecated Legacy free-text final submission; kept only so old sessions' data survives. */
export interface FinalRuleSubmissionData {
  chargeRule: string;
  strengthRule: string;
  affinityRule: string;
  stalemateConditions: string;
  neutralizationConditions: string;
  decisionProcedure: string;
  /** 1–7 (bounds come from studyConfig), null while unanswered. */
  confidence: number | null;
}

/* ------------------------- final model (tree + map) ---------------------- */

/** Standardized condition-card IDs for decision-tree nodes. */
export type DecisionConditionId =
  | "SAME_CHARGE"
  | "SAME_STRENGTH"
  | "SAME_AFFINITY"
  | "NEUTRAL_AFFINITY_PAIR";

/** Standardized outcome-card IDs for decision-tree terminals. */
export type TerminalOutcomeId =
  | "STALEMATE"
  | "DOMINANT_AFFINITY_WINS"
  | "STRONGER_CRYSTAL_WINS"
  | "MUTUAL_NEUTRALIZATION";

export type BranchLabel = "YES" | "NO";

/**
 * Participant-built decision tree. The shape (node/terminal ids and their
 * wiring) is fixed by finalModelConfig; this state stores only what the
 * participant has filled in. All values may be null/incomplete or wrong —
 * that is valid research data.
 */
export interface DecisionTreeState {
  /** Condition placed on each decision node, keyed by node id (N1…N5). */
  nodes: Record<string, DecisionConditionId | null>;
  /** YES/NO label chosen for each outgoing branch, keyed by branch id. */
  branches: Record<string, BranchLabel | null>;
  /** Outcome placed on each terminal, keyed by terminal id (T1…T6). */
  terminals: Record<string, TerminalOutcomeId | null>;
}

/** Participant's belief about one unordered affinity pair. */
export type AffinityRelationValue =
  | "UNSET"
  | "FIRST_DOMINATES"
  | "SECOND_DOMINATES"
  | "NEUTRAL";

/** Participant-built affinity relationship map, keyed by pair id. */
export interface AffinityMapState {
  relations: Record<string, AffinityRelationValue>;
}

export type FinalModelSnapshotReason =
  | "FINAL_STAGE_STARTED"
  | "BEFORE_EXPERIMENT"
  | "AFTER_EXPERIMENT"
  | "FINAL_SUBMISSION";

/** Compact structured snapshot of the participant's model at a point in time. */
export interface FinalModelSnapshot {
  reason: FinalModelSnapshotReason;
  timestamp: string;
  finalExperimentsCompleted: number;
  decisionTree: DecisionTreeState;
  affinityMap: AffinityMapState;
}

/** The explicitly submitted final model. */
export interface FinalModelSubmission {
  participantId: string;
  condition: ExperimentalCondition | null;
  decisionTree: DecisionTreeState;
  affinityMap: AffinityMapState;
  /** Optional free-text: "anything else about how the system works?" */
  notes: string;
  confidence: number | null;
  submittedAt: string;
}

export type StudyEventType =
  | "PAGE_OPENED"
  | "STUDY_MODE_SELECTED"
  | "BACKGROUND_QUESTIONNAIRE_STARTED"
  | "BACKGROUND_QUESTIONNAIRE_COMPLETED"
  | "INSTRUCTIONS_STARTED"
  | "INSTRUCTIONS_COMPLETED"
  | "EXPERIMENTAL_CONDITION_ASSIGNED"
  | "STUDY_PHASE_ENTERED"
  | "STUDY_PHASE_STARTED"
  | "STUDY_PHASE_COMPLETED"
  | "ASSISTED_ROUND_STARTED"
  | "ASSISTED_ROUND_COMPLETED"
  | "FINAL_INVESTIGATION_STARTED"
  | "STONE_SELECTED"
  | "STONE_DESELECTED"
  | "SELECTION_CLEARED"
  | "PREDICTION_SELECTED"
  | "HYPOTHESIS_EDITED"
  | "JUSTIFICATION_EDITED"
  | "EXPERIMENT_STARTED"
  | "EXPERIMENT_RESULT_REVEALED"
  | "EVIDENCE_ASSESSMENT_SELECTED"
  | "OBSERVATION_ENTERED"
  | "HYPOTHESIS_REVISED"
  | "EXPERIMENT_COMPLETED"
  | "LLM_MESSAGE_SENT"
  | "LLM_RESPONSE_RECEIVED"
  | "LLM_REQUEST_FAILED"
  | "HISTORY_ENTRY_OPENED"
  | "HISTORY_ENTRY_CLOSED"
  | "DECISION_TREE_NODE_CHANGED"
  | "DECISION_TREE_BRANCH_CHANGED"
  | "DECISION_TREE_TERMINAL_CHANGED"
  | "AFFINITY_RELATIONSHIP_CHANGED"
  | "FINAL_MODEL_SNAPSHOT_TAKEN"
  | "FINAL_MODEL_SUBMITTED"
  // Legacy event names kept so persisted logs from older sessions stay valid.
  | "TRANSFER_STARTED"
  | "TRANSFER_COMPLETED"
  | "FINAL_SUBMISSION_STARTED"
  | "FINAL_ANSWER_SUBMITTED";

export interface StudyEvent {
  eventId: string;
  participantId: string;
  sessionId: string;
  eventType: StudyEventType;
  timestamp: string;
  phase: StudyPhase;
  experimentNumber: number | null;
  payload: Record<string, unknown>;
}
