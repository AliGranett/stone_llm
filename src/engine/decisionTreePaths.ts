import {
  DECISION_TREE_SHAPE,
  TREE_ROOT_ID,
  branchId,
  getTreeNodeSpec,
} from "../config/finalModelConfig";
import type {
  BranchLabel,
  DecisionConditionId,
  DecisionTreeState,
} from "../types";

/**
 * Stable ids for accumulated case-path segments shown on the decision tree.
 * Derived only from the participant's condition cards and YES/NO labels —
 * never from the hidden rule engine.
 */
export type PathSegmentId =
  | "SAME_CHARGE"
  | "DIFFERENT_CHARGE"
  | "SAME_STRENGTH"
  | "DIFFERENT_STRENGTH"
  | "SAME_AFFINITY"
  | "DIFFERENT_AFFINITY"
  | "NEUTRAL_AFFINITY_PAIR"
  | "NON_NEUTRAL_AFFINITY_PAIR";

export const PATH_SEGMENT_IDS: readonly PathSegmentId[] = [
  "SAME_CHARGE",
  "DIFFERENT_CHARGE",
  "SAME_STRENGTH",
  "DIFFERENT_STRENGTH",
  "SAME_AFFINITY",
  "DIFFERENT_AFFINITY",
  "NEUTRAL_AFFINITY_PAIR",
  "NON_NEUTRAL_AFFINITY_PAIR",
] as const;

/**
 * Maps a placed condition + YES/NO assignment to the human-readable case
 * fragment for that branch. These are linguistic opposites of the question
 * cards, not the true hidden branching logic.
 */
const SEGMENT_BY_CONDITION: Record<
  DecisionConditionId,
  Record<BranchLabel, PathSegmentId>
> = {
  SAME_CHARGE: { YES: "SAME_CHARGE", NO: "DIFFERENT_CHARGE" },
  SAME_STRENGTH: { YES: "SAME_STRENGTH", NO: "DIFFERENT_STRENGTH" },
  SAME_AFFINITY: { YES: "SAME_AFFINITY", NO: "DIFFERENT_AFFINITY" },
  NEUTRAL_AFFINITY_PAIR: {
    YES: "NEUTRAL_AFFINITY_PAIR",
    NO: "NON_NEUTRAL_AFFINITY_PAIR",
  },
};

export function pathSegmentFor(
  condition: DecisionConditionId,
  label: BranchLabel,
): PathSegmentId {
  return SEGMENT_BY_CONDITION[condition][label];
}

export interface TreePathLabels {
  /** Path conditions that lead into each decision node (empty for the root). */
  nodes: Record<string, PathSegmentId[]>;
  /** Full path conditions that lead into each terminal. */
  terminals: Record<string, PathSegmentId[]>;
  /**
   * Meaning of each branch edge alone (from its parent condition + YES/NO).
   * Null when the parent condition or the branch label is unset.
   */
  branches: Record<string, PathSegmentId | null>;
}

function emptyLabels(): TreePathLabels {
  const nodes: Record<string, PathSegmentId[]> = {};
  const terminals: Record<string, PathSegmentId[]> = {};
  const branches: Record<string, PathSegmentId | null> = {};
  for (const node of DECISION_TREE_SHAPE) {
    nodes[node.id] = [];
    branches[branchId(node.id, 0)] = null;
    branches[branchId(node.id, 1)] = null;
    for (const child of node.children) {
      if (child.kind === "terminal") terminals[child.id] = [];
    }
  }
  return { nodes, terminals, branches };
}

/**
 * Walks the fixed tree shape and accumulates case segments from the
 * participant's placed conditions and YES/NO branch assignments.
 */
export function buildTreePathLabels(tree: DecisionTreeState): TreePathLabels {
  const labels = emptyLabels();

  const walk = (nodeId: string, pathSoFar: PathSegmentId[]) => {
    labels.nodes[nodeId] = pathSoFar;
    const spec = getTreeNodeSpec(nodeId);
    const condition = tree.nodes[nodeId];

    spec.children.forEach((child, index) => {
      const id = branchId(nodeId, index as 0 | 1);
      const branchLabel = tree.branches[id] ?? null;
      let nextPath = pathSoFar;
      let segment: PathSegmentId | null = null;

      if (condition && branchLabel) {
        segment = pathSegmentFor(condition, branchLabel);
        nextPath = [...pathSoFar, segment];
      }

      labels.branches[id] = segment;

      if (child.kind === "node") {
        walk(child.id, nextPath);
      } else {
        labels.terminals[child.id] = nextPath;
      }
    });
  };

  walk(TREE_ROOT_ID, []);
  return labels;
}

/** Joins translated segment labels with a separator for display. */
export function formatPathLabel(
  segments: PathSegmentId[],
  labels: Record<PathSegmentId, string>,
  separator = " → ",
): string {
  return segments.map((segment) => labels[segment]).join(separator);
}
