import { describe, expect, it } from "vitest";
import { buildStudyContext } from "./contextBuilder";
import type { ResearchPartnerApiRequest, WireExperiment } from "./types";
import { validateRequest } from "./validation";

const t01 = {
  id: "T-01",
  affinity: "TIDE",
  strength: 1,
  charge: "POSITIVE",
};
const t03 = {
  id: "T-03",
  affinity: "TIDE",
  strength: 3,
  charge: "POSITIVE",
};
const g02 = {
  id: "G-02",
  affinity: "GALE",
  strength: 2,
  charge: "POSITIVE",
};
const g03 = {
  id: "G-03",
  affinity: "GALE",
  strength: 3,
  charge: "POSITIVE",
};

function completedExperiment(
  overrides: Partial<WireExperiment> &
    Pick<WireExperiment, "experimentNumber" | "stoneA" | "stoneB" | "outcome">,
): WireExperiment {
  return {
    round: 1,
    roundExperimentNumber: overrides.experimentNumber,
    prediction: "STONE_A_WINS",
    winningStoneId: null,
    predictionMatched: true,
    hypothesis: "",
    justification: "",
    mostImportantProperty: "",
    notes: "",
    evidenceAssessment: "SUPPORTED",
    observation: "Noted.",
    revisedHypothesis: "",
    reflectionStatus: "COMPLETE",
    ...overrides,
  };
}

function baseRequest(
  overrides: Partial<ResearchPartnerApiRequest> = {},
): ResearchPartnerApiRequest {
  return {
    participantId: "P-123",
    sessionId: "S-123",
    experimentId: null,
    llmMode: "ANALYTICAL",
    participantMessage: "What should I try next?",
    studyPhase: "ASSISTED",
    experimentsRemaining: 2,
    currentHypothesis: "STRENGTH",
    currentMostImportantProperty: "STRENGTH",
    currentNotes: "",
    selectedStones: { stoneA: null, stoneB: null },
    availableStones: [t01, t03, g02, g03],
    experimentHistory: [],
    conversationHistory: [],
    ...overrides,
  };
}

/** The exact scenario from the bug report, immediately after Experiment 2. */
function afterExperiment2Scenario(
  reflectionStatus: WireExperiment["reflectionStatus"] = "AWAITING_REFLECTION",
): ResearchPartnerApiRequest {
  const exp1 = completedExperiment({
    experimentNumber: 1,
    roundExperimentNumber: 1,
    stoneA: t03,
    stoneB: t01,
    prediction: "STONE_A_WINS",
    outcome: "STONE_A_WINS",
    winningStoneId: "T-03",
    predictionMatched: true,
    mostImportantProperty: "STRENGTH",
    notes: "Same affinity, different strength.",
    hypothesis: "STRENGTH",
    justification: "Same affinity, different strength.",
    evidenceAssessment: "SUPPORTED",
    observation: "T-03 beat T-01.",
    revisedHypothesis: "",
    reflectionStatus: "COMPLETE",
  });
  const exp2 = completedExperiment({
    experimentNumber: 2,
    roundExperimentNumber: 2,
    stoneA: g03,
    stoneB: g02,
    prediction: "STONE_A_WINS",
    outcome: "STONE_A_WINS",
    winningStoneId: "G-03",
    predictionMatched: true,
    mostImportantProperty: "STRENGTH",
    notes: "Same charge, Wind vs Wind.",
    hypothesis: "STRENGTH",
    justification: "Same charge, Wind vs Wind.",
    evidenceAssessment: reflectionStatus === "COMPLETE" ? "SUPPORTED" : "",
    observation: reflectionStatus === "COMPLETE" ? "G-03 beat G-02." : "",
    revisedHypothesis: "",
    reflectionStatus,
  });
  return baseRequest({
    experimentsRemaining: 2,
    experimentHistory: [exp1, exp2],
    // Critical: after RUN_EXPERIMENT the UI may still show G-03/G-02 selected,
    // but the wire request must clear current selection so the model does not
    // treat a completed pair as upcoming.
    selectedStones: { stoneA: null, stoneB: null },
    currentMostImportantProperty: "STRENGTH",
    currentHypothesis: "STRENGTH",
  });
}

