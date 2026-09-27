import {
  AFFINITY_DOMINANCE_CYCLE,
  AFFINITY_NEUTRAL_PAIRS,
} from "../config/affinityRelationships";
import {
  TREE_ROOT_ID,
  branchId,
  getTreeNodeSpec,
} from "../config/finalModelConfig";
import type {
  Affinity,
  DecisionConditionId,
  DecisionTreeState,
  ExperimentOutcome,
  Stone,
  TerminalOutcomeId,
} from "../types";

/**
 * Interprets a participant-built decision tree against a stone pair.
 *
 * Used for research analysis (e.g. experiments.csv consistency columns).
 * Does NOT use the hidden rule engine — only the participant's tree plus the
 * affinity relationships that were given in the instructions.
 */

export type TreeEvalStatus = "MATCH" | "MISMATCH" | "UNEVALUABLE";

export interface ParticipantTreePrediction {
  status: TreeEvalStatus;
  /** Concrete outcome the tree resolves to, when evaluable. */
  predictedOutcome: ExperimentOutcome | null;
  /** Terminal card reached, when the walk completed. */
  terminalId: string | null;
  terminalOutcome: TerminalOutcomeId | null;
  /** Human-readable reason when status is UNEVALUABLE. */
  unevaluableReason: string | null;
  /** Node ids visited before the terminal (or until failure). */
  pathNodeIds: string[];
}

function isNeutralAffinityPair(a: Affinity, b: Affinity): boolean {
  return AFFINITY_NEUTRAL_PAIRS.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  );
}

/** True when `winner` dominates `loser` in the given cycle. */
export function affinityDominates(winner: Affinity, loser: Affinity): boolean {
  const index = AFFINITY_DOMINANCE_CYCLE.indexOf(winner);
  if (index < 0) return false;
  const next = AFFINITY_DOMINANCE_CYCLE[(index + 1) % AFFINITY_DOMINANCE_CYCLE.length];
  return next === loser;
}

function answerCondition(
  condition: DecisionConditionId,
  stoneA: Stone,
  stoneB: Stone,
): boolean {
  switch (condition) {
    case "SAME_CHARGE":
      return stoneA.charge === stoneB.charge;
    case "SAME_STRENGTH":
      return stoneA.strength === stoneB.strength;
    case "SAME_AFFINITY":
      return stoneA.affinity === stoneB.affinity;
    case "NEUTRAL_AFFINITY_PAIR":
      return isNeutralAffinityPair(stoneA.affinity, stoneB.affinity);
  }
}

function resolveTerminal(
  terminal: TerminalOutcomeId,
  stoneA: Stone,
  stoneB: Stone,
): { outcome: ExperimentOutcome | null; reason: string | null } {
  switch (terminal) {
    case "STALEMATE":
      return { outcome: "STALEMATE", reason: null };
    case "MUTUAL_NEUTRALIZATION":
      return { outcome: "MUTUAL_NEUTRALIZATION", reason: null };
    case "STRONGER_CRYSTAL_WINS": {
      if (stoneA.strength === stoneB.strength) {
        return {
          outcome: null,
          reason: "STRONGER_CRYSTAL_WINS with equal strength",
        };
      }
      return {
        outcome: stoneA.strength > stoneB.strength ? "STONE_A_WINS" : "STONE_B_WINS",
        reason: null,
      };
    }
    case "DOMINANT_AFFINITY_WINS": {
      if (stoneA.affinity === stoneB.affinity) {
        return {
          outcome: null,
          reason: "DOMINANT_AFFINITY_WINS with same affinity",
        };
      }
      if (isNeutralAffinityPair(stoneA.affinity, stoneB.affinity)) {
        return {
          outcome: null,
          reason: "DOMINANT_AFFINITY_WINS with neutral affinity pair",
        };
      }
      if (affinityDominates(stoneA.affinity, stoneB.affinity)) {
        return { outcome: "STONE_A_WINS", reason: null };
      }
      if (affinityDominates(stoneB.affinity, stoneA.affinity)) {
        return { outcome: "STONE_B_WINS", reason: null };
      }
      return {
        outcome: null,
        reason: "DOMINANT_AFFINITY_WINS with no dominance relation",
      };
    }
  }
}

