import {
  createEmptyAffinityMap,
  createEmptyDecisionTree,
} from "../config/finalModelConfig";
import { ASSISTED_ROUND_COUNT, ROUND_EXPERIMENT_LIMIT } from "../config/roundConfig";
import { getStoneById } from "../config/stoneSet";
import { studyConfig } from "../config/studyConfig";
import type { StudyState } from "../state/studyReducer";
import { createInitialState } from "../state/studyReducer";
import type {
  AffinityMapState,
  AiProblemSolvingConfidence,
  ChatMessage,
  DecisionTreeState,
  EducationLevel,
  ExperimentRecord,
  LlmExperience,
  LlmInteractionRecord,
  MostImportantProperty,
  ParticipantBackground,
  PendingExperiment,
  Stone,
  StudyPhase,
} from "../types";
import { EDUCATION_LEVELS, MOST_IMPORTANT_PROPERTIES } from "../types";

/**
 * Dedicated persistence layer — the only module allowed to touch storage.
 * Keys are versioned by study version plus a schema version so incompatible
 * older sessions are migrated or ignored rather than crashing the app.
 *
 * Schema history:
 *  v1  original ASSISTED-only ("INVESTIGATION") protocol
 *  v2  ENTRY/BACKGROUND + ASSISTED/TRANSFER phases
 *  v3  extended background questionnaire
 *  v4  round-based assisted protocol + final investigation model building
 */

const SCHEMA_VERSION = 4;
const STORAGE_KEY = `asterion-study:${studyConfig.studyVersion}:v${SCHEMA_VERSION}`;
const LEGACY_STORAGE_KEYS = [3, 2, 1].map(
  (version) => `asterion-study:${studyConfig.studyVersion}:v${version}`,
);

interface PersistedEnvelope {
  schemaVersion: number;
  savedAt: string;
  state: StudyState;
}

export type PersistenceListener = (status: PersistenceStatus) => void;
export type PersistenceStatus = "idle" | "saving" | "saved" | "error";

const EDUCATION_LEVEL_SET = new Set<string>(EDUCATION_LEVELS);

function getStorage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/* ------------------------------ normalization ---------------------------- */

function normalizeEducationLevel(value: unknown): EducationLevel | "" {
  if (typeof value !== "string" || value.length === 0) return "";
  if (EDUCATION_LEVEL_SET.has(value)) return value as EducationLevel;
  return "OTHER";
}

function normalizeBackgroundDraft(
  draft: Partial<StudyState["backgroundDraft"]> | undefined,
  base: StudyState["backgroundDraft"],
): StudyState["backgroundDraft"] {
  if (!draft) return base;
  return {
    age: draft.age ?? base.age,
    educationLevel: normalizeEducationLevel(draft.educationLevel),
    fieldOrOccupation: draft.fieldOrOccupation ?? base.fieldOrOccupation,
    llmExperience: (draft.llmExperience ?? base.llmExperience) as LlmExperience | "",
    aiLearningProblemSolvingFrequency: (draft.aiLearningProblemSolvingFrequency ??
      base.aiLearningProblemSolvingFrequency) as LlmExperience | "",
    aiProblemSolvingConfidence: (draft.aiProblemSolvingConfidence ??
      base.aiProblemSolvingConfidence) as AiProblemSolvingConfidence | "",
  };
}

function normalizeBackground(
  background: Partial<ParticipantBackground> | null | undefined,
): ParticipantBackground | null {
  if (!background) return null;
  const educationLevel = normalizeEducationLevel(background.educationLevel);
  if (
    typeof background.age !== "number" ||
    educationLevel === "" ||
    typeof background.fieldOrOccupation !== "string" ||
    !background.llmExperience
  ) {
    return null;
  }
  return {
    age: background.age,
    educationLevel,
    fieldOrOccupation: background.fieldOrOccupation,
    llmExperience: background.llmExperience,
    aiLearningProblemSolvingFrequency:
      background.aiLearningProblemSolvingFrequency ?? background.llmExperience,
    aiProblemSolvingConfidence: background.aiProblemSolvingConfidence ?? 3,
  };
}

function normalizeDecisionTree(tree: Partial<DecisionTreeState> | undefined): DecisionTreeState {
  const empty = createEmptyDecisionTree();
  if (!tree) return empty;
  return {
    nodes: { ...empty.nodes, ...(tree.nodes ?? {}) },
    branches: { ...empty.branches, ...(tree.branches ?? {}) },
    terminals: { ...empty.terminals, ...(tree.terminals ?? {}) },
  };
}

