import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { serverConfig } from "../config";
import { PromptLoadError } from "../promptLoader";
import { generateMockReply } from "../services/mockService";
import {
  ConfigurationError,
  UpstreamError,
  generateResearchPartnerReply,
} from "../services/openaiService";
import type { ApiErrorBody, ResearchPartnerApiResponse } from "../types";
import { validateRequest } from "../validation";

function sendError(
  res: Response,
  status: number,
  code: ApiErrorBody["error"]["code"],
  message: string,
): void {
  res.status(status).json({ error: { code, message } } satisfies ApiErrorBody);
}

export async function handleResearchPartner(req: Request, res: Response): Promise<void> {
  const userMessageTimestamp = new Date().toISOString();

  const validation = validateRequest(req.body);
  if (!validation.ok || !validation.value) {
    sendError(res, 400, "VALIDATION_ERROR", validation.errors.join(" "));
    return;
  }
  const request = validation.value;

  const startedAt = Date.now();
  try {
    const message = serverConfig.useMockLlm
      ? await generateMockReply(request)
      : await generateResearchPartnerReply(request);

    const body: ResearchPartnerApiResponse = {
      message,
      interactionId: randomUUID(),
      promptVersion: serverConfig.useMockLlm
        ? `MOCK_${serverConfig.promptVersions[request.llmMode]}`
        : serverConfig.promptVersions[request.llmMode],
      model: serverConfig.useMockLlm ? "mock" : serverConfig.model,
      responseLatencyMs: Date.now() - startedAt,
      userMessageTimestamp,
      llmResponseTimestamp: new Date().toISOString(),
    };
    res.json(body);
  } catch (error) {
    if (error instanceof ConfigurationError || error instanceof PromptLoadError) {
      // Server-side misconfiguration: actionable for the researcher, and free
      // of environment values or secrets.
      console.error(`[research-partner] configuration problem: ${error.message}`);
      sendError(res, 503, "CONFIGURATION_ERROR", error.message);
      return;
    }
    if (error instanceof UpstreamError) {
      console.error(`[research-partner] upstream problem: ${error.message}`);
      sendError(res, 502, "UPSTREAM_ERROR", error.message);
      return;
    }
    console.error("[research-partner] unexpected error", error);
    sendError(res, 500, "INTERNAL_ERROR", "The Research Partner request failed.");
  }
}
