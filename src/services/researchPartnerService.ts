import { studyConfig } from "../config/studyConfig";
import type { Locale } from "../i18n/types";
import { generateMockReply } from "./mockResearchPartner";
import type {
  ChatMessage,
  ExperimentRecord,
  ExperimentalCondition,
  MostImportantProperty,
  PendingExperiment,
  Stone,
  StudyPhase,
} from "../types";

/**
 * Client half of the Research Partner boundary.
 *
 * The browser never talks to OpenAI and never sees an API key or a system
 * prompt: it posts participant-observable state to the local backend, which
 * owns the prompt files, the model choice, and the credentials.
 *
 * Whether a real model or the development mock answers is decided by the
 * server (USE_MOCK_LLM), so the participant-facing behaviour is identical
 * either way.
 */

export interface ResearchPartnerRequest {
  participantId: string;
  sessionId: string;
  experimentId: string | null;
  participantMessage: string;
  phase: StudyPhase;
  experimentsRemaining: number;
  availableStones: Stone[];
  /**
   * Pair being prepared but not yet run. Callers must pass nulls when a
   * pendingExperiment exists (result already revealed).
   */
  selectedStones: { stoneA: Stone | null; stoneB: Stone | null };
  /** Fully reflected experiments, in chronological order. */
  experimentHistory: ExperimentRecord[];
  /**
   * Experiment whose result has been revealed but whose reflection is not
   * yet submitted. Treated as completed evidence for the model.
   */
  pendingExperiment: PendingExperiment | null;
  currentMostImportantProperty: MostImportantProperty | null;
  currentNotes: string;
  chatHistory: ChatMessage[];
  /** Internal condition; sent to the server, never rendered in the UI. */
  condition: ExperimentalCondition;
  locale: Locale;
}

export interface ResearchPartnerReply {
  message: string;
  interactionId: string;
  promptVersion: string;
  model: string;
  responseLatencyMs: number;
  userMessageTimestamp: string;
  llmResponseTimestamp: string;
}

/** Carries a participant-safe message plus a flag for whether retrying helps. */
export class ResearchPartnerError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

type ObservableExperiment = ExperimentRecord | PendingExperiment;

function isFullyReflected(record: ObservableExperiment): record is ExperimentRecord {
  return "reflection" in record && "completedAt" in record;
}

/**
 * Reduces an experiment record to what the participant observed. The hidden
 * engine's `appliedRule` and `internalExplanation` are dropped here, and the
 * server independently ignores them as well.
 *
 * Accepts both fully reflected records and pending (result-revealed) records
 * so a just-run experiment is never omitted from LLM context.
 */
export function toWireExperiment(record: ObservableExperiment) {
  const outcome = record.evaluation.outcome;
  const reflected = isFullyReflected(record);
  return {
    experimentNumber: record.globalExperimentNumber || record.experimentNumber,
    round: record.round,
    roundExperimentNumber: record.roundExperimentNumber,
    stoneA: {
      id: record.stoneA.id,
      affinity: record.stoneA.affinity,
      strength: record.stoneA.strength,
      charge: record.stoneA.charge,
    },
    stoneB: {
      id: record.stoneB.id,
      affinity: record.stoneB.affinity,
      strength: record.stoneB.strength,
      charge: record.stoneB.charge,
    },
    prediction: record.prediction,
    outcome,
    winningStoneId: record.evaluation.winningStoneId,
    predictionMatched: record.prediction === outcome,
    mostImportantProperty: record.mostImportantProperty,
    notes: record.notes,
    // Compatibility aliases for older context wording.
    hypothesis: record.mostImportantProperty,
    justification: record.notes,
    evidenceAssessment: reflected ? record.reflection.evidenceAssessment : "",
    observation: reflected ? record.reflection.observation : "",
    revisedHypothesis: "",
    reflectionStatus: reflected
      ? ("COMPLETE" as const)
      : ("AWAITING_REFLECTION" as const),
  };
}

/**
 * Builds the chronological completed-evidence list for the model.
 * A pending (result-revealed) experiment is appended as completed evidence.
 */
