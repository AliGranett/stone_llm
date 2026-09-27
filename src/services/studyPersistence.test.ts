import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState, studyReducer } from "../state/studyReducer";
import { studyConfig } from "../config/studyConfig";
import { studyPersistence } from "./studyPersistence";

/** Minimal in-memory localStorage stub for the node test environment. */
function installLocalStorage() {
  const store = new Map<string, string>();
  const stub = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
  vi.stubGlobal("window", { localStorage: stub });
  return store;
}

describe("studyPersistence", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    studyConfig.fixedCondition = "ANALYTICAL";
    store = installLocalStorage();
  });

  afterEach(() => {
    studyConfig.fixedCondition = null;
    vi.unstubAllGlobals();
  });

  it("round-trips participant state across a simulated refresh", () => {
    let state = createInitialState();
    state = studyReducer(state, {
      type: "SELECT_STUDY_MODE",
      mode: "TESTING",
      testingCondition: "ANALYTICAL",
    });
    state = studyReducer(state, { type: "COMPLETE_INSTRUCTIONS" });
    state = studyReducer(state, { type: "TOGGLE_STONE", stoneId: "T-01" });
    state = studyReducer(state, {
      type: "SET_MOST_IMPORTANT_PROPERTY",
      value: "CHARGE",
    });

    expect(studyPersistence.save(state)).toBe(true);
    const restored = studyPersistence.load();

    expect(restored).not.toBeNull();
    expect(restored!.sessionId).toBe(state.sessionId);
    expect(restored!.condition).toBe("ANALYTICAL");
    expect(restored!.phase).toBe("ASSISTED");
    expect(restored!.selectedStoneIds).toEqual({ a: "T-01", b: null });
    expect(restored!.mostImportantProperty).toBe("CHARGE");
  });

  it("restores INSTRUCTIONS phase when instructions are not yet completed", () => {
    let state = createInitialState();
    state = studyReducer(state, { type: "SELECT_STUDY_MODE", mode: "PARTICIPANT" });
    state = studyReducer(state, {
      type: "UPDATE_BACKGROUND_DRAFT",
      patch: {
        age: "22",
        educationLevel: "BACHELORS",
        fieldOrOccupation: "Math",
        llmExperience: "NEVER",
        aiLearningProblemSolvingFrequency: "NEVER",
        aiProblemSolvingConfidence: 2,
      },
    });
    state = studyReducer(state, { type: "SUBMIT_BACKGROUND" });

    expect(studyPersistence.save(state)).toBe(true);
    const restored = studyPersistence.load();

    expect(restored?.phase).toBe("INSTRUCTIONS");
    expect(restored?.instructionsCompletedAt).toBeNull();
  });

  it("migrates legacy v1 sessions from INVESTIGATION to ASSISTED round 1", () => {
    const legacy = {
      schemaVersion: 1,
      savedAt: new Date().toISOString(),
      state: {
        ...createInitialState(),
        phase: "INVESTIGATION",
        condition: "ANALYTICAL",
        experimentLimit: 4,
        experiments: [],
      },
    };
    store.set(`asterion-study:asterion-v1:v1`, JSON.stringify(legacy));
    const restored = studyPersistence.load();
    expect(restored?.phase).toBe("ASSISTED");
    expect(restored?.currentAssistedRound).toBe(1);
    expect(restored?.studyMode).toBe("TESTING");
  });

  it("migrates v3 TRANSFER/FINAL_SUBMISSION sessions to FINAL_INVESTIGATION with round numbering", () => {
    const base = createInitialState();
    const experiment = (phase: string, id: string) => ({
      id,
      experimentNumber: 1,
      phase,
      startedAt: "2026-01-01T00:00:00.000Z",
      completedAt: "2026-01-01T00:01:00.000Z",
      stoneA: { id: "T-01", affinity: "TIDE", strength: 1, charge: "POSITIVE" },
      stoneB: { id: "T-03", affinity: "TIDE", strength: 3, charge: "POSITIVE" },
      prediction: "STONE_B_WINS",
      mostImportantProperty: "STRENGTH",
      notes: "j",
      evaluation: {
        outcome: "STONE_B_WINS",
        winningStoneId: "T-03",
        appliedRule: "SAME_CHARGE_STRENGTH",
        internalExplanation: "x",
      },
      reflection: {
        evidenceAssessment: "SUPPORTED",
        observation: "o",
        revisedHypothesis: "",
        hypothesisUnchanged: true,
      },
    });
    const legacy = {
      schemaVersion: 3,
      savedAt: new Date().toISOString(),
      state: {
        ...base,
        phase: "FINAL_SUBMISSION",
        studyMode: "TESTING",
        condition: "ANALYTICAL",
        conditionAssigned: true,
        experiments: [
          experiment("ASSISTED", "e1"),
          experiment("ASSISTED", "e2"),
          experiment("ASSISTED", "e3"),
          experiment("ASSISTED", "e4"),
          experiment("ASSISTED", "e5"),
          experiment("TRANSFER", "e6"),
        ],
        chatMessages: [
          { id: "m1", role: "PARTICIPANT", content: "hi", timestamp: "2026-01-01T00:00:00.000Z" },
        ],
      },
    };
    store.set(`asterion-study:asterion-v1:v3`, JSON.stringify(legacy));
    const restored = studyPersistence.load();

    expect(restored?.phase).toBe("FINAL_INVESTIGATION");
    // Assisted experiments are chunked into rounds of 4, in order.
    expect(restored?.experiments[0]).toMatchObject({
      phase: "ASSISTED",
      round: 1,
      roundExperimentNumber: 1,
      globalExperimentNumber: 1,
    });
    expect(restored?.experiments[4]).toMatchObject({
      phase: "ASSISTED",
      round: 2,
      roundExperimentNumber: 1,
      globalExperimentNumber: 5,
    });
    expect(restored?.experiments[5]).toMatchObject({
      phase: "FINAL_INVESTIGATION",
      round: null,
      roundExperimentNumber: 1,
      globalExperimentNumber: 6,
    });
    // Legacy chat messages get a null round; new model state is empty.
    expect(restored?.chatMessages[0].round).toBeNull();
    expect(restored?.decisionTree.nodes.N1).toBeNull();
    expect(restored?.affinityMap.relations["EMBER-GROVE"]).toBe("UNSET");
    expect(restored?.modelSnapshots).toEqual([]);
  });

  it("loads legacy sessions with stability on stones without crashing", () => {
    const legacy = {
      schemaVersion: 4,
      savedAt: new Date().toISOString(),
      state: {
        ...createInitialState(),
        phase: "ASSISTED",
        studyMode: "TESTING",
        condition: "ANALYTICAL",
        experiments: [
          {
            id: "e1",
            experimentNumber: 1,
            phase: "ASSISTED",
            round: 1,
            roundExperimentNumber: 1,
            globalExperimentNumber: 1,
            startedAt: "2026-01-01T00:00:00.000Z",
            completedAt: "2026-01-01T00:01:00.000Z",
            stoneA: {
              id: "T-01",
              affinity: "TIDE",
              strength: 1,
              charge: "POSITIVE",
              stability: "STABLE",
            },
            stoneB: {
              id: "T-03",
              affinity: "TIDE",
              strength: 3,
              charge: "POSITIVE",
              stability: "VOLATILE",
            },
            prediction: "STONE_B_WINS",
            justification: "j",
            evaluation: {
              outcome: "STONE_B_WINS",
              winningStoneId: "T-03",
              appliedRule: "SAME_CHARGE_STRENGTH",
              internalExplanation: "x",
            },
            reflection: {
              evidenceAssessment: "SUPPORTED",
              observation: "o",
              revisedHypothesis: "",
              hypothesisUnchanged: true,
            },
          },
        ],
        pendingExperiment: {
          id: "pending-1",
          phase: "ASSISTED",
          round: 1,
          roundExperimentNumber: 2,
          globalExperimentNumber: 2,
          startedAt: "2026-01-01T00:02:00.000Z",
          stoneA: {
            id: "G-02",
            affinity: "GALE",
            strength: 2,
            charge: "POSITIVE",
            stability: "STABLE",
          },
          stoneB: {
            id: "G-03",
            affinity: "GALE",
            strength: 3,
            charge: "POSITIVE",
            stability: "VOLATILE",
          },
          prediction: "STONE_B_WINS",
          justification: "j2",
          evaluation: {
            outcome: "STONE_B_WINS",
            winningStoneId: "G-03",
            appliedRule: "SAME_CHARGE_STRENGTH",
            internalExplanation: "y",
          },
        },
      },
    };
    store.set(`asterion-study:asterion-v1:v4`, JSON.stringify(legacy));
    const restored = studyPersistence.load();

    expect(restored).not.toBeNull();
    expect(restored!.experiments[0].stoneA).toEqual({
      id: "T-01",
      affinity: "TIDE",
      strength: 1,
      charge: "POSITIVE",
    });
    expect(restored!.experiments[0].stoneB).toEqual({
      id: "T-03",
      affinity: "TIDE",
      strength: 3,
      charge: "POSITIVE",
    });
    expect(restored!.pendingExperiment?.stoneA).toEqual({
      id: "G-02",
      affinity: "GALE",
      strength: 2,
      charge: "POSITIVE",
    });
    expect(restored!.pendingExperiment?.stoneB).toEqual({
      id: "G-03",
      affinity: "GALE",
      strength: 3,
      charge: "POSITIVE",
    });
    expect(restored!.experiments[0].notes).toBe("j");
    expect(restored!.pendingExperiment?.notes).toBe("j2");
    expect(
      "stability" in restored!.experiments[0].stoneA ||
        "stability" in restored!.experiments[0].stoneB,
    ).toBe(false);
  });

  it("migrates legacy v2 participant background fields", () => {
    const legacy = {
      schemaVersion: 2,
      savedAt: new Date().toISOString(),
      state: {
        ...createInitialState(),
        phase: "ASSISTED",
        studyMode: "PARTICIPANT",
        background: {
          age: 28,
          educationLevel: "Bachelor's degree",
          fieldOrOccupation: "Chemistry",
          llmExperience: "SOMETIMES",
        },
        backgroundDraft: {
          age: "28",
          educationLevel: "Bachelor's degree",
          fieldOrOccupation: "Chemistry",
          llmExperience: "SOMETIMES",
        },
      },
    };
    store.set(`asterion-study:asterion-v1:v2`, JSON.stringify(legacy));
    const restored = studyPersistence.load();
    expect(restored?.background?.educationLevel).toBe("OTHER");
    expect(restored?.background?.aiLearningProblemSolvingFrequency).toBe("SOMETIMES");
    expect(restored?.background?.aiProblemSolvingConfidence).toBe(3);
    expect(restored?.backgroundDraft.educationLevel).toBe("OTHER");
    expect(restored?.backgroundDraft.aiLearningProblemSolvingFrequency).toBe("");
  });

  it("round-trips new background fields in v3 persistence", () => {
    let state = createInitialState();
    state = studyReducer(state, { type: "SELECT_STUDY_MODE", mode: "PARTICIPANT" });
    state = studyReducer(state, {
      type: "UPDATE_BACKGROUND_DRAFT",
      patch: {
        age: "31",
        educationLevel: "MASTERS",
        fieldOrOccupation: "Education",
        llmExperience: "FREQUENTLY",
        aiLearningProblemSolvingFrequency: "VERY_FREQUENTLY",
        aiProblemSolvingConfidence: 5,
      },
    });
    state = studyReducer(state, { type: "SUBMIT_BACKGROUND" });

    expect(studyPersistence.save(state)).toBe(true);
    const restored = studyPersistence.load();

    expect(restored?.background).toMatchObject({
      age: 31,
      educationLevel: "MASTERS",
      fieldOrOccupation: "Education",
      llmExperience: "FREQUENTLY",
      aiLearningProblemSolvingFrequency: "VERY_FREQUENTLY",
      aiProblemSolvingConfidence: 5,
    });
  });

  it("round-trips round progress, inquiry counts, and the final model", () => {
    let state = createInitialState();
    state = studyReducer(state, {
      type: "SELECT_STUDY_MODE",
      mode: "TESTING",
      testingCondition: "ANALYTICAL",
    });
    state = studyReducer(state, { type: "COMPLETE_INSTRUCTIONS" });
    state = studyReducer(state, {
      type: "ADD_CHAT_MESSAGE",
      message: {
        id: "m1",
        role: "PARTICIPANT",
        content: "Which stones differ only in strength?",
        timestamp: new Date().toISOString(),
        round: null,
      },
      eventType: "LLM_MESSAGE_SENT",
    });
    state = { ...state, currentAssistedRound: 3 };
    state = studyReducer(state, { type: "DEV_SKIP_TO_FINAL_INVESTIGATION" });
    state = studyReducer(state, {
      type: "SET_TREE_NODE",
      nodeId: "N1",
      condition: "SAME_CHARGE",
    });
    state = studyReducer(state, {
      type: "SET_TREE_BRANCH",
      branchId: "N1-A",
      label: "YES",
    });
    state = studyReducer(state, {
      type: "SET_TREE_TERMINAL",
      terminalId: "T1",
      outcome: "STALEMATE",
    });
    state = studyReducer(state, {
      type: "SET_AFFINITY_RELATION",
      pairId: "GALE-TIDE",
      relation: "FIRST_DOMINATES",
    });

    expect(studyPersistence.save(state)).toBe(true);
    const restored = studyPersistence.load();

    expect(restored?.phase).toBe("FINAL_INVESTIGATION");
    expect(restored?.currentAssistedRound).toBe(3);
    expect(restored?.chatMessages).toHaveLength(1);
    expect(restored?.chatMessages[0].round).toBe(1);
    expect(restored?.decisionTree.nodes.N1).toBe("SAME_CHARGE");
    expect(restored?.decisionTree.branches["N1-A"]).toBe("YES");
    expect(restored?.decisionTree.branches["N1-B"]).toBe("NO");
    expect(restored?.decisionTree.terminals.T1).toBe("STALEMATE");
    expect(restored?.affinityMap.relations["GALE-TIDE"]).toBe("FIRST_DOMINATES");
    expect(restored?.modelSnapshots).toHaveLength(1);
    expect(restored?.modelSnapshots[0].reason).toBe("FINAL_STAGE_STARTED");
  });

  it("persists decision-tree edits made after Round 1 across refresh", () => {
    let state = createInitialState();
    state = studyReducer(state, {
      type: "SELECT_STUDY_MODE",
      mode: "TESTING",
      testingCondition: "ANALYTICAL",
    });
    state = studyReducer(state, { type: "COMPLETE_INSTRUCTIONS" });
    state = { ...state, currentAssistedRound: 2 };
    state = studyReducer(state, {
      type: "SET_TREE_NODE",
      nodeId: "N1",
      condition: "SAME_STRENGTH",
    });
    expect(studyPersistence.save(state)).toBe(true);
    const restored = studyPersistence.load();
    expect(restored?.currentAssistedRound).toBe(2);
    expect(restored?.decisionTree.nodes.N1).toBe("SAME_STRENGTH");
  });

  it("migrates old Round 4/5 assisted sessions into the final investigation", () => {
    const base = createInitialState();
    studyPersistence.save(base);
    const storageKey = [...store.keys()][0];
    const envelope = {
      schemaVersion: 4,
      savedAt: new Date().toISOString(),
      state: {
        ...base,
        studyMode: "TESTING",
        phase: "ASSISTED",
        currentAssistedRound: 4,
        startedAt: new Date().toISOString(),
        condition: "ANALYTICAL",
        conditionAssigned: true,
        instructionsCompletedAt: new Date().toISOString(),
      },
    };
    store.set(storageKey, JSON.stringify(envelope));

    const restored = studyPersistence.load();
    expect(restored?.phase).toBe("FINAL_INVESTIGATION");
    expect(restored?.currentAssistedRound).toBe(3);
  });

  it("returns null for corrupted or incompatible stored data", () => {
    for (const key of store.keys()) {
      store.set(key, "{not json");
    }
    expect(studyPersistence.load()).toBeNull();

    studyPersistence.save(createInitialState());
    const key = [...store.keys()][0];
    store.set(key, JSON.stringify({ schemaVersion: 999, state: {} }));
    expect(studyPersistence.load()).toBeNull();
  });

  it("clear removes the stored session", () => {
    studyPersistence.save(createInitialState());
    expect(studyPersistence.load()).not.toBeNull();
    studyPersistence.clear();
    expect(studyPersistence.load()).toBeNull();
  });

  it("fails gracefully when storage is unavailable", () => {
    vi.unstubAllGlobals();
    expect(studyPersistence.load()).toBeNull();
    expect(studyPersistence.save(createInitialState())).toBe(false);
    expect(() => studyPersistence.clear()).not.toThrow();
  });
});
