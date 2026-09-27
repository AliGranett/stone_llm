import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { LlmMode } from "./types";

/** Load .env from the repo root, not process.cwd() (which can differ under npm/concurrently). */
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(projectRoot, ".env") });

function boolFromEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.trim().toLowerCase() === "true";
}

/**
 * Server-only configuration. Nothing here is ever sent to the browser, and
 * the API key is only read at call time by the OpenAI service.
 */
export const serverConfig = {
  port: Number(process.env.SERVER_PORT ?? 3001),
  model: process.env.OPENAI_MODEL?.trim() || "gpt-4o",
  /**
   * Sample replies when USE_MOCK_LLM=true, or when it is unset and no API
   * key is configured. An explicit USE_MOCK_LLM=false still requires a key.
   */
  useMockLlm: process.env.USE_MOCK_LLM === undefined
    ? !isApiKeyConfigured()
    : boolFromEnv(process.env.USE_MOCK_LLM, false),

  /** Recorded with each interaction so data can be traced to prompt text. */
  promptVersions: {
    ANALYTICAL: process.env.ANALYTICAL_PROMPT_VERSION?.trim() || "ANALYTICAL_V1",
    HYPOTHESIS_DRIVEN:
      process.env.HYPOTHESIS_DRIVEN_PROMPT_VERSION?.trim() ||
      "HYPOTHESIS_DRIVEN_V1",
  } satisfies Record<LlmMode, string>,
} as const;

/** Reads the key on demand; never logged, never returned in a response. */
export function getApiKey(): string | undefined {
  const key = process.env.OPENAI_API_KEY?.trim().replace(/^['"]|['"]$/g, "");
  // Treat the placeholder from .env.example as "not configured".
  if (!key || key === "replace_with_your_openai_api_key") return undefined;
  return key;
}

export function isApiKeyConfigured(): boolean {
  return getApiKey() !== undefined;
}