describe("buildStudyContext", () => {
  it("includes Experiment 1 result after completion", () => {
    const context = buildStudyContext(
      baseRequest({
        experimentHistory: [
          completedExperiment({
            experimentNumber: 1,
            stoneA: t03,
            stoneB: t01,
            outcome: "STONE_A_WINS",
            winningStoneId: "T-03",
            mostImportantProperty: "STRENGTH",
            notes: "",
            hypothesis: "STRENGTH",
            observation: "T-03 won.",
          }),
        ],
      }),
    );
    expect(context).toContain("Experiment 1");
    expect(context).toContain("T-03");
    expect(context).toContain("T-01");
    expect(context).toContain("Water (T-03)");
    expect(context).toContain("Observed result: Stone A wins");
    expect(context).toContain("winning stone: T-03");
    expect(context).toContain("COMPLETED EXPERIMENTS");
  });

  it("includes Experiment 2 result immediately after Experiment 2 completion", () => {
    const context = buildStudyContext(afterExperiment2Scenario());
    expect(context).toContain("Experiment 1");
    expect(context).toContain("Experiment 2");
    expect(context).toContain("G-03");
    expect(context).toContain("G-02");
    expect(context).toContain("winning stone: G-03");
    expect(context).toContain("Status: COMPLETED");
  });

  it("lists multiple completed experiments in chronological order", () => {
    const context = buildStudyContext(afterExperiment2Scenario("COMPLETE"));
    const idx1 = context.indexOf("Experiment 1");
    const idx2 = context.indexOf("Experiment 2");
    expect(idx1).toBeGreaterThan(-1);
    expect(idx2).toBeGreaterThan(idx1);
  });

  it("does not represent a completed experiment as the current/upcoming pair", () => {
    const context = buildStudyContext(afterExperiment2Scenario());
    expect(context).toContain("COMPLETED EXPERIMENTS");
    expect(context).toContain("Experiment 2");
    expect(context).toContain("CURRENT EXPERIMENT: none");
    // Isolate the CURRENT EXPERIMENT section itself (not the intro that mentions it).
    const marker = "CURRENT EXPERIMENT: none";
    const currentSection = context.slice(context.lastIndexOf(marker));
    expect(currentSection).toMatch(/^CURRENT EXPERIMENT: none/);
    expect(currentSection).not.toMatch(/G-03|G-02/);
  });

  it("represents a selected pair as CURRENT only before it has been run", () => {
    const context = buildStudyContext(
      baseRequest({
        experimentHistory: [
          completedExperiment({
            experimentNumber: 1,
            stoneA: t03,
            stoneB: t01,
            outcome: "STONE_A_WINS",
            winningStoneId: "T-03",
          }),
        ],
        selectedStones: { stoneA: g03, stoneB: g02 },
      }),
    );
    expect(context).toContain(
      "CURRENT EXPERIMENT (being prepared; NOT yet run — no observed result yet):",
    );
    expect(context).toContain("G-03");
    expect(context).toContain("G-02");
    // Experiment 1 remains completed, not current.
    expect(context).toContain("Experiment 1");
    expect(context).toContain("COMPLETED EXPERIMENTS");
  });

  it("marks a result-revealed pending reflection as completed evidence", () => {
    const context = buildStudyContext(afterExperiment2Scenario("AWAITING_REFLECTION"));
    expect(context).toContain("Experiment 2");
    expect(context).toContain("awaiting participant reflection");
    expect(context).toContain("Observed result: Stone A wins");
    expect(context).toContain("winning stone: G-03");
  });

  it("includes predictionMatched and round metadata", () => {
    const context = buildStudyContext(afterExperiment2Scenario("COMPLETE"));
    expect(context).toContain("Assisted round 1");
    expect(context).toContain("Prediction matched observed result: yes");
  });

  it("excludes hidden rule-engine metadata even when a client sends it", () => {
    const contaminated = {
      ...afterExperiment2Scenario("COMPLETE"),
      experimentHistory: [
        {
          ...afterExperiment2Scenario("COMPLETE").experimentHistory[0],
          appliedRule: "SAME_CHARGE_STRENGTH",
          internalExplanation: "T-03 is stronger than T-01.",
          evaluation: {
            appliedRule: "SAME_CHARGE_STRENGTH",
            internalExplanation: "hidden",
          },
        },
      ],
    };

    const validated = validateRequest(contaminated);
    expect(validated.ok).toBe(true);

    const context = buildStudyContext(validated.value!);
    expect(context).not.toContain("SAME_CHARGE_STRENGTH");
    expect(context).not.toContain("appliedRule");
    expect(context).not.toContain("internalExplanation");
    expect(context).toContain("Stone A wins");
  });

  it("gives both conditions identical context for identical state", () => {
    const analytical = buildStudyContext(
      afterExperiment2Scenario("COMPLETE") ,
    );
    const hypothesisDriven = buildStudyContext({
      ...afterExperiment2Scenario("COMPLETE"),
      llmMode: "HYPOTHESIS_DRIVEN",
    });
    expect(analytical).toBe(hypothesisDriven);
  });

  it("handles an empty investigation without inventing data", () => {
    const context = buildStudyContext(
      baseRequest({
        experimentHistory: [],
        currentHypothesis: "",
        currentMostImportantProperty: "",
        currentNotes: "",
        selectedStones: { stoneA: null, stoneB: null },
        experimentsRemaining: 4,
      }),
    );
    expect(context).toContain("COMPLETED EXPERIMENTS: none.");
    expect(context).toContain("none recorded yet");
    expect(context).toContain("CURRENT EXPERIMENT: none");
  });

  it("includes structured property choice and notes for the Research Partner", () => {
    const context = buildStudyContext(
      baseRequest({
        currentMostImportantProperty: "AFFINITY",
        currentNotes: "Try same affinity next",
        experimentHistory: [
          completedExperiment({
            experimentNumber: 1,
            stoneA: t03,
            stoneB: t01,
            outcome: "STONE_A_WINS",
            winningStoneId: "T-03",
            mostImportantProperty: "STRENGTH",
            notes: "Checking strength",
          }),
        ],
      }),
    );
    expect(context).toContain("Property the participant currently thinks is most important: Affinity");
    expect(context).toContain('Participant\'s current notes: "Try same affinity next"');
    expect(context).toContain("Property they thought most important: Strength");
    expect(context).toContain('Notes: "Checking strength"');
    expect(context).not.toContain("Revised hypothesis");
    expect(context).not.toContain("SAME_CHARGE_STRENGTH");
  });

  it("includes provided affinity relationships as participant-visible background", () => {
    const context = buildStudyContext(baseRequest());
    expect(context).toContain("PROVIDED AFFINITY RELATIONSHIPS");
    expect(context).toContain("Fire → Earth → Wind → Water → Fire");
    expect(context).toContain("Fire ↔ Wind");
    expect(context).toContain("Water ↔ Earth");
    expect(context).toContain("not something they need to discover");
  });

  it("does not expose the hidden decision hierarchy or rule-engine metadata", () => {
    const context = buildStudyContext(afterExperiment2Scenario("COMPLETE"));
    expect(context).toContain("decision hierarchy");
    expect(context).not.toContain("SAME_CHARGE_STRENGTH");
    expect(context).not.toContain("AFFINITY_DOMINANCE");
    expect(context).not.toContain("appliedRule");
    expect(context).not.toContain("internalExplanation");
    expect(context).not.toContain("RULE_CHAIN");
  });

  it("states that completed experiments are authoritative over chat history", () => {
    const context = buildStudyContext(afterExperiment2Scenario());
    expect(context).toContain("authoritative");
  });
});
