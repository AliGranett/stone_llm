import type { ExperimentalCondition } from "../types";

/**
 * Central study configuration. All tunable study parameters live here so
 * nothing (limits, feature toggles, endpoints) is hardcoded in components.
 */
export const studyConfig = {
  /**
   * Storage namespace. Kept at "asterion-v1" even though the protocol moved
   * to the round-based design, so existing sessions can be migrated by the
   * versioned persistence schema instead of being orphaned.
   */
  studyVersion: "asterion-v1",

  /**
   * Fixed condition for Participant Mode when no URL parameter is supplied.
   * When null, the experimenter must open the study with
   * ?condition=ANALYTICAL or ?condition=HYPOTHESIS_DRIVEN in the link.
   */
  fixedCondition: null as ExperimentalCondition | null,

  /** Show the internal rule explanation with each result (research use only). */
  showRuleExplanationsToParticipant: false,

  /** Show an automatic correctness score after final submission. */
  showCorrectnessScore: false,

  /** Confidence scale for the final submission. */
  confidenceScale: { min: 1, max: 7 },

  /**
   * Backend endpoint for the Research Partner. The server decides whether a
   * real model or the development mock answers (USE_MOCK_LLM in .env), so the
   * client has no mock/real switch of its own.
   */
  researchPartnerEndpoint: "/api/research-partner",

  /** Development-only controls (reset, condition switch, export, etc.). */
  enableDevControls: import.meta.env.DEV,
};

export type StudyConfig = typeof studyConfig;
