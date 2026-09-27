import { LLM_MODES, type LlmMode, type ResearchPartnerApiRequest } from "./types";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  value?: ResearchPartnerApiRequest;
}

const MAX_MESSAGE_LENGTH = 4000;
const MAX_CONVERSATION_MESSAGES = 100;
const PHASES = [
  "ENTRY",
  "BACKGROUND",
  "INSTRUCTIONS",
  "ASSISTED",
  "FINAL_INVESTIGATION",
  "COMPLETE",
  // Legacy phase names accepted for compatibility.
  "TRANSFER",
  "FINAL_SUBMISSION",
];

function isLlmMode(value: unknown): value is LlmMode {
  return typeof value === "string" && (LLM_MODES as readonly string[]).includes(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * Validates the incoming request and returns a normalized copy built only
 * from recognized fields. Unknown properties are dropped rather than passed
 * through, so a client cannot smuggle extra content toward the model.
 */
export function validateRequest(body: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof body !== "object" || body === null) {
    return { ok: false, errors: ["Request body must be a JSON object."] };
  }
  const raw = body as Record<string, unknown>;

  if (!isLlmMode(raw.llmMode)) {
    errors.push(
      `"llmMode" must be one of: ${LLM_MODES.join(", ")}.`,
    );
  }

  const participantMessage = asString(raw.participantMessage).trim();
  if (participantMessage.length === 0) {
    errors.push('"participantMessage" is required.');
  } else if (participantMessage.length > MAX_MESSAGE_LENGTH) {
    errors.push(`"participantMessage" exceeds ${MAX_MESSAGE_LENGTH} characters.`);
  }

  const studyPhase = asString(raw.studyPhase, "ASSISTED");
  if (!PHASES.includes(studyPhase)) {
    errors.push(`"studyPhase" must be one of: ${PHASES.join(", ")}.`);
  }

  if (asString(raw.participantId).length === 0) {
    errors.push('"participantId" is required.');
  }
  if (asString(raw.sessionId).length === 0) {
    errors.push('"sessionId" is required.');
  }

  if (errors.length > 0) return { ok: false, errors };

  const conversation = Array.isArray(raw.conversationHistory)
    ? raw.conversationHistory
        .filter(
          (m): m is { role: string; content: string } =>
            typeof m === "object" && m !== null,
        )
        .map((m) => ({
          role: m.role === "PARTNER" ? ("PARTNER" as const) : ("PARTICIPANT" as const),
          content: asString(m.content),
        }))
        .slice(-MAX_CONVERSATION_MESSAGES)
    : [];

  const value: ResearchPartnerApiRequest = {
    participantId: asString(raw.participantId),
    sessionId: asString(raw.sessionId),
    experimentId: typeof raw.experimentId === "string" ? raw.experimentId : null,
    llmMode: raw.llmMode as LlmMode,
    participantMessage,
    studyPhase: studyPhase as ResearchPartnerApiRequest["studyPhase"],
    experimentsRemaining:
      typeof raw.experimentsRemaining === "number" && raw.experimentsRemaining >= 0
        ? raw.experimentsRemaining
        : 0,
    currentHypothesis: asString(raw.currentHypothesis),
    currentMostImportantProperty: asString(raw.currentMostImportantProperty),
    currentNotes: asString(raw.currentNotes),
    selectedStones: {
      stoneA: normalizeStone((raw.selectedStones as Record<string, unknown>)?.stoneA),
      stoneB: normalizeStone((raw.selectedStones as Record<string, unknown>)?.stoneB),
    },
    availableStones: Array.isArray(raw.availableStones)
      ? raw.availableStones.map(normalizeStone).filter((s) => s !== null)
      : [],
    experimentHistory: Array.isArray(raw.experimentHistory)
      ? raw.experimentHistory.map(normalizeExperiment).filter((e) => e !== null)
      : [],
    conversationHistory: conversation,
    locale: typeof raw.locale === "string" ? raw.locale : undefined,
  };

  return { ok: true, errors: [], value };
}

function normalizeStone(value: unknown) {
  if (typeof value !== "object" || value === null) return null;
  const s = value as Record<string, unknown>;
  if (typeof s.id !== "string") return null;
  return {
    id: s.id,
    affinity: asString(s.affinity),
    strength: typeof s.strength === "number" ? s.strength : 0,
    charge: asString(s.charge),
  };
}

/**
 * Rebuilds an experiment from whitelisted fields only. Hidden rule-engine
 * metadata (appliedRule, internalExplanation, evaluation internals) has no
 * corresponding field here and is therefore discarded.
 */
function normalizeExperiment(value: unknown) {
  if (typeof value !== "object" || value === null) return null;
  const e = value as Record<string, unknown>;
  const stoneA = normalizeStone(e.stoneA);
  const stoneB = normalizeStone(e.stoneB);
  if (!stoneA || !stoneB) return null;
  const outcome = asString(e.outcome);
  const prediction = asString(e.prediction);
  const reflectionStatus =
    e.reflectionStatus === "AWAITING_REFLECTION"
      ? ("AWAITING_REFLECTION" as const)
      : ("COMPLETE" as const);

  return {
    experimentNumber:
      typeof e.experimentNumber === "number" ? e.experimentNumber : 0,
    round: typeof e.round === "number" ? e.round : null,
    roundExperimentNumber:
      typeof e.roundExperimentNumber === "number" ? e.roundExperimentNumber : 0,
    stoneA,
    stoneB,
    prediction,
    outcome,
    winningStoneId:
      typeof e.winningStoneId === "string" ? e.winningStoneId : null,
    predictionMatched:
      typeof e.predictionMatched === "boolean"
        ? e.predictionMatched
        : prediction.length > 0 && prediction === outcome,
    hypothesis: asString(e.hypothesis),
    justification: asString(e.justification),
    mostImportantProperty: asString(
      e.mostImportantProperty ?? e.hypothesis,
    ),
    notes: asString(e.notes ?? e.justification),
    evidenceAssessment: asString(e.evidenceAssessment),
    observation: asString(e.observation),
    revisedHypothesis: asString(e.revisedHypothesis),
    reflectionStatus,
  };
}
