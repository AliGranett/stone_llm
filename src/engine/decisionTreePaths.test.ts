import { describe, expect, it } from "vitest";
import { createEmptyDecisionTree } from "../config/finalModelConfig";
import type { DecisionTreeState } from "../types";
import {
  buildTreePathLabels,
  formatPathLabel,
  pathSegmentFor,
} from "./decisionTreePaths";

function withTree(patch: {
  nodes?: DecisionTreeState["nodes"];
  branches?: DecisionTreeState["branches"];
  terminals?: DecisionTreeState["terminals"];
}): DecisionTreeState {
  const empty = createEmptyDecisionTree();
  return {
    nodes: { ...empty.nodes, ...patch.nodes },
    branches: { ...empty.branches, ...patch.branches },
    terminals: { ...empty.terminals, ...patch.terminals },
  };
}

describe("pathSegmentFor", () => {
  it("maps YES/NO to linguistic opposites of each condition card", () => {
    expect(pathSegmentFor("SAME_CHARGE", "YES")).toBe("SAME_CHARGE");
    expect(pathSegmentFor("SAME_CHARGE", "NO")).toBe("DIFFERENT_CHARGE");
    expect(pathSegmentFor("SAME_STRENGTH", "YES")).toBe("SAME_STRENGTH");
    expect(pathSegmentFor("SAME_STRENGTH", "NO")).toBe("DIFFERENT_STRENGTH");
    expect(pathSegmentFor("SAME_AFFINITY", "YES")).toBe("SAME_AFFINITY");
    expect(pathSegmentFor("SAME_AFFINITY", "NO")).toBe("DIFFERENT_AFFINITY");
    expect(pathSegmentFor("NEUTRAL_AFFINITY_PAIR", "YES")).toBe("NEUTRAL_AFFINITY_PAIR");
    expect(pathSegmentFor("NEUTRAL_AFFINITY_PAIR", "NO")).toBe(
      "NON_NEUTRAL_AFFINITY_PAIR",
    );
  });
});

