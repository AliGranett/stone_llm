import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createEmptyAffinityMap,
  createEmptyDecisionTree,
} from "../config/finalModelConfig";
import { createCorrectDecisionTree } from "../config/correctDecisionTree";
import { getStoneById } from "../config/stoneSet";
import { studyConfig } from "../config/studyConfig";
import {
  createInitialState,
  studyReducer,
  type StudyState,
} from "../state/studyReducer";
import type { ExperimentRecord } from "../types";
import {
  EXPERIMENT_CSV_COLUMNS,
  FINAL_REPORT_CSV_COLUMNS,
  buildExperimentsCsv,
  buildFinalReportCsv,
  buildLlmInteractionsCsv,
  buildParticipantCsv,
  buildStudyExport,
} from "./studyLogger";

function makeExperiment(
  overrides: Partial<ExperimentRecord> &
    Pick<
      ExperimentRecord,
      "id" | "globalExperimentNumber" | "roundExperimentNumber" | "phase"
    >,
): ExperimentRecord {
  const stoneA = getStoneById("T-01")!;
  const stoneB = getStoneById("T-03")!;
  return {
    experimentNumber: overrides.globalExperimentNumber,
    round: overrides.phase === "ASSISTED" ? (overrides.round ?? 1) : null,
    startedAt: "2026-01-01T10:00:00.000Z",
    completedAt: "2026-01-01T10:01:30.000Z",
    stoneA,
    stoneB,
    prediction: "STONE_A_WINS",
    mostImportantProperty: "STRENGTH",
    notes: "",
    evaluation: {
      outcome: "STONE_B_WINS",
      winningStoneId: "T-03",
      appliedRule: "SAME_CHARGE_STRENGTH",
      internalExplanation: "Hidden: stronger stone wins.",
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

describe("studyLogger participant export", () => {
  beforeEach(() => {
    studyConfig.fixedCondition = "ANALYTICAL";
  });

  afterEach(() => {
    studyConfig.fixedCondition = null;
  });

  it("includes new background fields in participant.csv", () => {
    let state = createInitialState();
    state = studyReducer(state, { type: "SELECT_STUDY_MODE", mode: "PARTICIPANT" });
    state = studyReducer(state, {
      type: "UPDATE_BACKGROUND_DRAFT",
      patch: {
        age: "27",
        educationLevel: "DOCTORATE",
        fieldOrOccupation: "Physics",
        llmExperience: "RARELY",
        aiLearningProblemSolvingFrequency: "SOMETIMES",
        aiProblemSolvingConfidence: 3,
      },
    });
    state = studyReducer(state, { type: "SUBMIT_BACKGROUND" });
    expect(state.phase).toBe("INSTRUCTIONS");
    state = studyReducer(state, { type: "COMPLETE_INSTRUCTIONS" });

    const csv = buildParticipantCsv(state);
    const [header, row] = csv.split("\n");

    expect(header).toContain("ai_learning_problem_solving_frequency");
    expect(header).toContain("ai_problem_solving_confidence");
    expect(row).toContain('"DOCTORATE"');
    expect(row).toContain('"SOMETIMES"');
    expect(row).toContain('"3"');
  });

  it("includes new background fields in study JSON export", () => {
    let state = createInitialState();
    state = studyReducer(state, { type: "SELECT_STUDY_MODE", mode: "PARTICIPANT" });
    state = studyReducer(state, {
      type: "UPDATE_BACKGROUND_DRAFT",
      patch: {
        age: "40",
        educationLevel: "OTHER",
        fieldOrOccupation: "Artist",
        llmExperience: "VERY_FREQUENTLY",
        aiLearningProblemSolvingFrequency: "FREQUENTLY",
        aiProblemSolvingConfidence: 2,
      },
    });
    state = studyReducer(state, { type: "SUBMIT_BACKGROUND" });

    const exported = buildStudyExport(state);
    expect(exported.background).toMatchObject({
      age: 40,
      educationLevel: "OTHER",
      aiLearningProblemSolvingFrequency: "FREQUENTLY",
      aiProblemSolvingConfidence: 2,
    });
  });
});

describe("studyLogger round-protocol exports", () => {
  function testingState(): StudyState {
    let state = createInitialState();
    state = studyReducer(state, {
      type: "SELECT_STUDY_MODE",
      mode: "TESTING",
      testingCondition: "ANALYTICAL",
    });
    return state;
  }

  it("includes round metadata and final-model state in the JSON export", () => {
    const exported = buildStudyExport(testingState());
    expect(exported.session.currentAssistedRound).toBe(1);
    expect(exported.session.roundExperimentLimit).toBe(4);
    expect(exported.session.roundInquiryMin).toBe(2);
    expect(exported.session.roundInquiryMax).toBe(4);
    expect(exported.session.finalExperimentLimit).toBe(4);
    expect(exported.rounds).toHaveLength(3);
    expect(exported.rounds[0]).toMatchObject({
      round: 1,
      experimentsCompleted: 0,
      inquiriesUsed: 0,
    });
    expect(exported.finalModel.decisionTree.nodes.N1).toBeNull();
    expect(exported.finalModel.affinityMap.relations["EMBER-GROVE"]).toBe("UNSET");
    expect(exported.finalModel.snapshots).toEqual([]);
    expect(exported.finalModel.submission).toBeNull();
  });

  it("includes inquiry position columns in llm_interactions.csv", () => {
    const state: StudyState = {
      ...testingState(),
      llmInteractions: [
        {
          interactionId: "int-1",
          participantId: "P-1",
          sessionId: "S-1",
          experimentId: null,
          llmMode: "ANALYTICAL",
          studyPhase: "ASSISTED",
          round: 2,
          roundInquiryNumber: 3,
          globalInquiryNumber: 7,
          experimentsCompletedInRound: 1,
          userMessage: "What next?",
          llmResponse: "Consider isolating one property.",
          userMessageTimestamp: "2026-01-01T00:00:00.000Z",
          llmResponseTimestamp: "2026-01-01T00:00:01.000Z",
          responseLatencyMs: 900,
          promptVersion: "ANALYTICAL_V1",
          model: "gpt-4o",
        },
      ],
    };
    const [header, row] = buildLlmInteractionsCsv(state).split("\n");
    expect(header).toContain("round");
    expect(header).toContain("round_inquiry_number");
    expect(header).toContain("global_inquiry_number");
    expect(header).toContain("experiments_completed_in_round");
    expect(row).toContain('"2"');
    expect(row).toContain('"3"');
    expect(row).toContain('"7"');
  });
});

describe("buildExperimentsCsv", () => {
  function baseState(experiments: ExperimentRecord[]): StudyState {
    let state = createInitialState();
    state = studyReducer(state, {
      type: "SELECT_STUDY_MODE",
      mode: "TESTING",
      testingCondition: "HYPOTHESIS_DRIVEN",
    });
    return {
      ...state,
      participantId: "P-EXPORT",
      sessionId: "S-EXPORT-12345678",
      experiments,
      eventLog: [
        ...state.eventLog,
        {
          eventId: "reveal-1",
          participantId: "P-EXPORT",
          sessionId: "S-EXPORT-12345678",
          eventType: "EXPERIMENT_RESULT_REVEALED",
          timestamp: "2026-01-01T10:00:45.000Z",
          phase: "ASSISTED",
          experimentNumber: 1,
          payload: { experimentId: "exp-1" },
        },
      ],
    };
  }

  function parseCsv(csv: string): { header: string[]; rows: string[][] } {
    const text = csv.replace(/^\uFEFF/, "");
    const lines = text.split("\n").filter((line) => line.length > 0);
    const parseLine = (line: string): string[] => {
      const cells: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (inQuotes) {
          if (ch === '"' && line[i + 1] === '"') {
            current += '"';
            i += 1;
          } else if (ch === '"') {
            inQuotes = false;
          } else {
            current += ch;
          }
        } else if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          cells.push(current);
          current = "";
        } else {
          current += ch;
        }
      }
      cells.push(current);
      return cells;
    };
    return {
      header: parseLine(lines[0]),
      rows: lines.slice(1).map(parseLine),
    };
  }

  it("exports exactly one row per experiment in chronological order", () => {
    const experiments = [
      makeExperiment({
        id: "exp-2",
        phase: "ASSISTED",
        round: 2,
        globalExperimentNumber: 2,
        roundExperimentNumber: 1,
      }),
      makeExperiment({
        id: "exp-1",
        phase: "ASSISTED",
        round: 1,
        globalExperimentNumber: 1,
        roundExperimentNumber: 1,
      }),
      makeExperiment({
        id: "exp-3",
        phase: "FINAL_INVESTIGATION",
        round: null,
        globalExperimentNumber: 3,
        roundExperimentNumber: 1,
      }),
    ];
    const { header, rows } = parseCsv(buildExperimentsCsv(baseState(experiments)));
    expect(header).toEqual([...EXPERIMENT_CSV_COLUMNS]);
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row[header.indexOf("global_experiment_number")])).toEqual([
      "1",
      "2",
      "3",
    ]);
    expect(rows.map((row) => row[header.indexOf("phase")])).toEqual([
      "ASSISTED",
      "ASSISTED",
      "FINAL_INVESTIGATION",
    ]);
    expect(rows.map((row) => row[header.indexOf("round")])).toEqual(["1", "2", ""]);
  });

  it("includes final independent experiments and session identity on every row", () => {
    const experiments = [
      makeExperiment({
        id: "exp-1",
        phase: "ASSISTED",
        round: 1,
        globalExperimentNumber: 1,
        roundExperimentNumber: 1,
      }),
      makeExperiment({
        id: "exp-final",
        phase: "FINAL_INVESTIGATION",
        round: null,
        globalExperimentNumber: 2,
        roundExperimentNumber: 1,
      }),
    ];
    const { header, rows } = parseCsv(buildExperimentsCsv(baseState(experiments)));
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row[header.indexOf("participant_id")]).toBe("P-EXPORT");
      expect(row[header.indexOf("session_id")]).toBe("S-EXPORT-12345678");
      expect(row[header.indexOf("condition")]).toBe("HYPOTHESIS_DRIVEN");
      expect(row[header.indexOf("study_mode")]).toBe("TESTING");
    }
    expect(rows[1][header.indexOf("phase")]).toBe("FINAL_INVESTIGATION");
  });

  it("exports blank cells for optional notes and observations", () => {
    const experiments = [
      makeExperiment({
        id: "exp-1",
        phase: "ASSISTED",
        round: 1,
        globalExperimentNumber: 1,
        roundExperimentNumber: 1,
        notes: "",
        reflection: {
          evidenceAssessment: "UNCLEAR",
          observation: "",
          revisedHypothesis: "",
          hypothesisUnchanged: true,
        },
      }),
    ];
    const { header, rows } = parseCsv(buildExperimentsCsv(baseState(experiments)));
    expect(rows[0][header.indexOf("notes")]).toBe("");
    expect(rows[0][header.indexOf("learned_from_result")]).toBe("");
    expect(rows[0][header.indexOf("evidence_support")]).toBe("UNCLEAR");
  });

  it("does not export hidden rule-engine metadata", () => {
    const csv = buildExperimentsCsv(
      baseState([
        makeExperiment({
          id: "exp-1",
          phase: "ASSISTED",
          round: 1,
          globalExperimentNumber: 1,
          roundExperimentNumber: 1,
        }),
      ]),
    );
    expect(csv).not.toContain("appliedRule");
    expect(csv).not.toContain("SAME_CHARGE_STRENGTH");
    expect(csv).not.toContain("internalExplanation");
    expect(csv).not.toContain("Hidden:");
  });

  it("escapes commas, quotes, Hebrew, and Arabic text", () => {
    const experiments = [
      makeExperiment({
        id: "exp-1",
        phase: "ASSISTED",
        round: 1,
        globalExperimentNumber: 1,
        roundExperimentNumber: 1,
        notes: 'Said "strength", then charge',
        reflection: {
          evidenceAssessment: "SUPPORTED",
          observation: "עברית, והמשך — العربية",
          revisedHypothesis: "",
          hypothesisUnchanged: true,
        },
      }),
    ];
    const csv = buildExperimentsCsv(baseState(experiments));
    expect(csv.startsWith("\uFEFF")).toBe(true);
    const { header, rows } = parseCsv(csv);
    expect(rows[0][header.indexOf("notes")]).toBe('Said "strength", then charge');
    expect(rows[0][header.indexOf("learned_from_result")]).toBe(
      "עברית, והמשך — العربية",
    );
  });

  it("includes timing fields and derives duration_ms when possible", () => {
    const experiments = [
      makeExperiment({
        id: "exp-1",
        phase: "ASSISTED",
        round: 1,
        globalExperimentNumber: 1,
        roundExperimentNumber: 1,
        startedAt: "2026-01-01T10:00:00.000Z",
        completedAt: "2026-01-01T10:01:30.000Z",
      }),
    ];
    const { header, rows } = parseCsv(buildExperimentsCsv(baseState(experiments)));
    expect(rows[0][header.indexOf("experiment_started_at")]).toBe(
      "2026-01-01T10:00:00.000Z",
    );
    expect(rows[0][header.indexOf("result_revealed_at")]).toBe(
      "2026-01-01T10:00:45.000Z",
    );
    expect(rows[0][header.indexOf("reflection_completed_at")]).toBe(
      "2026-01-01T10:01:30.000Z",
    );
    expect(rows[0][header.indexOf("duration_ms")]).toBe("90000");
    expect(rows[0][header.indexOf("prediction_correct")]).toBe("false");
    expect(rows[0][header.indexOf("winning_stone_id")]).toBe("T-03");
  });

  it("includes final-tree consistency columns against the participant tree", () => {
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

    const state = {
      ...baseState([
        makeExperiment({
          id: "exp-1",
          phase: "ASSISTED",
          round: 1,
          globalExperimentNumber: 1,
          roundExperimentNumber: 1,
        }),
      ]),
      decisionTree: tree,
      finalModelSubmission: {
        participantId: "P-EXPORT",
        condition: "HYPOTHESIS_DRIVEN" as const,
        decisionTree: tree,
        affinityMap: createEmptyAffinityMap(),
        notes: "",
        confidence: 5,
        submittedAt: "2026-01-01T12:00:00.000Z",
      },
    };

    const { header, rows } = parseCsv(buildExperimentsCsv(state));
    expect(header).toContain("final_tree_matches_actual");
    expect(header).toContain("final_tree_predicted_outcome");
    expect(header).toContain("final_tree_status");
    expect(rows[0][header.indexOf("final_tree_predicted_outcome")]).toBe("STONE_B_WINS");
    expect(rows[0][header.indexOf("final_tree_terminal")]).toBe("STRONGER_CRYSTAL_WINS");
    expect(rows[0][header.indexOf("final_tree_matches_actual")]).toBe("true");
    expect(rows[0][header.indexOf("final_tree_status")]).toBe("MATCH");
  });

  it("marks UNEVALUABLE when the final tree is incomplete", () => {
    const { header, rows } = parseCsv(
      buildExperimentsCsv(
        baseState([
          makeExperiment({
            id: "exp-1",
            phase: "ASSISTED",
            round: 1,
            globalExperimentNumber: 1,
            roundExperimentNumber: 1,
          }),
        ]),
      ),
    );
    expect(rows[0][header.indexOf("final_tree_status")]).toBe("UNEVALUABLE");
    expect(rows[0][header.indexOf("final_tree_matches_actual")]).toBe("");
    expect(rows[0][header.indexOf("final_tree_predicted_outcome")]).toBe("");
  });
});

