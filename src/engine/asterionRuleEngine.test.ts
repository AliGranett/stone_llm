import { describe, expect, it } from "vitest";
import type { Affinity, Charge, Stone, Strength } from "../types";
import { evaluateExperiment } from "./asterionRuleEngine";

let counter = 0;
function stone(
  affinity: Affinity,
  strength: Strength,
  charge: Charge,
): Stone {
  counter += 1;
  return { id: `TEST-${counter}`, affinity, strength, charge };
}

describe("asterionRuleEngine", () => {
  it("same charge and equal strength produces a stalemate", () => {
    const result = evaluateExperiment(
      stone("TIDE", 2, "POSITIVE"),
      stone("EMBER", 2, "POSITIVE"),
    );
    expect(result.outcome).toBe("STALEMATE");
    expect(result.winningStoneId).toBeNull();
    expect(result.appliedRule).toBe("SAME_CHARGE_STALEMATE");
  });

  it("same charge and unequal strength produces a strength-based winner", () => {
    const weak = stone("TIDE", 1, "NEGATIVE");
    const strong = stone("GROVE", 3, "NEGATIVE");
    const result = evaluateExperiment(weak, strong);
    expect(result.outcome).toBe("STONE_B_WINS");
    expect(result.winningStoneId).toBe(strong.id);
    expect(result.appliedRule).toBe("SAME_CHARGE_STRENGTH");
  });

  it("opposite charge and same affinity produces mutual neutralization", () => {
    const result = evaluateExperiment(
      stone("EMBER", 1, "POSITIVE"),
      stone("EMBER", 3, "NEGATIVE"),
    );
    expect(result.outcome).toBe("MUTUAL_NEUTRALIZATION");
    expect(result.winningStoneId).toBeNull();
    expect(result.appliedRule).toBe("SAME_AFFINITY_NEUTRALIZATION");
  });

  it("Water vs Earth (neutral pair) is decided by strength", () => {
    const tide = stone("TIDE", 3, "POSITIVE");
    const grove = stone("GROVE", 1, "NEGATIVE");
    const result = evaluateExperiment(tide, grove);
    expect(result.outcome).toBe("STONE_A_WINS");
    expect(result.winningStoneId).toBe(tide.id);
    expect(result.appliedRule).toBe("NEUTRAL_PAIR_STRENGTH");

    const equal = evaluateExperiment(
      stone("TIDE", 2, "POSITIVE"),
      stone("GROVE", 2, "NEGATIVE"),
    );
    expect(equal.outcome).toBe("STALEMATE");
    expect(equal.appliedRule).toBe("NEUTRAL_PAIR_STALEMATE");
  });

  it("Fire vs Wind (neutral pair) is decided by strength", () => {
    const gale = stone("GALE", 3, "NEGATIVE");
    const ember = stone("EMBER", 1, "POSITIVE");
    const result = evaluateExperiment(ember, gale);
    expect(result.outcome).toBe("STONE_B_WINS");
    expect(result.winningStoneId).toBe(gale.id);
    expect(result.appliedRule).toBe("NEUTRAL_PAIR_STRENGTH");

    const equal = evaluateExperiment(
      stone("EMBER", 2, "POSITIVE"),
      stone("GALE", 2, "NEGATIVE"),
    );
    expect(equal.outcome).toBe("STALEMATE");
    expect(equal.appliedRule).toBe("NEUTRAL_PAIR_STALEMATE");
  });

  it.each([
    ["EMBER", "GROVE"],
    ["GROVE", "GALE"],
    ["GALE", "TIDE"],
    ["TIDE", "EMBER"],
  ] as Array<[Affinity, Affinity]>)(
    "%s defeats %s via affinity dominance even at lower strength",
    (dominant, defeated) => {
      const weakDominant = stone(dominant, 1, "POSITIVE");
      const strongDefeated = stone(defeated, 3, "NEGATIVE");
      const result = evaluateExperiment(weakDominant, strongDefeated);
      expect(result.outcome).toBe("STONE_A_WINS");
      expect(result.winningStoneId).toBe(weakDominant.id);
      expect(result.appliedRule).toBe("AFFINITY_DOMINANCE");
    },
  );

  it("reversing Stone A and Stone B reverses the winner identifier", () => {
    const ember = stone("EMBER", 1, "POSITIVE");
    const grove = stone("GROVE", 3, "NEGATIVE");

    const forward = evaluateExperiment(ember, grove);
    const reversed = evaluateExperiment(grove, ember);

    expect(forward.outcome).toBe("STONE_A_WINS");
    expect(reversed.outcome).toBe("STONE_B_WINS");
    expect(forward.winningStoneId).toBe(ember.id);
    expect(reversed.winningStoneId).toBe(ember.id);
  });
});
