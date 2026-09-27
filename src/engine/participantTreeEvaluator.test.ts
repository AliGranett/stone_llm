import { describe, expect, it } from "vitest";
import { createEmptyDecisionTree } from "../config/finalModelConfig";
import type { DecisionTreeState, Stone } from "../types";
import {
  affinityDominates,
  assessExperimentAgainstTree,
  predictWithParticipantTree,
} from "./participantTreeEvaluator";

const tidePos1: Stone = {
  id: "T-01",
  affinity: "TIDE",
  strength: 1,
  charge: "POSITIVE",
};
const tidePos3: Stone = {
  id: "T-03",
  affinity: "TIDE",
  strength: 3,
  charge: "POSITIVE",
};
const tideNeg2: Stone = {
  id: "T-02",
  affinity: "TIDE",
  strength: 2,
  charge: "NEGATIVE",
};
const emberPos2: Stone = {
  id: "E-01",
  affinity: "EMBER",
  strength: 2,
  charge: "POSITIVE",
};
const groveNeg2: Stone = {
  id: "V-02",
  affinity: "GROVE",
  strength: 2,
  charge: "NEGATIVE",
};
const galeNeg1: Stone = {
  id: "G-01",
  affinity: "GALE",
  strength: 1,
  charge: "NEGATIVE",
};

/** Minimal filled tree: same charge? → strength; else same affinity? → neutralize / dominate. */
function sampleTree(): DecisionTreeState {
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
  tree.nodes.N5 = "SAME_STRENGTH";
  tree.branches["N5-A"] = "YES";
  tree.branches["N5-B"] = "NO";
  tree.terminals.T4 = "DOMINANT_AFFINITY_WINS";
  tree.terminals.T5 = "STALEMATE";
  tree.terminals.T6 = "STRONGER_CRYSTAL_WINS";
  return tree;
}

describe("affinityDominates", () => {
  it("follows Fire → Earth → Wind → Water → Fire", () => {
    expect(affinityDominates("EMBER", "GROVE")).toBe(true);
    expect(affinityDominates("GROVE", "GALE")).toBe(true);
    expect(affinityDominates("GALE", "TIDE")).toBe(true);
    expect(affinityDominates("TIDE", "EMBER")).toBe(true);
    expect(affinityDominates("GROVE", "EMBER")).toBe(false);
  });
});

describe("predictWithParticipantTree", () => {
  it("predicts stronger wins for same-charge unequal strength", () => {
    const result = predictWithParticipantTree(sampleTree(), tidePos1, tidePos3);
    expect(result.predictedOutcome).toBe("STONE_B_WINS");
    expect(result.terminalOutcome).toBe("STRONGER_CRYSTAL_WINS");
  });

  it("predicts stalemate for same-charge equal strength", () => {
    const grovePos2: Stone = {
      id: "V-01",
      affinity: "GROVE",
      strength: 2,
      charge: "POSITIVE",
    };
    const result = predictWithParticipantTree(sampleTree(), emberPos2, grovePos2);
    expect(result.predictedOutcome).toBe("STALEMATE");
  });

  it("predicts mutual neutralization for opposite charge same affinity", () => {
    const result = predictWithParticipantTree(sampleTree(), tidePos1, tideNeg2);
    expect(result.predictedOutcome).toBe("MUTUAL_NEUTRALIZATION");
  });

  it("predicts dominant affinity win for opposite charge non-neutral pair", () => {
    // Fire POS vs Earth NEG — different charge, different affinity, non-neutral
    const result = predictWithParticipantTree(sampleTree(), emberPos2, groveNeg2);
    expect(result.predictedOutcome).toBe("STONE_A_WINS");
    expect(result.terminalOutcome).toBe("DOMINANT_AFFINITY_WINS");
  });

  it("uses strength on opposite-charge neutral pairs", () => {
    // Fire POS 2 vs Wind NEG 1 — neutral pair → N5 → different strength → stronger
    const result = predictWithParticipantTree(sampleTree(), emberPos2, galeNeg1);
    expect(result.predictedOutcome).toBe("STONE_A_WINS");
    expect(result.terminalOutcome).toBe("STRONGER_CRYSTAL_WINS");
  });

  it("returns UNEVALUABLE for an incomplete tree", () => {
    const empty = createEmptyDecisionTree();
    const result = predictWithParticipantTree(empty, tidePos1, tidePos3);
    expect(result.predictedOutcome).toBeNull();
    expect(result.unevaluableReason).toMatch(/Missing condition/);
  });
});

describe("assessExperimentAgainstTree", () => {
  it("marks MATCH when tree agrees with the observed outcome", () => {
    const result = assessExperimentAgainstTree(
      sampleTree(),
      tidePos1,
      tidePos3,
      "STONE_B_WINS",
    );
    expect(result.status).toBe("MATCH");
  });

  it("marks MISMATCH when tree disagrees", () => {
    const result = assessExperimentAgainstTree(
      sampleTree(),
      tidePos1,
      tidePos3,
      "STALEMATE",
    );
    expect(result.status).toBe("MISMATCH");
  });
});
