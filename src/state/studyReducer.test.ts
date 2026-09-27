import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ASSISTED_ROUNDS,
  FINAL_EXPERIMENT_LIMIT,
  ROUND_EXPERIMENT_LIMIT,
  ROUND_INQUIRY_MAX,
  getStonesForRound,
} from "../config/roundConfig";
import { studyConfig } from "../config/studyConfig";
import { STONE_SET } from "../config/stoneSet";
import {
  canFinishAssistedRound,
  canRunExperiment,
  canSendInquiry,
  canSubmitFinalModel,
  canUseResearchPartner,
  createInitialState,
  getAvailableStones,
  getCurrentRoundExperiments,
  getFinalInvestigationExperiments,
  inquiriesUsedInCurrentRound,
  isBackgroundComplete,
  isDecisionTreeAvailable,
  isReflectionComplete,
  studyReducer,
  type StudyAction,
  type StudyState,
} from "./studyReducer";

function apply(state: StudyState, ...actions: StudyAction[]): StudyState {
  return actions.reduce(studyReducer, state);
}

function completeInstructions(state: StudyState): StudyState {
  return apply(state, { type: "COMPLETE_INSTRUCTIONS" });
}

function startTesting(
  state: StudyState,
  condition: "ANALYTICAL" | "HYPOTHESIS_DRIVEN" = "ANALYTICAL",
): StudyState {
  return completeInstructions(
    apply(state, {
      type: "SELECT_STUDY_MODE",
      mode: "TESTING",
      testingCondition: condition,
    }),
  );
}

function startParticipant(state: StudyState): StudyState {
  const background = apply(state, {
    type: "SELECT_STUDY_MODE",
    mode: "PARTICIPANT",
    condition: "ANALYTICAL",
  });
  return completeInstructions(
    apply(
      background,
      {
        type: "UPDATE_BACKGROUND_DRAFT",
        patch: {
          age: "25",
          educationLevel: "BACHELORS",
          fieldOrOccupation: "Biology",
          llmExperience: "SOMETIMES",
          aiLearningProblemSolvingFrequency: "FREQUENTLY",
          aiProblemSolvingConfidence: 4,
        },
      },
      { type: "SUBMIT_BACKGROUND" },
    ),
  );
}

function completeReflection(state: StudyState): StudyState {
  return apply(
    state,
    {
      type: "UPDATE_REFLECTION_DRAFT",
      patch: {
        evidenceAssessment: "SUPPORTED",
        observation: "The result matched my expectation.",
      },
    },
    { type: "SUBMIT_REFLECTION" },
  );
}

function runFullExperiment(state: StudyState, idA: string, idB: string): StudyState {
  const ready = apply(
    state,
    { type: "CLEAR_SELECTION" },
    { type: "TOGGLE_STONE", stoneId: idA },
    { type: "TOGGLE_STONE", stoneId: idB },
    { type: "SET_PREDICTION", prediction: "STONE_A_WINS" },
    { type: "SET_MOST_IMPORTANT_PROPERTY", value: "STRENGTH" },
    { type: "SET_NOTES", value: "optional note" },
  );
  return completeReflection(apply(ready, { type: "RUN_EXPERIMENT" }));
}

/** Valid within-round stone pairs (all ids are in the round's subset). */
const ROUND_PAIRS: Record<number, Array<[string, string]>> = {
  1: [
    ["T-01", "V-03"],
    ["E-01", "G-02"],
    ["V-01", "T-03"],
    ["G-03", "T-01"],
  ],
  2: [
    ["T-01", "T-02"],
    ["T-03", "T-02"],
    ["V-01", "V-02"],
    ["V-03", "V-02"],
  ],
  3: [
    ["E-01", "G-01"],
    ["E-03", "G-02"],
    ["T-02", "V-01"],
    ["E-01", "V-02"],
  ],
};

const FINAL_PAIRS: Array<[string, string]> = [
  ["T-01", "T-02"],
  ["E-01", "E-02"],
  ["G-01", "G-02"],
  ["V-01", "V-02"],
];

function sendInquiry(state: StudyState, content = "What should I test?"): StudyState {
  const withUser = apply(state, {
    type: "ADD_CHAT_MESSAGE",
    message: {
      id: crypto.randomUUID(),
      role: "PARTICIPANT",
      content,
      timestamp: new Date().toISOString(),
      round: null,
    },
    eventType: "LLM_MESSAGE_SENT",
  });
  return apply(withUser, {
    type: "ADD_CHAT_MESSAGE",
    message: {
      id: crypto.randomUUID(),
      role: "PARTNER",
      content: "Consider isolating one variable.",
      timestamp: new Date().toISOString(),
      round: null,
    },
    eventType: "LLM_RESPONSE_RECEIVED",
  });
}

function sendInquiries(state: StudyState, count: number): StudyState {
  let next = state;
  for (let i = 0; i < count; i += 1) {
    next = sendInquiry(next, `Question ${i + 1}`);
  }
  return next;
}