function normalizeAffinityMap(map: Partial<AffinityMapState> | undefined): AffinityMapState {
  const empty = createEmptyAffinityMap();
  if (!map?.relations) return empty;
  return { relations: { ...empty.relations, ...map.relations } };
}

/** Strip legacy `stability` and resolve stones to the current three-property shape. */
function normalizeStone(raw: unknown): Stone | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.id !== "string") return null;

  const canonical = getStoneById(record.id);
  if (canonical) return { ...canonical };

  if (
    typeof record.affinity !== "string" ||
    typeof record.strength !== "number" ||
    typeof record.charge !== "string"
  ) {
    return null;
  }

  return {
    id: record.id,
    affinity: record.affinity as Stone["affinity"],
    strength: record.strength as Stone["strength"],
    charge: record.charge as Stone["charge"],
  };
}

function normalizeMostImportantProperty(raw: unknown): MostImportantProperty {
  if (
    typeof raw === "string" &&
    (MOST_IMPORTANT_PROPERTIES as readonly string[]).includes(raw)
  ) {
    return raw as MostImportantProperty;
  }
  return "UNSURE";
}

function normalizeExperimentFields(raw: Record<string, unknown>): {
  mostImportantProperty: MostImportantProperty;
  notes: string;
} {
  const notes =
    typeof raw.notes === "string"
      ? raw.notes
      : typeof raw.justification === "string"
        ? raw.justification
        : "";
  const mostImportantProperty = normalizeMostImportantProperty(
    raw.mostImportantProperty ??
      // Legacy free-text hypothesis cannot be mapped reliably.
      undefined,
  );
  return { mostImportantProperty, notes };
}

function normalizeExperimentRecord(record: ExperimentRecord): ExperimentRecord {
  const stoneA = normalizeStone(record.stoneA);
  const stoneB = normalizeStone(record.stoneB);
  const legacy = record as ExperimentRecord & {
    hypothesis?: string;
    justification?: string;
  };
  const fields = normalizeExperimentFields(legacy as unknown as Record<string, unknown>);
  const reflection = {
    evidenceAssessment: record.reflection?.evidenceAssessment ?? "UNCLEAR",
    observation: record.reflection?.observation ?? "",
    revisedHypothesis: record.reflection?.revisedHypothesis ?? "",
    hypothesisUnchanged: record.reflection?.hypothesisUnchanged ?? true,
  };
  return {
    ...record,
    stoneA: stoneA ?? record.stoneA,
    stoneB: stoneB ?? record.stoneB,
    mostImportantProperty: fields.mostImportantProperty,
    notes: fields.notes,
    reflection,
  };
}

function normalizePendingExperiment(
  pending: PendingExperiment | null,
): PendingExperiment | null {
  if (!pending) return null;
  const stoneA = normalizeStone(pending.stoneA);
  const stoneB = normalizeStone(pending.stoneB);
  const fields = normalizeExperimentFields(pending as unknown as Record<string, unknown>);
  return {
    ...pending,
    stoneA: stoneA ?? pending.stoneA,
    stoneB: stoneB ?? pending.stoneB,
    mostImportantProperty: fields.mostImportantProperty,
    notes: fields.notes,
  };
}

function normalizeExperiments(records: ExperimentRecord[]): ExperimentRecord[] {
  return records.map(normalizeExperimentRecord);
}

function mapLegacyPhase(phase: unknown): StudyPhase {
  switch (phase) {
    case "INVESTIGATION":
      return "ASSISTED";
    case "TRANSFER":
    case "FINAL_SUBMISSION":
      return "FINAL_INVESTIGATION";
    case "ENTRY":
    case "BACKGROUND":
    case "INSTRUCTIONS":
    case "ASSISTED":
    case "FINAL_INVESTIGATION":
    case "COMPLETE":
      return phase;
    default:
      return "ENTRY";
  }
}

type LegacyExperiment = Omit<ExperimentRecord, "phase"> & { phase?: string };

/**
 * Fills round/global numbering on experiments that predate the round-based
 * protocol. Assisted experiments are chunked into rounds of 4 in order;
 * TRANSFER experiments become final-investigation experiments.
 */