function unevaluable(
  partial: Partial<ParticipantTreePrediction> & {
    unevaluableReason: string;
  },
): ParticipantTreePrediction {
  return {
    status: "UNEVALUABLE",
    predictedOutcome: null,
    terminalId: null,
    terminalOutcome: null,
    pathNodeIds: [],
    ...partial,
  };
}

/**
 * Walks the participant tree for a stone pair and resolves a concrete outcome.
 */
export function predictWithParticipantTree(
  tree: DecisionTreeState,
  stoneA: Stone,
  stoneB: Stone,
): ParticipantTreePrediction {
  const pathNodeIds: string[] = [];
  let nodeId = TREE_ROOT_ID;

  // Safety bound: tree has 5 nodes; anything more indicates a cycle/bug.
  for (let depth = 0; depth < 8; depth += 1) {
    pathNodeIds.push(nodeId);
    const condition = tree.nodes[nodeId];
    if (!condition) {
      return unevaluable({
        pathNodeIds,
        unevaluableReason: `Missing condition on node ${nodeId}`,
      });
    }

    const answerYes = answerCondition(condition, stoneA, stoneB);
    const wanted: "YES" | "NO" = answerYes ? "YES" : "NO";
    const spec = getTreeNodeSpec(nodeId);

    let childIndex: 0 | 1 | null = null;
    for (const index of [0, 1] as const) {
      const label = tree.branches[branchId(nodeId, index)] ?? null;
      if (label === wanted) {
        childIndex = index;
        break;
      }
    }

    if (childIndex === null) {
      return unevaluable({
        pathNodeIds,
        unevaluableReason: `Missing ${wanted} branch on node ${nodeId}`,
      });
    }

    const child = spec.children[childIndex];
    if (child.kind === "node") {
      nodeId = child.id;
      continue;
    }

    const terminalOutcome = tree.terminals[child.id];
    if (!terminalOutcome) {
      return unevaluable({
        pathNodeIds,
        terminalId: child.id,
        unevaluableReason: `Missing outcome on terminal ${child.id}`,
      });
    }

    const resolved = resolveTerminal(terminalOutcome, stoneA, stoneB);
    if (!resolved.outcome) {
      return unevaluable({
        pathNodeIds,
        terminalId: child.id,
        terminalOutcome,
        unevaluableReason: resolved.reason ?? "Could not resolve terminal",
      });
    }

    return {
      status: "MISMATCH", // overwritten by compareTreeToActual when actual is known
      predictedOutcome: resolved.outcome,
      terminalId: child.id,
      terminalOutcome,
      unevaluableReason: null,
      pathNodeIds,
    };
  }

  return unevaluable({
    pathNodeIds,
    unevaluableReason: "Tree walk exceeded maximum depth",
  });
}

/**
 * Compares a participant-tree prediction to an observed experiment outcome.
 */
export function compareTreeToActual(
  prediction: ParticipantTreePrediction,
  actualOutcome: ExperimentOutcome,
): ParticipantTreePrediction {
  if (prediction.predictedOutcome === null) {
    return { ...prediction, status: "UNEVALUABLE" };
  }
  return {
    ...prediction,
    status: prediction.predictedOutcome === actualOutcome ? "MATCH" : "MISMATCH",
  };
}

/** Walk the tree and score it against an observed outcome in one step. */
export function assessExperimentAgainstTree(
  tree: DecisionTreeState,
  stoneA: Stone,
  stoneB: Stone,
  actualOutcome: ExperimentOutcome,
): ParticipantTreePrediction {
  return compareTreeToActual(
    predictWithParticipantTree(tree, stoneA, stoneB),
    actualOutcome,
  );
}

/** Prefer the submitted final tree; fall back to the live tree state. */
export function resolveFinalDecisionTree(state: {
  decisionTree: DecisionTreeState;
  finalModelSubmission: { decisionTree: DecisionTreeState } | null;
}): DecisionTreeState {
  return state.finalModelSubmission?.decisionTree ?? state.decisionTree;
}