/** Runs all 4 experiments of the current round. */
function runRoundExperiments(state: StudyState): StudyState {
  const pairs = ROUND_PAIRS[state.currentAssistedRound];
  let next = state;
  for (const [a, b] of pairs) {
    next = runFullExperiment(next, a, b);
  }
  return next;
}

/** Completes the current round (experiments + inquiries) and finishes it. */
function completeRound(state: StudyState, inquiries = 2): StudyState {
  let next = sendInquiries(state, inquiries);
  next = runRoundExperiments(next);
  return apply(next, { type: "FINISH_ASSISTED_ROUND" });
}

function reachFinalInvestigation(state: StudyState): StudyState {
  let next = startTesting(state);
  for (let round = 1; round <= 3; round += 1) {
    next = completeRound(next);
  }
  return next;
}

let initial: StudyState;
beforeEach(() => {
  studyConfig.fixedCondition = "ANALYTICAL";
  initial = createInitialState();
});
afterEach(() => {
  studyConfig.fixedCondition = null;
});

describe("study entry and modes", () => {
  it("starts at ENTRY with no assigned condition", () => {
    expect(initial.phase).toBe("ENTRY");
    expect(initial.studyMode).toBeNull();
    expect(initial.conditionAssigned).toBe(false);
    expect(initial.condition).toBeNull();
  });

  it("Participant Mode moves through BACKGROUND and INSTRUCTIONS to ASSISTED round 1", () => {
    const participant = startParticipant(initial);
    expect(participant.studyMode).toBe("PARTICIPANT");
    expect(participant.phase).toBe("ASSISTED");
    expect(participant.currentAssistedRound).toBe(1);
    expect(participant.conditionAssigned).toBe(true);
    expect(participant.condition).toMatch(/ANALYTICAL|HYPOTHESIS_DRIVEN/);
    expect(participant.background?.age).toBe(25);
    expect(participant.instructionsCompletedAt).not.toBeNull();
  });

  it("requires explicit confirmation to leave INSTRUCTIONS", () => {
    let state = apply(initial, {
      type: "SELECT_STUDY_MODE",
      mode: "PARTICIPANT",
      condition: "ANALYTICAL",
    });
    state = apply(
      state,
      {
        type: "UPDATE_BACKGROUND_DRAFT",
        patch: {
          age: "25",
          educationLevel: "BACHELORS",
          fieldOrOccupation: "Biology",
          llmExperience: "SOMETIMES",
          aiLearningProblemSolvingFrequency: "FREQUENTLY",
          aiProblemSolvingConfidence: 4,
        },
      },
      { type: "SUBMIT_BACKGROUND" },
    );
    expect(state.phase).toBe("INSTRUCTIONS");
    expect(state.instructionsCompletedAt).toBeNull();
    state = apply(state, { type: "COMPLETE_INSTRUCTIONS" });
    expect(state.phase).toBe("ASSISTED");
    expect(state.instructionsCompletedAt).not.toBeNull();
    expect(state.eventLog.some((e) => e.eventType === "INSTRUCTIONS_COMPLETED")).toBe(true);
  });

  it("Testing Mode skips background, shows instructions, then starts round 1", () => {
    const afterEntry = apply(initial, {
      type: "SELECT_STUDY_MODE",
      mode: "TESTING",
      testingCondition: "HYPOTHESIS_DRIVEN",
    });
    expect(afterEntry.phase).toBe("INSTRUCTIONS");
    expect(afterEntry.background).toBeNull();

    const testing = completeInstructions(afterEntry);
    expect(testing.phase).toBe("ASSISTED");
    expect(testing.currentAssistedRound).toBe(1);
    expect(testing.condition).toBe("HYPOTHESIS_DRIVEN");
    expect(
      testing.eventLog.some(
        (e) => e.eventType === "ASSISTED_ROUND_STARTED" && e.payload.round === 1,
      ),
    ).toBe(true);
  });

  it("does not enter Participant Mode without a condition when none is configured", () => {
    studyConfig.fixedCondition = null;
    const state = apply(initial, { type: "SELECT_STUDY_MODE", mode: "PARTICIPANT" });
    expect(state.phase).toBe("ENTRY");
    expect(state.conditionAssigned).toBe(false);
  });

  it("assigns the selected condition when entering Participant Mode", () => {
    studyConfig.fixedCondition = null;
    let state = apply(initial, {
      type: "SELECT_STUDY_MODE",
      mode: "PARTICIPANT",
      condition: "HYPOTHESIS_DRIVEN",
    });
    expect(state.phase).toBe("BACKGROUND");
    expect(state.condition).toBe("HYPOTHESIS_DRIVEN");
    expect(state.conditionAssigned).toBe(true);
  });

  it("continues to instructions after background when condition was chosen at entry", () => {
    studyConfig.fixedCondition = null;
    let state = apply(initial, {
      type: "SELECT_STUDY_MODE",
      mode: "PARTICIPANT",
      condition: "ANALYTICAL",
    });
    state = apply(
      state,
      {
        type: "UPDATE_BACKGROUND_DRAFT",
        patch: {
          age: "25",
          educationLevel: "BACHELORS",
          fieldOrOccupation: "Biology",
          llmExperience: "SOMETIMES",
          aiLearningProblemSolvingFrequency: "FREQUENTLY",
          aiProblemSolvingConfidence: 4,
        },
      },
      { type: "SUBMIT_BACKGROUND" },
    );
    expect(state.phase).toBe("INSTRUCTIONS");
    expect(state.condition).toBe("ANALYTICAL");
    expect(state.conditionAssigned).toBe(true);
  });

  it("does not re-assign condition when background is submitted twice", () => {
    let state = apply(initial, {
      type: "SELECT_STUDY_MODE",
      mode: "PARTICIPANT",
      condition: "ANALYTICAL",
    });
    state = apply(
      state,
      {
        type: "UPDATE_BACKGROUND_DRAFT",
        patch: {
          age: "30",
          educationLevel: "DOCTORATE",
          fieldOrOccupation: "Physics",
          llmExperience: "FREQUENTLY",
          aiLearningProblemSolvingFrequency: "SOMETIMES",
          aiProblemSolvingConfidence: 5,
        },
      },
      { type: "SUBMIT_BACKGROUND" },
    );
    const firstCondition = state.condition;
    state = apply(state, { type: "SUBMIT_BACKGROUND" });
    expect(state.condition).toBe(firstCondition);
  });
});

