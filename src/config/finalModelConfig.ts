import type {
  Affinity,
  AffinityMapState,
  DecisionConditionId,
  DecisionTreeState,
  TerminalOutcomeId,
} from "../types";

/**
 * Fixed structure for the participant-built final model.
 *
 * The decision-tree SHAPE mirrors the structure of the hidden rule chain
 * (that structure may be revealed), but every node condition, branch label,
 * and terminal outcome starts empty and is filled in by the participant.
 * Nothing in this module encodes which answer is correct.
 */

export const DECISION_CONDITIONS: readonly DecisionConditionId[] = [
  "SAME_CHARGE",
  "SAME_STRENGTH",
  "SAME_AFFINITY",
  "NEUTRAL_AFFINITY_PAIR",
] as const;

export const TERMINAL_OUTCOMES: readonly TerminalOutcomeId[] = [
  "STALEMATE",
  "DOMINANT_AFFINITY_WINS",
  "STRONGER_CRYSTAL_WINS",
  "MUTUAL_NEUTRALIZATION",
] as const;

export interface TreeChildRef {
  kind: "node" | "terminal";
  id: string;
}

export interface TreeNodeSpec {
  id: string;
  /** Two outgoing branches; the participant labels each YES or NO. */
  children: readonly [TreeChildRef, TreeChildRef];
}

/**
 * Structural skeleton: 5 binary decision points and 6 terminals. Only the
 * wiring is fixed — which condition sits on a node and which branch is YES
 * is entirely the participant's choice.
 */
export const DECISION_TREE_SHAPE: readonly TreeNodeSpec[] = [
  {
    id: "N1",
    children: [
      { kind: "node", id: "N2" },
      { kind: "node", id: "N3" },
    ],
  },
  {
    id: "N2",
    children: [
      { kind: "terminal", id: "T1" },
      { kind: "terminal", id: "T2" },
    ],
  },
  {
    id: "N3",
    children: [
      { kind: "terminal", id: "T3" },
      { kind: "node", id: "N4" },
    ],
  },
  {
    id: "N4",
    children: [
      { kind: "node", id: "N5" },
      { kind: "terminal", id: "T4" },
    ],
  },
  {
    id: "N5",
    children: [
      { kind: "terminal", id: "T5" },
      { kind: "terminal", id: "T6" },
    ],
  },
] as const;

export const TREE_ROOT_ID = "N1";

export const DECISION_NODE_IDS: readonly string[] = DECISION_TREE_SHAPE.map(
  (node) => node.id,
);

export const TERMINAL_IDS: readonly string[] = DECISION_TREE_SHAPE.flatMap((node) =>
  node.children.filter((child) => child.kind === "terminal").map((child) => child.id),
);

export function getTreeNodeSpec(nodeId: string): TreeNodeSpec {
  const spec = DECISION_TREE_SHAPE.find((node) => node.id === nodeId);
  if (!spec) throw new Error(`Unknown decision node: ${nodeId}`);
  return spec;
}

/** Branch ids are `<nodeId>-A` / `<nodeId>-B` for the two children in order. */
export function branchId(nodeId: string, childIndex: 0 | 1): string {
  return `${nodeId}-${childIndex === 0 ? "A" : "B"}`;
}

export function siblingBranchId(id: string): string {
  return id.endsWith("-A") ? `${id.slice(0, -2)}-B` : `${id.slice(0, -2)}-A`;
}

export function isKnownBranchId(id: string): boolean {
  return DECISION_TREE_SHAPE.some(
    (node) => branchId(node.id, 0) === id || branchId(node.id, 1) === id,
  );
}

export function createEmptyDecisionTree(): DecisionTreeState {
  const nodes: DecisionTreeState["nodes"] = {};
  const branches: DecisionTreeState["branches"] = {};
  const terminals: DecisionTreeState["terminals"] = {};
  for (const node of DECISION_TREE_SHAPE) {
    nodes[node.id] = null;
    branches[branchId(node.id, 0)] = null;
    branches[branchId(node.id, 1)] = null;
    for (const child of node.children) {
      if (child.kind === "terminal") terminals[child.id] = null;
    }
  }
  return { nodes, branches, terminals };
}

/* ------------------------------ affinity map ----------------------------- */

/** Display order around the circle: top, right, bottom, left. */
export const AFFINITY_ORDER: readonly Affinity[] = [
  "EMBER",
  "GROVE",
  "GALE",
  "TIDE",
] as const;

export interface AffinityPairSpec {
  id: string;
  first: Affinity;
  second: Affinity;
}

/** All six unordered pairs; the participant assigns a relation to each. */
export const AFFINITY_PAIRS: readonly AffinityPairSpec[] = [
  { id: "EMBER-GROVE", first: "EMBER", second: "GROVE" },
  { id: "EMBER-GALE", first: "EMBER", second: "GALE" },
  { id: "EMBER-TIDE", first: "EMBER", second: "TIDE" },
  { id: "GROVE-GALE", first: "GROVE", second: "GALE" },
  { id: "GROVE-TIDE", first: "GROVE", second: "TIDE" },
  { id: "GALE-TIDE", first: "GALE", second: "TIDE" },
] as const;

export function getAffinityPairSpec(pairId: string): AffinityPairSpec {
  const pair = AFFINITY_PAIRS.find((entry) => entry.id === pairId);
  if (!pair) throw new Error(`Unknown affinity pair: ${pairId}`);
  return pair;
}

export function createEmptyAffinityMap(): AffinityMapState {
  const relations: AffinityMapState["relations"] = {};
  for (const pair of AFFINITY_PAIRS) {
    relations[pair.id] = "UNSET";
  }
  return { relations };
}
