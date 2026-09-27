import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  ExperimentRecord,
  ExperimentalCondition,
  PendingExperiment,
} from "../types";
import {
  ResearchPartnerError,
  buildRequestBody,
  collectCompletedEvidence,
  resolveCurrentSelection,
  sendResearchPartnerMessage,
  toWireExperiment,
  type ResearchPartnerRequest,
} from "./researchPartnerService";

const t01 = {
  id: "T-01",
  affinity: "TIDE",
  strength: 1,
  charge: "POSITIVE",
} as const;

const t03 = {
  id: "T-03",
  affinity: "TIDE",
  strength: 3,
  charge: "POSITIVE",
} as const;

const g02 = {
  id: "G-02",
  affinity: "GALE",
  strength: 2,
  charge: "POSITIVE",
} as const;

const g03 = {
  id: "G-03",
  affinity: "GALE",
  strength: 3,
  charge: "POSITIVE",
} as const;

const experiment1: ExperimentRecord = {
  id: "exp-1",
  experimentNumber: 1,
  phase: "ASSISTED",
  round: 1,
  roundExperimentNumber: 1,
  globalExperimentNumber: 1,
  startedAt: "2026-01-01T00:00:00.000Z",
  completedAt: "2026-01-01T00:01:00.000Z",
  stoneA: { ...t03 },
  stoneB: { ...t01 },
  prediction: "STONE_A_WINS",
  mostImportantProperty: "STRENGTH",
  notes: "Same affinity.",
  evaluation: {
    outcome: "STONE_A_WINS",
    winningStoneId: "T-03",
    appliedRule: "SAME_CHARGE_STRENGTH",
    internalExplanation: "Same charge; T-03 is stronger.",
  },
  reflection: {
    evidenceAssessment: "SUPPORTED",
    observation: "T-03 beat T-01.",
    revisedHypothesis: "",
    hypothesisUnchanged: true,
  },
};

const pendingExperiment2: PendingExperiment = {
  id: "exp-2",
  experimentNumber: 2,
  phase: "ASSISTED",
  round: 1,
  roundExperimentNumber: 2,
  globalExperimentNumber: 2,
  startedAt: "2026-01-01T00:02:00.000Z",
  stoneA: { ...g03 },
  stoneB: { ...g02 },
  prediction: "STONE_A_WINS",
  mostImportantProperty: "STRENGTH",
  notes: "Same charge Wind pair.",
  evaluation: {
    outcome: "STONE_A_WINS",
    winningStoneId: "G-03",
    appliedRule: "SAME_CHARGE_STRENGTH",
    internalExplanation: "Same charge; G-03 is stronger.",
  },
};

function makeRequest(
  overrides: Partial<ResearchPartnerRequest> = {},
): ResearchPartnerRequest {
  return {
    participantId: "P-1",
    sessionId: "S-1",
    experimentId: "exp-2",
    participantMessage: "I think if charge is the same strongest wins",
    phase: "ASSISTED",
    experimentsRemaining: 2,
    availableStones: [{ ...t01 }, { ...t03 }, { ...g02 }, { ...g03 }],
    // UI still has the just-run pair selected — this is the bug scenario.
    selectedStones: { stoneA: { ...g03 }, stoneB: { ...g02 } },
    experimentHistory: [experiment1],
    pendingExperiment: pendingExperiment2,
    currentMostImportantProperty: "STRENGTH",
    currentNotes: "",
    chatHistory: [],
    condition: "ANALYTICAL",
    locale: "en",
    ...overrides,
  };
}

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })) as unknown as typeof fetch;
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock as unknown as ReturnType<typeof vi.fn>;
}