describe("round flow", () => {
  it("advances Round 1 → 2 → 3 → FINAL_INVESTIGATION → COMPLETE", () => {
    let state = startTesting(initial);

    for (let round = 1; round <= 2; round += 1) {
      expect(state.phase).toBe("ASSISTED");
      expect(state.currentAssistedRound).toBe(round);
      state = completeRound(state);
      expect(state.currentAssistedRound).toBe(round + 1);
    }

    expect(state.currentAssistedRound).toBe(3);
    state = completeRound(state);
    expect(state.phase).toBe("FINAL_INVESTIGATION");
    expect(
      state.eventLog.some((e) => e.eventType === "FINAL_INVESTIGATION_STARTED"),
    ).toBe(true);

    for (const [a, b] of FINAL_PAIRS) {
      state = runFullExperiment(state, a, b);
    }
    state = apply(state, {
      type: "UPDATE_FINAL_MODEL_DRAFT",
      patch: { confidence: 6 },
    });
    state = apply(state, { type: "SUBMIT_FINAL_MODEL" });
    expect(state.phase).toBe("COMPLETE");
  });

  it("has no Round 4 or Round 5 progression", () => {
    let state = startTesting(initial);
    state = completeRound(state);
    state = completeRound(state);
    expect(state.currentAssistedRound).toBe(3);
    state = completeRound(state);
    expect(state.phase).toBe("FINAL_INVESTIGATION");
    expect(state.currentAssistedRound).toBe(3);
    expect(ASSISTED_ROUNDS).toHaveLength(3);
    expect(ASSISTED_ROUNDS.map((r) => r.round)).toEqual([1, 2, 3]);
  });

  it("cannot finish a round before its experiments are done", () => {
    let state = startTesting(initial);
    state = sendInquiries(state, 2);
    state = runFullExperiment(state, "T-01", "V-03");
    expect(canFinishAssistedRound(state)).toBe(false);
    state = apply(state, { type: "FINISH_ASSISTED_ROUND" });
    expect(state.currentAssistedRound).toBe(1);
  });

  it("logs ASSISTED_ROUND_COMPLETED and ASSISTED_ROUND_STARTED on progression", () => {
    let state = startTesting(initial);
    state = completeRound(state);
    const completed = state.eventLog.find(
      (e) => e.eventType === "ASSISTED_ROUND_COMPLETED",
    );
    expect(completed?.payload.round).toBe(1);
    expect(completed?.payload.experimentsCompleted).toBe(4);
    expect(completed?.payload.inquiriesUsed).toBe(2);
    expect(
      state.eventLog.some(
        (e) => e.eventType === "ASSISTED_ROUND_STARTED" && e.payload.round === 2,
      ),
    ).toBe(true);
  });
});