function migrateExperiments(records: LegacyExperiment[]): ExperimentRecord[] {
  let assistedIndex = 0;
  let finalIndex = 0;
  return records.map((record, index) => {
    const phase =
      record.phase === "TRANSFER" || record.phase === "FINAL_INVESTIGATION"
        ? ("FINAL_INVESTIGATION" as const)
        : ("ASSISTED" as const);
    const globalNumber = index + 1;
    let round: number | null;
    let roundExperimentNumber: number;
    if (phase === "ASSISTED") {
      round =
        record.round ?? Math.floor(assistedIndex / ROUND_EXPERIMENT_LIMIT) + 1;
      roundExperimentNumber =
        record.roundExperimentNumber ?? (assistedIndex % ROUND_EXPERIMENT_LIMIT) + 1;
      assistedIndex += 1;
    } else {
      round = null;
      finalIndex += 1;
      roundExperimentNumber = record.roundExperimentNumber ?? finalIndex;
    }
    return {
      ...record,
      phase,
      round,
      roundExperimentNumber,
      globalExperimentNumber: record.globalExperimentNumber ?? globalNumber,
      experimentNumber: record.globalExperimentNumber ?? globalNumber,
      stoneA: normalizeStone(record.stoneA) ?? record.stoneA,
      stoneB: normalizeStone(record.stoneB) ?? record.stoneB,
    };
  });
}

function migrateChatMessages(messages: Array<Partial<ChatMessage>>): ChatMessage[] {
  return messages
    .filter((message): message is ChatMessage => typeof message?.content === "string")
    .map((message) => ({ ...message, round: message.round ?? null }));
}

function migrateLlmInteractions(
  interactions: Array<Partial<LlmInteractionRecord>>,
): LlmInteractionRecord[] {
  return interactions
    .filter(
      (interaction): interaction is LlmInteractionRecord =>
        typeof interaction?.interactionId === "string",
    )
    .map((interaction, index) => ({
      ...interaction,
      studyPhase: mapLegacyPhase(interaction.studyPhase),
      round: interaction.round ?? null,
      roundInquiryNumber: interaction.roundInquiryNumber ?? 0,
      globalInquiryNumber: interaction.globalInquiryNumber ?? index + 1,
      experimentsCompletedInRound: interaction.experimentsCompletedInRound ?? 0,
    }));
}

/**
 * Converts any older persisted shape (v1–v3) into the current v4 state. All
 * fields introduced by the round-based protocol receive safe defaults; the
 * participant's completed work (experiments, chat, background, events) is
 * preserved.
 */