const successBody = {
  message: "Consider isolating one property.",
  interactionId: "int-1",
  promptVersion: "ANALYTICAL_V1",
  model: "gpt-4o",
  responseLatencyMs: 900,
  userMessageTimestamp: "2026-01-01T00:00:00.000Z",
  llmResponseTimestamp: "2026-01-01T00:00:01.000Z",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("completed evidence assembly", () => {
  it("appends a pending (result-revealed) experiment as completed evidence", () => {
    const evidence = collectCompletedEvidence([experiment1], pendingExperiment2);
    expect(evidence).toHaveLength(2);
    expect(evidence[1]).toBe(pendingExperiment2);
  });

  it("clears current selection when a pending result exists", () => {
    const current = resolveCurrentSelection(pendingExperiment2, {
      stoneA: { ...g03 },
      stoneB: { ...g02 },
    });
    expect(current).toEqual({ stoneA: null, stoneB: null });
  });

  it("keeps current selection only while preparing (no pending result)", () => {
    const current = resolveCurrentSelection(null, {
      stoneA: { ...g03 },
      stoneB: { ...g02 },
    });
    expect(current.stoneA?.id).toBe("G-03");
    expect(current.stoneB?.id).toBe("G-02");
  });

  it("includes Experiment 2 in the wire body immediately after RUN_EXPERIMENT", () => {
    const body = buildRequestBody(makeRequest());
    expect(body.experimentHistory).toHaveLength(2);
    expect(body.experimentHistory[0].winningStoneId).toBe("T-03");
    expect(body.experimentHistory[1].winningStoneId).toBe("G-03");
    expect(body.experimentHistory[1].reflectionStatus).toBe("AWAITING_REFLECTION");
    expect(body.experimentHistory[1].predictionMatched).toBe(true);
    // Must not also appear as the current/upcoming pair.
    expect(body.selectedStones).toEqual({ stoneA: null, stoneB: null });
  });

  it("strips hidden rule metadata from both completed and pending records", () => {
    const wire1 = toWireExperiment(experiment1);
    const wire2 = toWireExperiment(pendingExperiment2);
    const serialized = JSON.stringify([wire1, wire2]);
    expect(serialized).not.toContain("appliedRule");
    expect(serialized).not.toContain("SAME_CHARGE_STRENGTH");
    expect(serialized).not.toContain("internalExplanation");
    expect(wire1.outcome).toBe("STONE_A_WINS");
    expect(wire2.outcome).toBe("STONE_A_WINS");
  });
});

describe("sendResearchPartnerMessage", () => {
  it("sends the condition as llmMode and never a prompt or prompt path", async () => {
    const fetchMock = mockFetch(200, successBody);
    await sendResearchPartnerMessage(
      makeRequest({ condition: "HYPOTHESIS_DRIVEN" as ExperimentalCondition }),
    );

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.llmMode).toBe("HYPOTHESIS_DRIVEN");
    expect(body).not.toHaveProperty("systemPrompt");
    expect(body).not.toHaveProperty("promptPath");
    expect(body).not.toHaveProperty("instructions");
  });

  it("strips hidden rule-engine metadata from the experiment history", async () => {
    const fetchMock = mockFetch(200, successBody);
    await sendResearchPartnerMessage(makeRequest());

    const serialized = fetchMock.mock.calls[0][1].body as string;
    expect(serialized).not.toContain("appliedRule");
    expect(serialized).not.toContain("SAME_CHARGE_STRENGTH");
    expect(serialized).not.toContain("internalExplanation");
    expect(serialized).not.toContain("dominates");

    const body = JSON.parse(serialized);
    expect(body.experimentHistory[0].outcome).toBe("STONE_A_WINS");
    expect(body.experimentHistory[1].winningStoneId).toBe("G-03");
    expect(body.selectedStones).toEqual({ stoneA: null, stoneB: null });
  });

  it("returns the model reply together with research metadata", async () => {
    mockFetch(200, successBody);
    const reply = await sendResearchPartnerMessage(makeRequest());
    expect(reply.message).toBe("Consider isolating one property.");
    expect(reply.promptVersion).toBe("ANALYTICAL_V1");
    expect(reply.model).toBe("gpt-4o");
  });

  it("marks a configuration error as not retryable", async () => {
    mockFetch(503, {
      error: { code: "CONFIGURATION_ERROR", message: "Set OPENAI_API_KEY in .env" },
    });
    await expect(sendResearchPartnerMessage(makeRequest())).rejects.toSatisfy(
      (error: ResearchPartnerError) =>
        error instanceof ResearchPartnerError && error.retryable === false,
    );
  });

  it("answers with a sample reply in the static demo and does not call the network", async () => {
    vi.stubEnv("VITE_DEMO_MODE", "true");
    const fetchMock = mockFetch(500, { error: { message: "should not be called" } });

    const reply = await sendResearchPartnerMessage(makeRequest());

    expect(fetchMock).not.toHaveBeenCalled();
    expect(reply.model).toBe("mock");
    expect(reply.message).toContain("[Development mock response]");
    expect(reply.message).not.toMatch(/ANALYTICAL/i);
  });

  it("marks an upstream failure as retryable", async () => {
    mockFetch(502, {
      error: { code: "UPSTREAM_ERROR", message: "The language model request failed." },
    });
    await expect(sendResearchPartnerMessage(makeRequest())).rejects.toSatisfy(
      (error: ResearchPartnerError) => error instanceof ResearchPartnerError && error.retryable === true,
    );
  });
});