describe("per-round limits", () => {
  it("allows at most 4 experiments per round", () => {
    let state = startTesting(initial);
    state = runRoundExperiments(state);
    expect(getCurrentRoundExperiments(state)).toHaveLength(4);

    const blocked = apply(
      state,
      { type: "TOGGLE_STONE", stoneId: "T-01" },
      { type: "TOGGLE_STONE", stoneId: "V-03" },
      { type: "SET_PREDICTION", prediction: "STALEMATE" },
      { type: "SET_MOST_IMPORTANT_PROPERTY", value: "STRENGTH" },
      { type: "RUN_EXPERIMENT" },
    );
    expect(canRunExperiment(blocked)).toBe(false);
    expect(blocked.pendingExperiment).toBeNull();
    expect(blocked.experiments).toHaveLength(4);
  });

  it("allows at most 4 user inquiries per round and blocks the fifth", () => {
    let state = startTesting(initial);
    state = sendInquiries(state, ROUND_INQUIRY_MAX);
    expect(inquiriesUsedInCurrentRound(state)).toBe(4);
    expect(canSendInquiry(state)).toBe(false);

    const blocked = sendInquiry(state, "One more?");
    expect(inquiriesUsedInCurrentRound(blocked)).toBe(4);
    // The partner itself is still available (e.g. reply to the 4th inquiry).
    expect(canUseResearchPartner(blocked)).toBe(true);
  });

  it("cannot finish a round with fewer than 2 inquiries", () => {
    let state = startTesting(initial);
    state = runRoundExperiments(state);
    expect(canFinishAssistedRound(state)).toBe(false);
    state = apply(state, { type: "FINISH_ASSISTED_ROUND" });
    expect(state.currentAssistedRound).toBe(1);

    state = sendInquiry(state);
    expect(canFinishAssistedRound(state)).toBe(false);

    state = sendInquiry(state);
    expect(canFinishAssistedRound(state)).toBe(true);
  });

  it.each([2, 3, 4])("can finish a round with %i inquiries", (count) => {
    let state = startTesting(initial);
    state = sendInquiries(state, count);
    state = runRoundExperiments(state);
    expect(canFinishAssistedRound(state)).toBe(true);
    state = apply(state, { type: "FINISH_ASSISTED_ROUND" });
    expect(state.currentAssistedRound).toBe(2);
  });

  it("resets experiment and inquiry counters at the next round", () => {
    let state = startTesting(initial);
    state = completeRound(state, 3);
    expect(state.currentAssistedRound).toBe(2);
    expect(getCurrentRoundExperiments(state)).toHaveLength(0);
    expect(inquiriesUsedInCurrentRound(state)).toBe(0);
    expect(canSendInquiry(state)).toBe(true);
    // History is preserved across rounds.
    expect(state.experiments).toHaveLength(4);
    expect(state.chatMessages.length).toBeGreaterThan(0);
  });
});

describe("round-specific stone availability", () => {
  it("exposes each round's configured subset", () => {
    let state = startTesting(initial);
    for (const config of ASSISTED_ROUNDS) {
      state = { ...state, currentAssistedRound: config.round };
      expect(getAvailableStones(state).map((s) => s.id).sort()).toEqual(
        [...config.stoneIds].sort(),
      );
    }
  });

  it("blocks selecting stones outside the current round", () => {
    const state = startTesting(initial);
    // T-02 is negative-charge and not part of round 1.
    expect(getStonesForRound(1).some((s) => s.id === "T-02")).toBe(false);
    const after = apply(state, { type: "TOGGLE_STONE", stoneId: "T-02" });
    expect(after.selectedStoneIds).toEqual({ a: null, b: null });
  });

  it("exposes the full stone set in the final investigation", () => {
    const state = reachFinalInvestigation(initial);
    expect(getAvailableStones(state)).toHaveLength(STONE_SET.length);
  });
});

describe("experiment numbering", () => {
  it("keeps a global sequence while restarting round numbering", () => {
    let state = startTesting(initial);
    state = completeRound(state);
    state = sendInquiries(state, 2);
    state = runFullExperiment(state, "T-01", "T-02");
    state = runFullExperiment(state, "T-03", "T-02");
    state = runFullExperiment(state, "V-01", "V-02");

    const seventh = state.experiments[6];
    expect(seventh.round).toBe(2);
    expect(seventh.roundExperimentNumber).toBe(3);
    expect(seventh.globalExperimentNumber).toBe(7);
    expect(seventh.phase).toBe("ASSISTED");
  });

  it("stamps final-investigation experiments with null round and stage numbering", () => {
    let state = reachFinalInvestigation(initial);
    state = runFullExperiment(state, "T-01", "T-02");
    const record = state.experiments[state.experiments.length - 1];
    expect(record.phase).toBe("FINAL_INVESTIGATION");
    expect(record.round).toBeNull();
    expect(record.roundExperimentNumber).toBe(1);
    expect(record.globalExperimentNumber).toBe(13);
  });
});

describe("LLM availability", () => {
  it("is available during assisted rounds", () => {
    const state = startTesting(initial);
    expect(canUseResearchPartner(state)).toBe(true);
    expect(canSendInquiry(state)).toBe(true);
  });

  it("is read-only in the final investigation: no new messages accepted", () => {
    const state = reachFinalInvestigation(initial);
    expect(canUseResearchPartner(state)).toBe(false);
    expect(canSendInquiry(state)).toBe(false);

    const before = state.chatMessages.length;
    const blocked = sendInquiry(state);
    expect(blocked.chatMessages).toHaveLength(before);
  });

  it("preserves chat history into the final investigation", () => {
    const state = reachFinalInvestigation(initial);
    // 2 inquiries + 2 replies per round × 3 rounds.
    expect(state.chatMessages).toHaveLength(12);
  });

  it("logs each inquiry with round, inquiry number, and experiment position", () => {
    let state = startTesting(initial);
    state = runFullExperiment(state, "T-01", "V-03");
    state = sendInquiry(state);
    const event = state.eventLog.find((e) => e.eventType === "LLM_MESSAGE_SENT");
    expect(event?.payload).toMatchObject({
      round: 1,
      roundInquiryNumber: 1,
      globalInquiryNumber: 1,
      experimentsCompletedInRound: 1,
      totalExperimentsCompleted: 1,
    });
  });

  it("stamps participant messages with the round they were sent in", () => {
    let state = startTesting(initial);
    state = sendInquiry(state);
    expect(state.chatMessages[0].round).toBe(1);
  });
});