describe("buildFinalReportCsv", () => {
  function parseCsv(csv: string): { header: string[]; rows: string[][] } {
    const text = csv.replace(/^\uFEFF/, "");
    const lines = text.split("\n").filter((line) => line.length > 0);
    const parseLine = (line: string): string[] => {
      const cells: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (inQuotes) {
          if (ch === '"' && line[i + 1] === '"') {
            current += '"';
            i += 1;
          } else if (ch === '"') {
            inQuotes = false;
          } else {
            current += ch;
          }
        } else if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          cells.push(current);
          current = "";
        } else {
          current += ch;
        }
      }
      cells.push(current);
      return cells;
    };
    return {
      header: parseLine(lines[0]),
      rows: lines.slice(1).map(parseLine),
    };
  }

  it("reports perfect tree accuracy and experiment match counts", () => {
    let state = createInitialState();
    state = studyReducer(state, {
      type: "SELECT_STUDY_MODE",
      mode: "TESTING",
      testingCondition: "ANALYTICAL",
    });
    const tree = createCorrectDecisionTree();
    state = {
      ...state,
      participantId: "P-R",
      sessionId: "S-R",
      decisionTree: tree,
      finalModelSubmission: {
        participantId: "P-R",
        condition: "ANALYTICAL",
        decisionTree: tree,
        affinityMap: createEmptyAffinityMap(),
        notes: "",
        confidence: 7,
        submittedAt: "2026-01-01T12:00:00.000Z",
      },
      experiments: [
        makeExperiment({
          id: "e1",
          phase: "ASSISTED",
          round: 1,
          globalExperimentNumber: 1,
          roundExperimentNumber: 1,
        }),
      ],
    };

    const { header, rows } = parseCsv(buildFinalReportCsv(state));
    expect(header).toEqual([...FINAL_REPORT_CSV_COLUMNS]);
    expect(rows).toHaveLength(1);
    expect(rows[0][header.indexOf("nodes_correct")]).toBe("5");
    expect(rows[0][header.indexOf("nodes_total")]).toBe("5");
    expect(rows[0][header.indexOf("branches_correct")]).toBe("10");
    expect(rows[0][header.indexOf("terminals_correct")]).toBe("6");
    expect(rows[0][header.indexOf("tree_slots_correct")]).toBe("21");
    expect(rows[0][header.indexOf("experiments_total")]).toBe("1");
    expect(rows[0][header.indexOf("experiments_match")]).toBe("1");
    expect(rows[0][header.indexOf("experiments_mismatch")]).toBe("0");
    expect(rows[0][header.indexOf("experiments_match_rate")]).toBe("1.0000");
  });
});
