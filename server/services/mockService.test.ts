import { describe, expect, it } from "vitest";
import type { ResearchPartnerApiRequest } from "../types";
import { generateMockReply } from "./mockService";

function makeRequest(
  llmMode: ResearchPartnerApiRequest["llmMode"],
  locale = "en",
): ResearchPartnerApiRequest {
  return {
    participantId: "P-1",
    sessionId: "S-1",
    experimentId: null,
    llmMode,
    participantMessage: "What should I try next?",
    studyPhase: "ASSISTED",
    experimentsRemaining: 4,
    currentHypothesis: "",
    currentMostImportantProperty: "",
    currentNotes: "",
    selectedStones: { stoneA: null, stoneB: null },
    availableStones: [],
    experimentHistory: [],
    conversationHistory: [],
    locale,
  };
}

describe("mock Research Partner", () => {
  it("never exposes the experimental condition in participant-facing replies", async () => {
    for (const condition of ["ANALYTICAL", "HYPOTHESIS_DRIVEN"] as const) {
      for (let i = 0; i < 6; i++) {
        const message = await generateMockReply(makeRequest(condition), { latencyMs: 0 });
        expect(message).not.toMatch(/ANALYTICAL/i);
        expect(message).not.toMatch(/HYPOTHESIS[_ -]DRIVEN/i);
        expect(message).not.toMatch(/condition/i);
      }
    }
  });

  it("returns clearly marked development responses", async () => {
    const message = await generateMockReply(makeRequest("ANALYTICAL"), { latencyMs: 0 });
    expect(message).toContain("[Development mock response]");
  });

  it("returns localized mock responses for Hebrew", async () => {
    const message = await generateMockReply(makeRequest("ANALYTICAL", "he"), {
      latencyMs: 0,
    });
    expect(message).toContain("[תגובת פיתוח]");
  });
});