describe("decision tree", () => {
  function inFinalStage(): StudyState {
    return apply(startTesting(initial), { type: "DEV_SKIP_TO_FINAL_INVESTIGATION" });
  }

  it("is hidden during Round 1 and available after Round 1 is completed", () => {
    let state = startTesting(initial);
    expect(isDecisionTreeAvailable(state)).toBe(false);
    const blocked = apply(state, {
      type: "SET_TREE_NODE",
      nodeId: "N1",
      condition: "SAME_CHARGE",
    });
    expect(blocked.decisionTree.nodes.N1).toBeNull();

    state = completeRound(state);
    expect(state.currentAssistedRound).toBe(2);
    expect(isDecisionTreeAvailable(state)).toBe(true);
    state = apply(state, {
      type: "SET_TREE_NODE",
      nodeId: "N1",
      condition: "SAME_CHARGE",
    });
    expect(state.decisionTree.nodes.N1).toBe("SAME_CHARGE");
  });

  it("keeps the same tree editable through later assisted rounds into the final stage", () => {
    let state = startTesting(initial);
    state = completeRound(state); // → round 2
    state = apply(state, {
      type: "SET_TREE_NODE",
      nodeId: "N1",
      condition: "SAME_AFFINITY",
    });
    state = completeRound(state); // → 3
    state = completeRound(state); // → 4
    state = completeRound(state); // → 5
    expect(state.decisionTree.nodes.N1).toBe("SAME_AFFINITY");
    expect(isDecisionTreeAvailable(state)).toBe(true);

    state = completeRound(state); // → final
    expect(state.phase).toBe("FINAL_INVESTIGATION");
    expect(state.decisionTree.nodes.N1).toBe("SAME_AFFINITY");
    state = apply(state, {
      type: "SET_TREE_NODE",
      nodeId: "N1",
      condition: "SAME_CHARGE",
    });
    expect(state.decisionTree.nodes.N1).toBe("SAME_CHARGE");
  });

  it("starts empty", () => {
    const state = inFinalStage();
    expect(Object.values(state.decisionTree.nodes).every((v) => v === null)).toBe(true);
    expect(Object.values(state.decisionTree.branches).every((v) => v === null)).toBe(
      true,
    );
    expect(Object.values(state.decisionTree.terminals).every((v) => v === null)).toBe(
      true,
    );
  });

  it("places and clears reusable condition cards, allowing repetition", () => {
    let state = inFinalStage();
    state = apply(
      state,
      { type: "SET_TREE_NODE", nodeId: "N1", condition: "SAME_CHARGE" },
      { type: "SET_TREE_NODE", nodeId: "N2", condition: "SAME_STRENGTH" },
      { type: "SET_TREE_NODE", nodeId: "N5", condition: "SAME_STRENGTH" },
    );
    expect(state.decisionTree.nodes.N1).toBe("SAME_CHARGE");
    expect(state.decisionTree.nodes.N2).toBe("SAME_STRENGTH");
    expect(state.decisionTree.nodes.N5).toBe("SAME_STRENGTH");

    state = apply(state, { type: "SET_TREE_NODE", nodeId: "N1", condition: null });
    expect(state.decisionTree.nodes.N1).toBeNull();
  });

  it("stores YES/NO per branch and keeps siblings complementary", () => {
    let state = inFinalStage();
    state = apply(state, { type: "SET_TREE_BRANCH", branchId: "N1-A", label: "YES" });
    expect(state.decisionTree.branches["N1-A"]).toBe("YES");
    expect(state.decisionTree.branches["N1-B"]).toBe("NO");

    // Reversing is allowed and never auto-corrected back.
    state = apply(state, { type: "SET_TREE_BRANCH", branchId: "N1-A", label: "NO" });
    expect(state.decisionTree.branches["N1-A"]).toBe("NO");
    expect(state.decisionTree.branches["N1-B"]).toBe("YES");
  });

  it("stores terminal outcomes and allows incorrect configurations", () => {
    let state = inFinalStage();
    state = apply(
      state,
      { type: "SET_TREE_TERMINAL", terminalId: "T1", outcome: "MUTUAL_NEUTRALIZATION" },
      { type: "SET_TREE_TERMINAL", terminalId: "T2", outcome: "MUTUAL_NEUTRALIZATION" },
      { type: "SET_TREE_NODE", nodeId: "N1", condition: "NEUTRAL_AFFINITY_PAIR" },
    );
    // Deliberately wrong answers are stored verbatim.
    expect(state.decisionTree.terminals.T1).toBe("MUTUAL_NEUTRALIZATION");
    expect(state.decisionTree.terminals.T2).toBe("MUTUAL_NEUTRALIZATION");
    expect(state.decisionTree.nodes.N1).toBe("NEUTRAL_AFFINITY_PAIR");
  });

  it("rejects edits outside the final investigation", () => {
    const state = apply(startTesting(initial), {
      type: "SET_TREE_NODE",
      nodeId: "N1",
      condition: "SAME_CHARGE",
    });
    expect(state.decisionTree.nodes.N1).toBeNull();
  });

  it("logs node, branch, and terminal changes with previous and new values", () => {
    let state = inFinalStage();
    state = apply(
      state,
      { type: "SET_TREE_NODE", nodeId: "N1", condition: "SAME_CHARGE" },
      { type: "SET_TREE_NODE", nodeId: "N1", condition: "SAME_AFFINITY" },
      { type: "SET_TREE_BRANCH", branchId: "N2-A", label: "YES" },
      { type: "SET_TREE_TERMINAL", terminalId: "T1", outcome: "STALEMATE" },
    );

    const nodeEvents = state.eventLog.filter(
      (e) => e.eventType === "DECISION_TREE_NODE_CHANGED",
    );
    expect(nodeEvents).toHaveLength(2);
    expect(nodeEvents[1].payload).toMatchObject({
      nodeId: "N1",
      previousValue: "SAME_CHARGE",
      newValue: "SAME_AFFINITY",
      finalStageExperimentsCompleted: 0,
    });

    const branchEvents = state.eventLog.filter(
      (e) => e.eventType === "DECISION_TREE_BRANCH_CHANGED",
    );
    // One explicit change plus the implied complementary sibling.
    expect(branchEvents).toHaveLength(2);
    expect(branchEvents[0].payload).toMatchObject({
      branchId: "N2-A",
      previousValue: null,
      newValue: "YES",
    });

    const terminalEvents = state.eventLog.filter(
      (e) => e.eventType === "DECISION_TREE_TERMINAL_CHANGED",
    );
    expect(terminalEvents[0].payload).toMatchObject({
      terminalId: "T1",
      previousValue: null,
      newValue: "STALEMATE",
    });
  });
});

