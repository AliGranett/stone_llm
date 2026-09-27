import { describe, expect, it } from "vitest";
import type { ResearchPartnerApiRequest } from "../types";
import { buildModelRequest } from "./openaiService";

const stoneA = {
  id: "T-01",
  affinity: "TIDE",
  strength: 2,
  charge: "POSITIVE",
};
const stoneB = {
  id: "E-02",
  affinity: "EMBER",
  strength: 1,
  charge: "NEGATIVE",
};

function makeRequest(
  overrides: Partial<ResearchPartnerApiRequest> = {},
): ResearchPartnerApiRequest {
  return {
    participantId: "P-1",
    sessionId: "S-1",
    experimentId: "exp-1",
    llmMode: "ANALYTICAL",
    participantMessage: "What should I try next?",
    studyPhase: "ASSISTED",
    experimentsRemaining: 3,
    currentHypothesis: "CHARGE",
    currentMostImportantProperty: "CHARGE",
    currentNotes: "",
    selectedStones: { stoneA, stoneB },
    availableStones: [stoneA, stoneB],
    experimentHistory: [
      {
        experimentNumber: 1,
        round: 1,
        roundExperimentNumber: 1,
        stoneA,
        stoneB,
        prediction: "STONE_B_WINS",
        outcome: "STONE_A_WINS",
        winningStoneId: "T-01",
        predictionMatched: false,
        hypothesis: "CHARGE",
        justification: "Opposite charges.",
        mostImportantProperty: "CHARGE",
        notes: "Opposite charges.",
        evidenceAssessment: "CONTRADICTED",
        observation: "Charge alone did not explain it.",
        revisedHypothesis: "",
        reflectionStatus: "COMPLETE",
      },
    ],
    conversationHistory: [],
    ...overrides,
  };
}

describe("buildModelRequest", () => {
  it("uses analytical_prompt.txt for the ANALYTICAL condition", async () => {
    const payload = await buildModelRequest(makeRequest({ llmMode: "ANALYTICAL" }));
    expect(payload.instructions).toContain("ANALYZE the available evidence");
    expect(payload.instructions).not.toContain("DEVELOP AND APPLY A SYSTEMATIC METHOD");
  });

  it("uses hypothesis_driven_prompt.txt for the HYPOTHESIS_DRIVEN condition", async () => {
    const payload = await buildModelRequest(
      makeRequest({ llmMode: "HYPOTHESIS_DRIVEN" }),
    );
    expect(payload.instructions).toContain("DEVELOP AND APPLY A SYSTEMATIC METHOD");
    expect(payload.instructions).not.toContain("ANALYZE the available evidence");
  });

  it("keeps the prompt out of the input and the context out of the prompt", async () => {
    const payload = await buildModelRequest(makeRequest());
    // The prompt file is passed only as instructions, untouched.
    expect(payload.input.map((m) => m.content).join("\n")).not.toContain(
      "Analytical Research Partner",
    );
    // Runtime context is a separate developer entry, not merged into the prompt.
    expect(payload.instructions).not.toContain("Experiments remaining");
    expect(payload.input[0].role).toBe("developer");
    expect(payload.input[0].content).toContain("Experiments remaining: 3");
  });

  it("includes experiment history in the context", async () => {
    const payload = await buildModelRequest(makeRequest());
    expect(payload.input[0].content).toContain("Experiment 1");
    expect(payload.input[0].content).toContain("Stone A wins");
  });

  it("preserves conversation history in order and ends with the newest message", async () => {
    const payload = await buildModelRequest(
      makeRequest({
        conversationHistory: [
          { role: "PARTICIPANT", content: "First question" },
          { role: "PARTNER", content: "First answer" },
          { role: "PARTICIPANT", content: "Second question" },
          { role: "PARTNER", content: "Second answer" },
        ],
        participantMessage: "Third question",
      }),
    );

    expect(payload.input.map((m) => m.role)).toEqual([
      "developer",
      "user",
      "assistant",
      "user",
      "assistant",
      "user",
    ]);
    expect(payload.input.at(-1)).toEqual({ role: "user", content: "Third question" });
    expect(payload.input[2].content).toBe("First answer");
  });

  it("sends identical context to both conditions, differing only in the prompt", async () => {
    const analytical = await buildModelRequest(makeRequest({ llmMode: "ANALYTICAL" }));
    const hypothesisDriven = await buildModelRequest(
      makeRequest({ llmMode: "HYPOTHESIS_DRIVEN" }),
    );
    expect(analytical.input).toEqual(hypothesisDriven.input);
    expect(analytical.instructions).not.toBe(hypothesisDriven.instructions);
  });

  it("defaults to the gpt-4o model", async () => {
    const payload = await buildModelRequest(makeRequest());
    expect(payload.model).toBe("gpt-4o");
  });
});
