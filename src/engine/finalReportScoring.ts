import {
  DECISION_NODE_IDS,
  DECISION_TREE_SHAPE,
  TERMINAL_IDS,
  branchId,
} from "../config/finalModelConfig";
import { createCorrectDecisionTree } from "../config/correctDecisionTree";
import type { DecisionTreeState, ExperimentRecord } from "../types";
import {
  assessExperimentAgainstTree,
  resolveFinalDecisionTree,
} from "./participantTreeEvaluator";

export interface SlotScore {
  correct: number;
  total: number;
}

export interface TreeAccuracyReport {
  nodes: SlotScore;
  branches: SlotScore;
  terminals: SlotScore;
  /** nodes + branches + terminals */
  allSlots: SlotScore;
}

export interface ExperimentConsistencyReport {
  total: number;
  match: number;
  mismatch: number;
  unevaluable: number;
}

function scoreMap<T>(
  keys: readonly string[],
  actual: Record<string, T | null | undefined>,
  expected: Record<string, T | null | undefined>,
): SlotScore {
  let correct = 0;
  for (const key of keys) {
    if (actual[key] != null && actual[key] === expected[key]) {
      correct += 1;
    }
  }
  return { correct, total: keys.length };
}

/**
 * Exact-match accuracy of a participant tree against the canonical correct tree.
 * Null / wrong / swapped YES-NO all count as incorrect for that slot.
 */
export function scoreDecisionTreeAccuracy(
  participantTree: DecisionTreeState,
  correctTree: DecisionTreeState = createCorrectDecisionTree(),
): TreeAccuracyReport {
  const branchIds = DECISION_TREE_SHAPE.flatMap((node) => [
    branchId(node.id, 0),
    branchId(node.id, 1),
  ]);

  const nodes = scoreMap(DECISION_NODE_IDS, participantTree.nodes, correctTree.nodes);
  const branches = scoreMap(branchIds, participantTree.branches, correctTree.branches);
  const terminals = scoreMap(
    TERMINAL_IDS,
    participantTree.terminals,
    correctTree.terminals,
  );

  return {
    nodes,
    branches,
    terminals,
    allSlots: {
      correct: nodes.correct + branches.correct + terminals.correct,
      total: nodes.total + branches.total + terminals.total,
    },
  };
}

/** Aggregate MATCH / MISMATCH / UNEVALUABLE across experiments for one tree. */
export function scoreExperimentConsistency(
  tree: DecisionTreeState,
  experiments: readonly ExperimentRecord[],
): ExperimentConsistencyReport {
  let match = 0;
  let mismatch = 0;
  let unevaluable = 0;

  for (const record of experiments) {
    const result = assessExperimentAgainstTree(
      tree,
      record.stoneA,
      record.stoneB,
      record.evaluation.outcome,
    );
    if (result.status === "MATCH") match += 1;
    else if (result.status === "MISMATCH") mismatch += 1;
    else unevaluable += 1;
  }

  return {
    total: experiments.length,
    match,
    mismatch,
    unevaluable,
  };
}

export function buildParticipantFinalReport(state: {
  decisionTree: DecisionTreeState;
  finalModelSubmission: { decisionTree: DecisionTreeState } | null;
  experiments: ExperimentRecord[];
}): {
  tree: TreeAccuracyReport;
  experiments: ExperimentConsistencyReport;
} {
  const tree = resolveFinalDecisionTree(state);
  return {
    tree: scoreDecisionTreeAccuracy(tree),
    experiments: scoreExperimentConsistency(tree, state.experiments),
  };
}