describe("affinity map", () => {
  function inFinalStage(): StudyState {
    return apply(startTesting(initial), { type: "DEV_SKIP_TO_FINAL_INVESTIGATION" });
  }

  it("starts with all pairs unset and allows incomplete/incorrect models", () => {
    let state = inFinalStage();
    expect(
      Object.values(state.affinityMap.relations).every((v) => v === "UNSET"),
    ).toBe(true);

    state = apply(
      state,
      { type: "SET_AFFINITY_RELATION", pairId: "EMBER-GROVE", relation: "SECOND_DOMINATES" },
      { type: "SET_AFFINITY_RELATION", pairId: "EMBER-GALE", relation: "NEUTRAL" },
    );
    // A wrong direction is stored as-is; other pairs may stay unset.
    expect(state.affinityMap.relations["EMBER-GROVE"]).toBe("SECOND_DOMINATES");
    expect(state.affinityMap.relations["EMBER-GALE"]).toBe("NEUTRAL");
    expect(state.affinityMap.relations["GALE-TIDE"]).toBe("UNSET");
  });

  it("logs relationship changes with previous and new values", () => {
    let state = inFinalStage();
    state = apply(
      state,
      { type: "SET_AFFINITY_RELATION", pairId: "GROVE-TIDE", relation: "NEUTRAL" },
      { type: "SET_AFFINITY_RELATION", pairId: "GROVE-TIDE", relation: "FIRST_DOMINATES" },
    );
    const events = state.eventLog.filter(
      (e) => e.eventType === "AFFINITY_RELATIONSHIP_CHANGED",
    );
    expect(events).toHaveLength(2);
    expect(events[1].payload).toMatchObject({
      pairId: "GROVE-TIDE",
      previousValue: "NEUTRAL",
      newValue: "FIRST_DOMINATES",
    });
  });

  it("rejects edits outside the final investigation", () => {
    const state = apply(startTesting(initial), {
      type: "SET_AFFINITY_RELATION",
      pairId: "EMBER-GROVE",
      relation: "NEUTRAL",
    });
    expect(state.affinityMap.relations["EMBER-GROVE"]).toBe("UNSET");
  });
});

