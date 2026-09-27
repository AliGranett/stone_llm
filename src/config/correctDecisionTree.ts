import { createEmptyDecisionTree } from "./finalModelConfig";
import type { DecisionTreeState } from "../types";

/**
 * Canonical correct decision tree for research scoring ONLY.
 *
 * Never render this to participants or send it to the Research Partner.
 * Branch convention: for each node, child A = YES and child B = NO, matching
 * the fixed shape in DECISION_TREE_SHAPE and the hidden rule order:
 * same charge → (same strength?) ; else same affinity → neutralize ;
 * else neutral pair → (same strength?) ; else dominant affinity wins.
 */
export function createCorrectDecisionTree(): DecisionTreeState {
  const tree = createEmptyDecisionTree();

  tree.nodes.N1 = "SAME_CHARGE";
  tree.branches["N1-A"] = "YES";
  tree.branches["N1-B"] = "NO";

  tree.nodes.N2 = "SAME_STRENGTH";
  tree.branches["N2-A"] = "YES";
  tree.branches["N2-B"] = "NO";
  tree.terminals.T1 = "STALEMATE";
  tree.terminals.T2 = "STRONGER_CRYSTAL_WINS";

  tree.nodes.N3 = "SAME_AFFINITY";
  tree.branches["N3-A"] = "YES";
  tree.branches["N3-B"] = "NO";
  tree.terminals.T3 = "MUTUAL_NEUTRALIZATION";

  tree.nodes.N4 = "NEUTRAL_AFFINITY_PAIR";
  tree.branches["N4-A"] = "YES";
  tree.branches["N4-B"] = "NO";
  tree.terminals.T4 = "DOMINANT_AFFINITY_WINS";

  tree.nodes.N5 = "SAME_STRENGTH";
  tree.branches["N5-A"] = "YES";
  tree.branches["N5-B"] = "NO";
  tree.terminals.T5 = "STALEMATE";
  tree.terminals.T6 = "STRONGER_CRYSTAL_WINS";

  return tree;
}