export function collectCompletedEvidence(
  experiments: ExperimentRecord[],
  pendingExperiment: PendingExperiment | null,
): ObservableExperiment[] {
  return pendingExperiment ? [...experiments, pendingExperiment] : [...experiments];
}

/**
 * A pair is "current" only while it is being prepared and has not been run.
 * Once RUN_EXPERIMENT creates a pendingExperiment, those stones are completed
 * evidence and must not also appear as the current selection.
 */
export function resolveCurrentSelection(
  pendingExperiment: PendingExperiment | null,
  selectedStones: { stoneA: Stone | null; stoneB: Stone | null },
): { stoneA: Stone | null; stoneB: Stone | null } {
  if (pendingExperiment) {
    return { stoneA: null, stoneB: null };
  }
  return selectedStones;
}

/** Builds the JSON body posted to the backend (exported for tests). */
export function buildRequestBody(request: ResearchPartnerRequest) {
  const completed = collectCompletedEvidence(
    request.experimentHistory,
    request.pendingExperiment,
  );
  const currentSelection = resolveCurrentSelection(
    request.pendingExperiment,
    request.selectedStones,
  );

  return {
    participantId: request.participantId,
    sessionId: request.sessionId,
    experimentId: request.experimentId,
    llmMode: request.condition,
    participantMessage: request.participantMessage,
    studyPhase: request.phase,
    experimentsRemaining: request.experimentsRemaining,
    currentMostImportantProperty: request.currentMostImportantProperty ?? "",
    currentNotes: request.currentNotes,
    currentHypothesis: request.currentMostImportantProperty ?? "",
    selectedStones: currentSelection,
    availableStones: request.availableStones,
    experimentHistory: completed.map(toWireExperiment),
    conversationHistory: request.chatHistory.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    locale: request.locale,
  };
}

/**
 * Static demo builds answer in the browser. The hosted site has no server
 * and no API key, so it never calls OpenAI.
 */
export function isStaticDemo(): boolean {
  return import.meta.env.VITE_DEMO_MODE === "true";
}

export async function sendResearchPartnerMessage(
  request: ResearchPartnerRequest,
): Promise<ResearchPartnerReply> {
  if (isStaticDemo()) {
    const userMessageTimestamp = new Date().toISOString();
    const started = Date.now();
    const message = await generateMockReply(
      {
        llmMode: request.condition,
        locale: request.locale,
        experimentsRemaining: request.experimentsRemaining,
      },
      import.meta.env.MODE === "test" ? { latencyMs: 0 } : {},
    );
    return {
      message,
      interactionId: crypto.randomUUID(),
      promptVersion: "DEMO_MOCK",
      model: "mock",
      responseLatencyMs: Date.now() - started,
      userMessageTimestamp,
      llmResponseTimestamp: new Date().toISOString(),
    };
  }

  let response: Response;
  try {
    response = await fetch(studyConfig.researchPartnerEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildRequestBody(request)),
    });
  } catch {
    throw new ResearchPartnerError(
      "Could not reach the Research Partner service. Check your connection and try again.",
      true,
    );
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const code = body?.error?.code;
    const serverMessage = typeof body?.error?.message === "string" ? body.error.message : null;

    if (code === "CONFIGURATION_ERROR") {
      // Setup problem: retrying will not help until the researcher fixes it.
      throw new ResearchPartnerError(
        serverMessage ?? "The Research Partner is not configured on the server.",
        false,
      );
    }
    throw new ResearchPartnerError(
      serverMessage ?? "The Research Partner could not respond right now.",
      true,
    );
  }

  const data = (await response.json()) as Partial<ResearchPartnerReply>;
  if (typeof data?.message !== "string" || data.message.trim().length === 0) {
    throw new ResearchPartnerError(
      "The Research Partner returned an unexpected response.",
      true,
    );
  }

  return {
    message: data.message,
    interactionId: data.interactionId ?? crypto.randomUUID(),
    promptVersion: data.promptVersion ?? "UNKNOWN",
    model: data.model ?? "unknown",
    responseLatencyMs: data.responseLatencyMs ?? 0,
    userMessageTimestamp: data.userMessageTimestamp ?? new Date().toISOString(),
    llmResponseTimestamp: data.llmResponseTimestamp ?? new Date().toISOString(),
  };
}
