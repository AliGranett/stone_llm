import { getTranslations } from "../i18n";
import { interpolate } from "../i18n/interpolate";
import type { Locale } from "../i18n/types";
import type { ExperimentalCondition } from "../types";

/**
 * Sample Research Partner replies. Used by the local server when
 * USE_MOCK_LLM is on, and by the static demo site (no API key, no server).
 * Replies are clearly marked so they cannot be mistaken for model output.
 */

const LOCALES: Locale[] = ["en", "he", "ar"];
let callCount = 0;

export interface MockReplyInput {
  llmMode: ExperimentalCondition;
  locale?: string;
  experimentsRemaining: number;
}

function resolveLocale(value: string | undefined): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : "en";
}

export async function generateMockReply(
  request: MockReplyInput,
  /** Simulated think time; set to 0 in tests. */
  options: { latencyMs?: number } = {},
): Promise<string> {
  const latencyMs = options.latencyMs ?? 500;
  if (latencyMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, latencyMs + Math.random() * 400));
  }

  const strings = getTranslations(resolveLocale(request.locale)).mockPartner;
  const prompts =
    request.llmMode === "ANALYTICAL" ? strings.analytical : strings.hypothesisDriven;
  const prompt = prompts[callCount % prompts.length];
  callCount += 1;

  const remaining = request.experimentsRemaining;
  const contextNote =
    remaining > 0
      ? remaining === 1
        ? strings.remainingOne
        : interpolate(strings.remaining, { count: remaining })
      : strings.allUsed;

  return `${strings.prefix} ${prompt} ${contextNote}`;
}
