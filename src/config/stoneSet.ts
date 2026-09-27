import type { Stone } from "../types";

/**
 * Fixed stone set for this study version. Every participant sees the same
 * stones in the same order — do not randomize per session.
 *
 * The set deliberately allows participants to test (without visually
 * flagging which pairs are informative):
 *  - same charge, equal strength        e.g. E-01 vs G-02
 *  - same charge, unequal strength      e.g. T-01 vs T-03
 *  - opposite charge, same affinity     e.g. E-01 vs E-02
 *  - neutral pairs (Water/Earth)         e.g. T-02 vs V-01 (equal strength)
 *  - neutral pairs (Fire/Wind)           e.g. E-02 vs G-02 (equal strength)
 *  - dominance pairs at equal/unequal strength
 */
export const STONE_SET: readonly Stone[] = [
  { id: "T-01", affinity: "TIDE", strength: 1, charge: "POSITIVE" },
  { id: "T-02", affinity: "TIDE", strength: 2, charge: "NEGATIVE" },
  { id: "T-03", affinity: "TIDE", strength: 3, charge: "POSITIVE" },
  { id: "E-01", affinity: "EMBER", strength: 2, charge: "POSITIVE" },
  { id: "E-02", affinity: "EMBER", strength: 2, charge: "NEGATIVE" },
  { id: "E-03", affinity: "EMBER", strength: 3, charge: "NEGATIVE" },
  { id: "G-01", affinity: "GALE", strength: 1, charge: "NEGATIVE" },
  { id: "G-02", affinity: "GALE", strength: 2, charge: "POSITIVE" },
  { id: "G-03", affinity: "GALE", strength: 3, charge: "POSITIVE" },
  { id: "V-01", affinity: "GROVE", strength: 2, charge: "POSITIVE" },
  { id: "V-02", affinity: "GROVE", strength: 2, charge: "NEGATIVE" },
  { id: "V-03", affinity: "GROVE", strength: 1, charge: "POSITIVE" },
];

export function getStoneById(id: string): Stone | undefined {
  return STONE_SET.find((stone) => stone.id === id);
}