function migrateState(raw: Record<string, unknown>): StudyState {
  const base = createInitialState();
  const legacy = raw as Partial<StudyState> & {
    phase?: string;
    experimentLimit?: number;
  };

  const phase = mapLegacyPhase(legacy.phase);
  const instructionsCompletedAt =
    typeof legacy.instructionsCompletedAt === "string"
      ? legacy.instructionsCompletedAt
      : phase !== "ENTRY" && phase !== "BACKGROUND" && phase !== "INSTRUCTIONS"
        ? legacy.backgroundCompletedAt ?? legacy.startedAt ?? null
        : null;
  const experiments = migrateExperiments(
    (legacy.experiments ?? []) as LegacyExperiment[],
  );
  const assistedCount = experiments.filter((record) => record.phase === "ASSISTED").length;

  const rawAssistedRound =
    typeof legacy.currentAssistedRound === "number"
      ? legacy.currentAssistedRound
      : Math.floor(assistedCount / ROUND_EXPERIMENT_LIMIT) + 1;

  // Old 5-round sessions mid Round 4/5 advance into the final stage.
  const pastNewProtocol =
    phase === "ASSISTED" && rawAssistedRound > ASSISTED_ROUND_COUNT;

  const currentAssistedRound = Math.min(
    ASSISTED_ROUND_COUNT,
    Math.max(1, Math.round(rawAssistedRound)),
  );

  const migratedPhase = pastNewProtocol ? ("FINAL_INVESTIGATION" as const) : phase;

  let pendingExperiment: PendingExperiment | null = null;
  if (legacy.pendingExperiment) {
    const pending = legacy.pendingExperiment as Omit<PendingExperiment, "phase"> & {
      phase?: string;
    };
    const pendingPhase =
      pending.phase === "TRANSFER" ||
      pending.phase === "FINAL_INVESTIGATION" ||
      pastNewProtocol
        ? ("FINAL_INVESTIGATION" as const)
        : ("ASSISTED" as const);
    pendingExperiment = normalizePendingExperiment({
      ...pending,
      phase: pendingPhase,
      round:
        pending.round ??
        (pendingPhase === "ASSISTED" ? currentAssistedRound : null),
      roundExperimentNumber: pending.roundExperimentNumber ?? 1,
      globalExperimentNumber: pending.globalExperimentNumber ?? experiments.length + 1,
    });
  }

  const legacyRecord = legacy as Partial<StudyState> & {
    phase?: string;
    experimentLimit?: number;
    hypothesis?: string;
    justification?: string;
    mostImportantProperty?: MostImportantProperty | null;
    notes?: string;
  };

  return {
    ...base,
    ...legacy,
    phase: migratedPhase,
    studyMode: legacy.studyMode ?? "TESTING",
    startedAt: legacy.startedAt ?? legacy.backgroundCompletedAt ?? new Date().toISOString(),
    background: normalizeBackground(legacy.background),
    backgroundDraft: normalizeBackgroundDraft(legacy.backgroundDraft, base.backgroundDraft),
    backgroundCompletedAt: legacy.backgroundCompletedAt ?? null,
    instructionsCompletedAt,
    conditionAssigned:
      legacy.conditionAssigned ?? (legacy.condition != null && legacy.condition !== undefined),
    condition: legacy.condition ?? null,
    currentAssistedRound,
    mostImportantProperty:
      typeof legacyRecord.mostImportantProperty === "string" &&
      (MOST_IMPORTANT_PROPERTIES as readonly string[]).includes(
        legacyRecord.mostImportantProperty,
      )
        ? legacyRecord.mostImportantProperty
        : null,
    notes:
      typeof legacyRecord.notes === "string"
        ? legacyRecord.notes
        : typeof legacyRecord.justification === "string"
          ? legacyRecord.justification
          : "",
    experiments: normalizeExperiments(experiments),
    pendingExperiment,
    reflectionDraft: {
      evidenceAssessment: legacy.reflectionDraft?.evidenceAssessment ?? null,
      observation: legacy.reflectionDraft?.observation ?? "",
    },
    chatMessages: migrateChatMessages(
      (legacy.chatMessages ?? []) as Array<Partial<ChatMessage>>,
    ),
    llmInteractions: migrateLlmInteractions(
      (legacy.llmInteractions ?? []) as Array<Partial<LlmInteractionRecord>>,
    ),
    decisionTree: normalizeDecisionTree(legacy.decisionTree),
    affinityMap: normalizeAffinityMap(legacy.affinityMap),
    finalModelDraft: legacy.finalModelDraft ?? base.finalModelDraft,
    finalModelSubmission: legacy.finalModelSubmission ?? null,
    modelSnapshots: legacy.modelSnapshots ?? [],
    finalSubmission: legacy.finalSubmission ?? null,
    eventLog: legacy.eventLog ?? [],
  };
}

function parseEnvelope(raw: string): StudyState | null {
  try {
    const envelope = JSON.parse(raw) as Partial<PersistedEnvelope>;
    if (!envelope.state) return null;

    if (
      envelope.schemaVersion === SCHEMA_VERSION ||
      (typeof envelope.schemaVersion === "number" &&
        envelope.schemaVersion >= 1 &&
        envelope.schemaVersion < SCHEMA_VERSION)
    ) {
      // migrateState is idempotent for current-version states: it only fills
      // defaults for missing fields.
      return migrateState(envelope.state as unknown as Record<string, unknown>);
    }

    return null;
  } catch {
    return null;
  }
}

export const studyPersistence = {
  load(): StudyState | null {
    const storage = getStorage();
    if (!storage) return null;

    const current = storage.getItem(STORAGE_KEY);
    if (current) {
      const state = parseEnvelope(current);
      if (state) return state;
    }

    for (const key of LEGACY_STORAGE_KEYS) {
      const legacy = storage.getItem(key);
      if (!legacy) continue;
      const state = parseEnvelope(legacy);
      if (state) {
        studyPersistence.save(state);
        storage.removeItem(key);
        return state;
      }
    }

    return null;
  },

  save(state: StudyState): boolean {
    const storage = getStorage();
    if (!storage) return false;
    try {
      const envelope: PersistedEnvelope = {
        schemaVersion: SCHEMA_VERSION,
        savedAt: new Date().toISOString(),
        state,
      };
      storage.setItem(STORAGE_KEY, JSON.stringify(envelope));
      return true;
    } catch {
      return false;
    }
  },

  clear(): void {
    const storage = getStorage();
    try {
      storage?.removeItem(STORAGE_KEY);
      for (const key of LEGACY_STORAGE_KEYS) {
        storage?.removeItem(key);
      }
    } catch {
      // Ignore — clearing a broken store is best-effort.
    }
  },
};
