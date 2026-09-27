import type { Affinity } from "../types";

/**
 * Affinity relationships that are GIVEN to participants in the instructions.
 * These mirror the hidden rule engine's dominance cycle and neutral pairs, but
 * are participant-visible background knowledge — not something to discover.
 *
 * The decision hierarchy (when affinity vs strength vs charge applies) remains
 * hidden and must never be inferred from this module alone.
 */

/** Dominance cycle: each entry dominates the next; the last dominates the first.
 * Fire → Earth → Wind → Water → Fire */
export const AFFINITY_DOMINANCE_CYCLE: readonly Affinity[] = [
  "EMBER",
  "GROVE",
  "GALE",
  "TIDE",
] as const;

/** Unordered neutral pairs shown to participants. */
export const AFFINITY_NEUTRAL_PAIRS: readonly (readonly [Affinity, Affinity])[] = [
  ["EMBER", "GALE"], // Fire ↔ Wind
  ["TIDE", "GROVE"], // Water ↔ Earth
] as const;