describe("structured property choice and optional notes/reflection", () => {
  it("requires a property choice but not notes to run", () => {
    let state = startTesting(initial);
    state = apply(
      state,
      { type: "TOGGLE_STONE", stoneId: "T-01" },
      { type: "TOGGLE_STONE", stoneId: "V-03" },
      { type: "SET_PREDICTION", prediction: "STONE_A_WINS" },
    );
    expect(canRunExperiment(state)).toBe(false);
    state = apply(state, {
      type: "SET_MOST_IMPORTANT_PROPERTY",
      value: "AFFINITY",
    });
    expect(canRunExperiment(state)).toBe(true);
  });

  it("stores property choice and optional notes on the experiment record", () => {
    let state = startTesting(initial);
    state = apply(
      state,
      { type: "TOGGLE_STONE", stoneId: "T-01" },
      { type: "TOGGLE_STONE", stoneId: "V-03" },
      { type: "SET_PREDICTION", prediction: "STONE_A_WINS" },
      { type: "SET_MOST_IMPORTANT_PROPERTY", value: "CHARGE" },
      { type: "SET_NOTES", value: "Remember to check opposite charges" },
      { type: "RUN_EXPERIMENT" },
    );
    expect(state.pendingExperiment?.mostImportantProperty).toBe("CHARGE");
    expect(state.pendingExperiment?.notes).toBe("Remember to check opposite charges");
    state = apply(
      state,
      {
        type: "UPDATE_REFLECTION_DRAFT",
        patch: { evidenceAssessment: "PARTIALLY_SUPPORTED" },
      },
      { type: "SUBMIT_REFLECTION" },
    );
    expect(state.experiments[0].mostImportantProperty).toBe("CHARGE");
    expect(state.experiments[0].notes).toContain("opposite charges");
    expect(state.experiments[0].reflection.observation).toBe("");
    expect(state.experiments[0].reflection.revisedHypothesis).toBe("");
  });

  it("allows reflection with only evidence assessment", () => {
    expect(
      isReflectionComplete({
        evidenceAssessment: "SUPPORTED",
        observation: "",
      }),
    ).toBe(true);
    expect(
      isReflectionComplete({
        evidenceAssessment: null,
        observation: "learned something",
      }),
    ).toBe(false);
  });
});

describe("final investigation", () => {
  it("allows exactly 4 experiments", () => {
    let state = reachFinalInvestigation(initial);
    for (const [a, b] of FINAL_PAIRS) {
      state = runFullExperiment(state, a, b);
    }
    expect(getFinalInvestigationExperiments(state)).toHaveLength(4);

    const blocked = apply(
      state,
      { type: "TOGGLE_STONE", stoneId: "T-01" },
      { type: "TOGGLE_STONE", stoneId: "T-03" },
    );
    expect(canRunExperiment(blocked)).toBe(false);
    expect(blocked.selectedStoneIds).toEqual({ a: null, b: null });
  });

  it("keeps the model editable between and after final experiments", () => {
    let state = reachFinalInvestigation(initial);
    state = apply(state, { type: "SET_TREE_NODE", nodeId: "N1", condition: "SAME_CHARGE" });
    state = runFullExperiment(state, "T-01", "T-02");
    state = apply(state, {
      type: "SET_AFFINITY_RELATION",
      pairId: "EMBER-GROVE",
      relation: "FIRST_DOMINATES",
    });
    for (const [a, b] of FINAL_PAIRS.slice(1)) {
      state = runFullExperiment(state, a, b);
    }
    state = apply(state, { type: "SET_TREE_NODE", nodeId: "N1", condition: "SAME_STRENGTH" });
    expect(state.decisionTree.nodes.N1).toBe("SAME_STRENGTH");
    expect(state.affinityMap.relations["EMBER-GROVE"]).toBe("FIRST_DOMINATES");
  });

  it("does not force submission after the fourth experiment and requires it explicitly", () => {
    let state = reachFinalInvestigation(initial);
    for (const [a, b] of FINAL_PAIRS) {
      state = runFullExperiment(state, a, b);
    }
    expect(state.phase).toBe("FINAL_INVESTIGATION");
    expect(canSubmitFinalModel(state)).toBe(false); // no confidence yet

    state = apply(state, { type: "UPDATE_FINAL_MODEL_DRAFT", patch: { confidence: 5 } });
    expect(canSubmitFinalModel(state)).toBe(true);
    expect(state.phase).toBe("FINAL_INVESTIGATION");
  });

  it("blocks submission before all final experiments are complete", () => {
    let state = reachFinalInvestigation(initial);
    state = runFullExperiment(state, "T-01", "T-02");
    state = apply(state, { type: "UPDATE_FINAL_MODEL_DRAFT", patch: { confidence: 5 } });
    expect(canSubmitFinalModel(state)).toBe(false);
    state = apply(state, { type: "SUBMIT_FINAL_MODEL" });
    expect(state.phase).toBe("FINAL_INVESTIGATION");
    expect(state.finalModelSubmission).toBeNull();
  });

  it("stores the complete model state on submission", () => {
    let state = reachFinalInvestigation(initial);
    state = apply(
      state,
      { type: "SET_TREE_NODE", nodeId: "N1", condition: "SAME_CHARGE" },
      { type: "SET_TREE_BRANCH", branchId: "N1-A", label: "YES" },
      { type: "SET_TREE_TERMINAL", terminalId: "T1", outcome: "STALEMATE" },
      { type: "SET_AFFINITY_RELATION", pairId: "EMBER-GROVE", relation: "FIRST_DOMINATES" },
      { type: "SET_AFFINITY_RELATION", pairId: "GROVE-TIDE", relation: "NEUTRAL" },
    );
    for (const [a, b] of FINAL_PAIRS) {
      state = runFullExperiment(state, a, b);
    }
    state = apply(state, {
      type: "UPDATE_FINAL_MODEL_DRAFT",
      patch: { confidence: 6, notes: "Charge seems to matter most." },
    });
    state = apply(state, { type: "SUBMIT_FINAL_MODEL" });

    expect(state.phase).toBe("COMPLETE");
    const submission = state.finalModelSubmission;
    expect(submission).not.toBeNull();
    expect(submission?.participantId).toBe(state.participantId);
    expect(submission?.condition).toBe("ANALYTICAL");
    expect(submission?.confidence).toBe(6);
    expect(submission?.notes).toBe("Charge seems to matter most.");
    expect(submission?.decisionTree.nodes.N1).toBe("SAME_CHARGE");
    expect(submission?.decisionTree.branches["N1-A"]).toBe("YES");
    expect(submission?.decisionTree.terminals.T1).toBe("STALEMATE");
    expect(submission?.affinityMap.relations["EMBER-GROVE"]).toBe("FIRST_DOMINATES");
    expect(submission?.submittedAt).toBeTruthy();
  });

  it("takes model snapshots at every required point", () => {
    let state = reachFinalInvestigation(initial);
    for (const [a, b] of FINAL_PAIRS) {
      state = runFullExperiment(state, a, b);
    }
    state = apply(
      state,
      { type: "UPDATE_FINAL_MODEL_DRAFT", patch: { confidence: 4 } },
      { type: "SUBMIT_FINAL_MODEL" },
    );

    const reasons = state.modelSnapshots.map((snapshot) => snapshot.reason);
    expect(reasons.filter((r) => r === "FINAL_STAGE_STARTED")).toHaveLength(1);
    expect(reasons.filter((r) => r === "BEFORE_EXPERIMENT")).toHaveLength(
      FINAL_EXPERIMENT_LIMIT,
    );
    expect(reasons.filter((r) => r === "AFTER_EXPERIMENT")).toHaveLength(
      FINAL_EXPERIMENT_LIMIT,
    );
    expect(reasons.filter((r) => r === "FINAL_SUBMISSION")).toHaveLength(1);

    const last = state.modelSnapshots[state.modelSnapshots.length - 1];
    expect(last.finalExperimentsCompleted).toBe(4);
    expect(last.decisionTree).toEqual(state.decisionTree);
    expect(last.affinityMap).toEqual(state.affinityMap);
    expect(
      state.eventLog.filter((e) => e.eventType === "FINAL_MODEL_SNAPSHOT_TAKEN"),
    ).toHaveLength(state.modelSnapshots.length);
  });
});

