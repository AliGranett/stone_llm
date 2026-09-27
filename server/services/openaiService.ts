import OpenAI from "openai";
import { getApiKey, serverConfig } from "../config";
import { buildStudyContext } from "../contextBuilder";
import { loadSystemPrompt } from "../promptLoader";
import type { ResearchPartnerApiRequest } from "../types";

/**
 * The single place an OpenAI call is made. Uses the Responses API (the
 * recommended interface in openai-node v7), which keeps the researcher's
 * system prompt (`instructions`) structurally separate from the runtime study
 * context and conversation (`input`).
 */

export class ConfigurationError extends Error {}
export class UpstreamError extends Error {}

let client: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new ConfigurationError(
      "The Research Partner is not configured on the server. Set OPENAI_API_KEY in .env (copy .env.example), or set USE_MOCK_LLM=true to run without OpenAI.",
    );
  }
  if (!client) {
    client = new OpenAI({ apiKey, maxRetries: 1, timeout: 60_000 });
  }
  return client;
}

export interface ModelRequest {
  model: string;
  /** SYSTEM: the researcher's prompt file, verbatim. */
  instructions: string;
  input: Array<{ role: "user" | "assistant" | "developer"; content: string }>;
}

/**
 * Assembles the exact payload sent to the model, keeping the four layers
 * separate: the prompt file is passed as `instructions` and is never rewritten,
 * while the runtime study context, prior conversation, and the newest
 * participant message are separate entries in `input`.
 *
 * Exported so the payload can be asserted in tests without a network call.
 */
export async function buildModelRequest(
  request: ResearchPartnerApiRequest,
): Promise<ModelRequest> {
  return {
    model: serverConfig.model,
    instructions: await loadSystemPrompt(request.llmMode),
    input: [
      { role: "developer", content: buildStudyContext(request) },
      ...request.conversationHistory.map((message) => ({
        role: (message.role === "PARTNER" ? "assistant" : "user") as "assistant" | "user",
        content: message.content,
      })),
      { role: "user", content: request.participantMessage },
    ],
  };
}

export async function generateResearchPartnerReply(
  request: ResearchPartnerApiRequest,
): Promise<string> {
  const openai = getClient();
  const payload = await buildModelRequest(request);

  let response;
  try {
    response = await openai.responses.create(payload);
  } catch (error) {
    // Deliberately does not echo the SDK error, which can include request
    // details. The key is never part of this message.
    const status =
      error instanceof OpenAI.APIError && error.status ? ` (status ${error.status})` : "";
    throw new UpstreamError(`The language model request failed${status}.`);
  }

  const text = response.output_text?.trim();
  if (!text) {
    throw new UpstreamError("The language model returned an empty response.");
  }
  return text;
}
