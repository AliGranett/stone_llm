import { describe, expect, it } from "vitest";
import { createCorrectDecisionTree } from "../config/correctDecisionTree";
import { createEmptyDecisionTree } from "../config/finalModelConfig";
import { getStoneById } from "../config/stoneSet";
import type { ExperimentRecord } from "../types";
import {
  scoreDecisionTreeAccuracy,
  scoreExperimentConsistency,
} from "./finalReportScoring";

function makeRecord(
  overrides: Partial<ExperimentRecord> & Pick<ExperimentRecord, "id">,
): ExperimentRecord {
  const stoneA = getStoneById("T-01")!;
  const stoneB = getStoneById("T-03")!;
  return {
    experimentNumber: 1,
    phase: "ASSISTED",
    round: 1,
    roundExperimentNumber: 1,
    globalExperimentNumber: 1,
    startedAt: "2026-01-01T10:00:00.000Z",
    completedAt: "2026-01-01T10:01:00.000Z",
    stoneA,
    stoneB,
    prediction: "STONE_A_WINS",
    mostImportantProperty: "STRENGTH",
    notes: "",
    evaluation: {
      outcome: "STONE_B_WINS",
      winningStoneId: "T-03",
      appliedRule: "SAME_CHARGE_STRENGTH",
      internalExplanation: "hidden",
    },
    reflection: {
      evidenceAssessment: "SUPPORTED",
      observation: "",
      revisedHypothesis: "",
      hypothesisUnchanged: true,
    },
    ...overrides,
  };
}

describe("scoreDecisionTreeAccuracy", () => {
  it("scores a perfect tree as fully correct", () => {
    const score = scoreDecisionTreeAccuracy(createCorrectDecisionTree());
    expect(score.nodes).toEqual({ correct: 5, total: 5 });
    expect(score.branches).toEqual({ correct: 10, total: 10 });
    expect(score.terminals).toEqual({ correct: 6, total: 6 });
    expect(score.allSlots).toEqual({ correct: 21, total: 21 });
  });

  it("scores an empty tree as zero correct", () => {
    const score = scoreDecisionTreeAccuracy(createEmptyDecisionTree());
    expect(score.nodes.correct).toBe(0);
    expect(score.branches.correct).toBe(0);
    expect(score.terminals.correct).toBe(0);
    expect(score.allSlots.correct).toBe(0);
  });

  it("counts only exact matches for nodes, branches, and terminals", () => {
    const tree = createCorrectDecisionTree();
    tree.nodes.N1 = "SAME_STRENGTH"; // wrong condition
    tree.branches["N1-A"] = "NO"; // swapped
    tree.branches["N1-B"] = "YES";
    tree.terminals.T1 = "STRONGER_CRYSTAL_WINS"; // wrong terminal

    const score = scoreDecisionTreeAccuracy(tree);
    expect(score.nodes.correct).toBe(4);
    expect(score.branches.correct).toBe(8);
    expect(score.terminals.correct).toBe(5);
  });
});

describe("scoreExperimentConsistency", () => {
  it("counts match / mismatch / unevaluable against the final tree", () => {
    const tree = createCorrectDecisionTree();
    const matching = makeRecord({ id: "m1" }); // T-01 vs T-03 → stronger B wins
    const mismatching = makeRecord({
      id: "m2",
      evaluation: {
        outcome: "STALEMATE",
        winningStoneId: null,
        appliedRule: "SAME_CHARGE_STALEMATE",
        internalExplanation: "hidden",
      },
    });
    const report = scoreExperimentConsistency(tree, [matching, mismatching]);
    expect(report).toEqual({
      total: 2,
      match: 1,
      mismatch: 1,
      unevaluable: 0,
    });
  });

  it("marks incomplete trees as unevaluable for experiments", () => {
    const report = scoreExperimentConsistency(createEmptyDecisionTree(), [
      makeRecord({ id: "u1" }),
    ]);
    expect(report.unevaluable).toBe(1);
    expect(report.match).toBe(0);
  });
});
