import type { AssistedRound, Stone } from "../types";
import { STONE_SET } from "./stoneSet";

/**
 * Round-based assisted protocol configuration.
 *
 * Each assisted round exposes a restricted subset of the fixed stone set so
 * that one main hidden relationship is discoverable without making the answer
 * explicit. The `target` strings are researcher-facing documentation only and
 * must never be rendered to participants or sent to the model.
 *
 * Affinity dominance / neutral relationships are GIVEN in the instructions;
 * rounds focus on when strength, charge, and those known relationships matter.
 */

export const ASSISTED_ROUND_COUNT = 3;

/** Maximum crystal experiments per assisted round. */
export const ROUND_EXPERIMENT_LIMIT = 4;

/** Minimum Research Partner inquiries before a round may be finished. */
export const ROUND_INQUIRY_MIN = 2;

/** Maximum Research Partner inquiries per assisted round. */
export const ROUND_INQUIRY_MAX = 4;

/** Free-choice experiments in the final independent investigation. */
export const FINAL_EXPERIMENT_LIMIT = 4;

export interface AssistedRoundConfig {
  round: AssistedRound;
  /** Researcher-facing discovery target. Never shown to participants. */
  target: string;
  stoneIds: readonly string[];
}

export const ASSISTED_ROUNDS: readonly AssistedRoundConfig[] = [
  {
    round: 1,
    target:
      "Same charge → strength decides the outcome; equal strength → stalemate. " +
      "All stones share the positive charge, so every pair demonstrates the rule " +
      "across different affinities and strengths.",
    // All POSITIVE, strengths 1/2/3 across four affinities.
    stoneIds: ["T-01", "V-03", "E-01", "G-02", "V-01", "T-03", "G-03"],
  },
  {
    round: 2,
    target:
      "Opposite charge + same affinity → mutual neutralization regardless of strength. " +
      "Water and Earth only (a neutral pair; internal TIDE/GROVE), so cross-affinity opposite-charge pairs " +
      "still resolve by strength and keep 'strength decides' viable as an alternative.",
    stoneIds: ["T-01", "T-02", "T-03", "V-01", "V-02", "V-03"],
  },
  {
    round: 3,
    target:
      "Opposite charge + different affinity: use the PROVIDED affinity map. " +
      "Neutral pairs (Fire↔Wind, Water↔Earth) → strength decides; non-neutral pairs → " +
      "known dominance decides (including strength-contradicting wins).",
    stoneIds: ["E-01", "E-02", "E-03", "G-01", "G-02", "T-02", "T-03", "V-01", "V-02"],
  },
] as const;

export function getRoundConfig(round: number): AssistedRoundConfig {
  const config = ASSISTED_ROUNDS.find((entry) => entry.round === round);
  if (!config) {
    throw new Error(`Unknown assisted round: ${round}`);
  }
  return config;
}

/** Stones visible during a given assisted round, in fixed set order. */
export function getStonesForRound(round: number): Stone[] {
  const ids = new Set(getRoundConfig(round).stoneIds);
  return STONE_SET.filter((stone) => ids.has(stone.id));
}
