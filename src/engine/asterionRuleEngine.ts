import type { Affinity, ExperimentEvaluation, Stone } from "../types";

/**
 * Hidden deterministic rule engine for Asterion Crystal interactions.
 *
 * This module is intentionally isolated from all UI code. The evaluation it
 * returns includes internal metadata (`appliedRule`, `internalExplanation`)
 * that must never be shown to participants unless the study configuration
 * explicitly enables explanations.
 *
 * Rules are evaluated in order; the first rule that applies determines the
 * outcome. To add a future rule, insert a new entry into RULE_CHAIN at the
 * appropriate priority.
 */

/** Affinity dominance cycle: key defeats value. */
const DOMINATES: Record<Affinity, Affinity> = {
  EMBER: "GROVE",
  GROVE: "GALE",
  GALE: "TIDE",
  TIDE: "EMBER",
};

/** Unordered affinity pairs that neutralize dominance. */
const NEUTRAL_PAIRS: ReadonlyArray<readonly [Affinity, Affinity]> = [
  ["TIDE", "GROVE"],
  ["EMBER", "GALE"],
];

function isNeutralPair(a: Affinity, b: Affinity): boolean {
  return NEUTRAL_PAIRS.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  );
}

function strengthComparison(a: Stone, b: Stone): ExperimentEvaluation | null {
  if (a.strength === b.strength) return null;
  const winner = a.strength > b.strength ? a : b;
  return {
    outcome: winner === a ? "STONE_A_WINS" : "STONE_B_WINS",
    winningStoneId: winner.id,
    appliedRule: "SAME_CHARGE_STRENGTH",
    internalExplanation: `Strengths differ (${a.strength} vs ${b.strength}); the stronger stone ${winner.id} wins.`,
  };
}

type Rule = (a: Stone, b: Stone) => ExperimentEvaluation | null;

const sameChargeRule: Rule = (a, b) => {
  if (a.charge !== b.charge) return null;
  if (a.strength === b.strength) {
    return {
      outcome: "STALEMATE",
      winningStoneId: null,
      appliedRule: "SAME_CHARGE_STALEMATE",
      internalExplanation: `Both stones share the ${a.charge.toLowerCase()} charge with equal strength ${a.strength}; stalemate.`,
    };
  }
  const byStrength = strengthComparison(a, b);
  return byStrength && { ...byStrength, appliedRule: "SAME_CHARGE_STRENGTH" };
};

const sameAffinityRule: Rule = (a, b) => {
  // Reached only with opposite charges (sameChargeRule ran first).
  if (a.affinity !== b.affinity) return null;
  return {
    outcome: "MUTUAL_NEUTRALIZATION",
    winningStoneId: null,
    appliedRule: "SAME_AFFINITY_NEUTRALIZATION",
    internalExplanation: `Opposite charges within the same affinity (${a.affinity}); the stones neutralize each other.`,
  };
};

const neutralPairRule: Rule = (a, b) => {
  if (!isNeutralPair(a.affinity, b.affinity)) return null;
  if (a.strength === b.strength) {
    return {
      outcome: "STALEMATE",
      winningStoneId: null,
      appliedRule: "NEUTRAL_PAIR_STALEMATE",
      internalExplanation: `${a.affinity}/${b.affinity} is a neutral pair and strengths are equal; stalemate.`,
    };
  }
  const byStrength = strengthComparison(a, b);
  return (
    byStrength && {
      ...byStrength,
      appliedRule: "NEUTRAL_PAIR_STRENGTH",
      internalExplanation: `${a.affinity}/${b.affinity} is a neutral pair; the stronger stone ${byStrength.winningStoneId} wins.`,
    }
  );
};

const affinityDominanceRule: Rule = (a, b) => {
  const winner = DOMINATES[a.affinity] === b.affinity ? a : b;
  return {
    outcome: winner === a ? "STONE_A_WINS" : "STONE_B_WINS",
    winningStoneId: winner.id,
    appliedRule: "AFFINITY_DOMINANCE",
    internalExplanation: `${winner.affinity} dominates ${(winner === a ? b : a).affinity}; ${winner.id} wins regardless of strength.`,
  };
};

/**
 * Ordered rule chain.
 */
const RULE_CHAIN: readonly Rule[] = [
  sameChargeRule,
  sameAffinityRule,
  neutralPairRule,
  affinityDominanceRule,
];

export function evaluateExperiment(
  stoneA: Stone,
  stoneB: Stone,
): ExperimentEvaluation {
  for (const rule of RULE_CHAIN) {
    const result = rule(stoneA, stoneB);
    if (result) return result;
  }
  // Unreachable: affinityDominanceRule always resolves the remaining cases.
  throw new Error("Rule engine failed to produce an outcome");
}