describe("buildTreePathLabels", () => {
  it("returns empty paths when the tree is empty", () => {
    const labels = buildTreePathLabels(createEmptyDecisionTree());
    expect(labels.nodes.N1).toEqual([]);
    expect(labels.terminals.T1).toEqual([]);
    expect(labels.branches["N1-A"]).toBeNull();
  });

  it("generates branch meanings and accumulated terminal paths from participant choices", () => {
    const labels = buildTreePathLabels(
      withTree({
        nodes: {
          N1: "SAME_CHARGE",
          N2: "SAME_STRENGTH",
          N3: "SAME_AFFINITY",
          N4: "NEUTRAL_AFFINITY_PAIR",
        },
        branches: {
          "N1-A": "YES",
          "N1-B": "NO",
          "N2-A": "YES",
          "N2-B": "NO",
          "N3-A": "YES",
          "N3-B": "NO",
          "N4-A": "YES",
          "N4-B": "NO",
        },
      }),
    );

    expect(labels.branches["N1-A"]).toBe("SAME_CHARGE");
    expect(labels.branches["N1-B"]).toBe("DIFFERENT_CHARGE");
    expect(labels.nodes.N2).toEqual(["SAME_CHARGE"]);
    expect(labels.nodes.N3).toEqual(["DIFFERENT_CHARGE"]);
    expect(labels.terminals.T1).toEqual(["SAME_CHARGE", "SAME_STRENGTH"]);
    expect(labels.terminals.T2).toEqual(["SAME_CHARGE", "DIFFERENT_STRENGTH"]);
    expect(labels.terminals.T3).toEqual(["DIFFERENT_CHARGE", "SAME_AFFINITY"]);
    expect(labels.nodes.N4).toEqual(["DIFFERENT_CHARGE", "DIFFERENT_AFFINITY"]);
    expect(labels.terminals.T5).toEqual([
      "DIFFERENT_CHARGE",
      "DIFFERENT_AFFINITY",
      "NEUTRAL_AFFINITY_PAIR",
    ]);
    expect(labels.terminals.T4).toEqual([
      "DIFFERENT_CHARGE",
      "DIFFERENT_AFFINITY",
      "NON_NEUTRAL_AFFINITY_PAIR",
    ]);
  });

  it("updates descendant paths when YES/NO branches are reversed", () => {
    const base = withTree({
      nodes: {
        N1: "SAME_CHARGE",
        N2: "SAME_STRENGTH",
        N3: "SAME_AFFINITY",
      },
      branches: {
        "N1-A": "YES",
        "N1-B": "NO",
        "N2-A": "YES",
        "N2-B": "NO",
        "N3-A": "YES",
        "N3-B": "NO",
      },
    });
    const before = buildTreePathLabels(base);
    expect(before.terminals.T1).toEqual(["SAME_CHARGE", "SAME_STRENGTH"]);
    expect(before.terminals.T3).toEqual(["DIFFERENT_CHARGE", "SAME_AFFINITY"]);

    const reversed = withTree({
      nodes: base.nodes,
      branches: {
        ...base.branches,
        "N1-A": "NO",
        "N1-B": "YES",
      },
    });
    const after = buildTreePathLabels(reversed);
    expect(after.branches["N1-A"]).toBe("DIFFERENT_CHARGE");
    expect(after.branches["N1-B"]).toBe("SAME_CHARGE");
    expect(after.nodes.N2).toEqual(["DIFFERENT_CHARGE"]);
    expect(after.nodes.N3).toEqual(["SAME_CHARGE"]);
    expect(after.terminals.T1).toEqual(["DIFFERENT_CHARGE", "SAME_STRENGTH"]);
    expect(after.terminals.T3).toEqual(["SAME_CHARGE", "SAME_AFFINITY"]);
  });

  it("updates descendant labels when an ancestor condition changes", () => {
    const before = buildTreePathLabels(
      withTree({
        nodes: { N1: "SAME_CHARGE", N2: "SAME_STRENGTH" },
        branches: {
          "N1-A": "YES",
          "N1-B": "NO",
          "N2-A": "YES",
          "N2-B": "NO",
        },
      }),
    );
    expect(before.terminals.T1).toEqual(["SAME_CHARGE", "SAME_STRENGTH"]);

    const after = buildTreePathLabels(
      withTree({
        nodes: { N1: "SAME_AFFINITY", N2: "SAME_STRENGTH" },
        branches: {
          "N1-A": "YES",
          "N1-B": "NO",
          "N2-A": "YES",
          "N2-B": "NO",
        },
      }),
    );
    expect(after.branches["N1-A"]).toBe("SAME_AFFINITY");
    expect(after.terminals.T1).toEqual(["SAME_AFFINITY", "SAME_STRENGTH"]);
    expect(after.terminals.T2).toEqual(["SAME_AFFINITY", "DIFFERENT_STRENGTH"]);
  });

  it("allows incomplete or incorrect trees without inventing hidden cases", () => {
    const labels = buildTreePathLabels(
      withTree({
        // Participant placed an unusual / incomplete configuration.
        nodes: { N1: "NEUTRAL_AFFINITY_PAIR", N2: "SAME_CHARGE" },
        branches: {
          "N1-A": "YES",
          "N1-B": "NO",
          // N2 branches unlabeled — child paths stop accumulating.
        },
      }),
    );
    expect(labels.nodes.N2).toEqual(["NEUTRAL_AFFINITY_PAIR"]);
    expect(labels.terminals.T1).toEqual(["NEUTRAL_AFFINITY_PAIR"]);
    expect(labels.branches["N2-A"]).toBeNull();
    // No dominance-cycle or answer-key vocabulary appears as segment ids.
    const allSegments = [
      ...labels.nodes.N2,
      ...labels.terminals.T1,
      ...labels.terminals.T3,
    ];
    expect(allSegments.join(" ")).not.toMatch(/EMBER|GROVE|DOMINANCE|HIDDEN/i);
  });

  it("formats translated path labels with arrows", () => {
    const text = formatPathLabel(
      ["DIFFERENT_CHARGE", "SAME_AFFINITY"],
      {
        SAME_CHARGE: "Same charge",
        DIFFERENT_CHARGE: "Different charge",
        SAME_STRENGTH: "Same strength",
        DIFFERENT_STRENGTH: "Different strength",
        SAME_AFFINITY: "Same affinity",
        DIFFERENT_AFFINITY: "Different affinity",
        NEUTRAL_AFFINITY_PAIR: "Neutral affinity pair",
        NON_NEUTRAL_AFFINITY_PAIR: "Non-neutral affinity pair",
      },
    );
    expect(text).toBe("Different charge → Same affinity");
  });
});