describe("background validation", () => {
  it("requires all background fields", () => {
    expect(
      isBackgroundComplete({
        age: "",
        educationLevel: "",
        fieldOrOccupation: "",
        llmExperience: "",
        aiLearningProblemSolvingFrequency: "",
        aiProblemSolvingConfidence: "",
      }),
    ).toBe(false);
    expect(
      isBackgroundComplete({
        age: "22",
        educationLevel: "MASTERS",
        fieldOrOccupation: "Teacher",
        llmExperience: "NEVER",
        aiLearningProblemSolvingFrequency: "RARELY",
        aiProblemSolvingConfidence: 2,
      }),
    ).toBe(true);
  });

  it("logs completed background data in the questionnaire event", () => {
    const state = startParticipant(initial);
    const completed = state.eventLog.find(
      (event) => event.eventType === "BACKGROUND_QUESTIONNAIRE_COMPLETED",
    );
    expect(completed?.payload.background).toMatchObject({
      age: 25,
      educationLevel: "BACHELORS",
      aiLearningProblemSolvingFrequency: "FREQUENTLY",
      aiProblemSolvingConfidence: 4,
    });
  });
});

describe("stone selection", () => {
  it("assigns Stone A then Stone B in selection order", () => {
    const state = apply(
      startTesting(initial),
      { type: "TOGGLE_STONE", stoneId: "T-01" },
      { type: "TOGGLE_STONE", stoneId: "E-01" },
    );
    expect(state.selectedStoneIds).toEqual({ a: "T-01", b: "E-01" });
  });
});

describe("round config sanity", () => {
  it("uses only stones from the fixed set with 4-experiment rounds", () => {
    const knownIds = new Set(STONE_SET.map((stone) => stone.id));
    for (const config of ASSISTED_ROUNDS) {
      expect(config.stoneIds.length).toBeGreaterThanOrEqual(ROUND_EXPERIMENT_LIMIT);
      for (const id of config.stoneIds) {
        expect(knownIds.has(id)).toBe(true);
      }
    }
  });
});
