/**
 * Wire contract between the browser and the Research Partner API.
 *
 * Everything here is participant-observable data. The hidden rule engine's
 * metadata (`appliedRule`, `internalExplanation`) is deliberately absent from
 * these types, and the context builder ignores those fields even if a client
 * were to send them.
 */

export const LLM_MODES = ["ANALYTICAL", "HYPOTHESIS_DRIVEN"] as const;
export type LlmMode = (typeof LLM_MODES)[number];

export type StudyPhase =
  | "ENTRY"
  | "BACKGROUND"
  | "INSTRUCTIONS"
  | "ASSISTED"
  | "FINAL_INVESTIGATION"
  | "COMPLETE"
  // Legacy phase names accepted for compatibility with older clients.
  | "TRANSFER"
  | "FINAL_SUBMISSION";

export interface WireStone {
  id: string;
  affinity: string;
  strength: number;
  charge: string;
}

/**
 * One experiment that has already produced an observed result.
 * Reflection may still be pending; that is still completed evidence.
 */
export interface WireExperiment {
  experimentNumber: number;
  /** Assisted round (1–5), or null for final-investigation / legacy. */
  round: number | null;
  /** 1-based position within the round/final stage. */
  roundExperimentNumber: number;
  stoneA: WireStone;
  stoneB: WireStone;
  prediction: string;
  /** Observable result only — no rule explanation. */
  outcome: string;
  winningStoneId: string | null;
  /** Whether the participant's prediction matched the observed outcome. */
  predictionMatched: boolean;
  hypothesis: string;
  justification: string;
  /** Structured property judgment (STRENGTH | CHARGE | AFFINITY | UNSURE). */
  mostImportantProperty: string;
  /** Optional free-text notes. */
  notes: string;
  /** Empty string when the participant has not yet reflected. */
  evidenceAssessment: string;
  observation: string;
  revisedHypothesis: string;
  /**
   * COMPLETE = reflection submitted.
   * AWAITING_REFLECTION = result revealed, reflection not yet submitted.
   */
  reflectionStatus: "COMPLETE" | "AWAITING_REFLECTION";
}

export interface WireChatMessage {
  role: "PARTICIPANT" | "PARTNER";
  content: string;
}

export interface ResearchPartnerApiRequest {
  participantId: string;
  sessionId: string;
  /** Experiment the participant is working on, if any. */
  experimentId: string | null;
  llmMode: LlmMode;
  participantMessage: string;
  studyPhase: StudyPhase;
  experimentsRemaining: number;
  currentHypothesis: string;
  /** Structured property choice; empty when unset. */
  currentMostImportantProperty: string;
  /** Optional notes currently entered for the upcoming experiment. */
  currentNotes: string;
  /**
   * Pair currently being prepared but NOT yet run.
   * Must be empty when a pending (already-run) experiment exists — that pair
   * belongs in experimentHistory as completed evidence.
   */
  selectedStones: { stoneA: WireStone | null; stoneB: WireStone | null };
  availableStones: WireStone[];
  /** Chronological completed evidence (includes result-revealed, reflection-pending). */
  experimentHistory: WireExperiment[];
  conversationHistory: WireChatMessage[];
  /** UI language, so the partner replies in the participant's language. */
  locale?: string;
}

export interface ResearchPartnerApiResponse {
  message: string;
  interactionId: string;
  /** Researcher metadata; safe to store, never displayed to participants. */
  promptVersion: string;
  model: string;
  responseLatencyMs: number;
  userMessageTimestamp: string;
  llmResponseTimestamp: string;
}

export interface ApiErrorBody {
  error: {
    code:
      | "CONFIGURATION_ERROR"
      | "VALIDATION_ERROR"
      | "UPSTREAM_ERROR"
      | "INTERNAL_ERROR";
    message: string;
  };
}
