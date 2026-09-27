import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { LlmMode } from "./types";

const PROMPTS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "prompts");

/**
 * Fixed mapping from experimental condition to prompt file. The client sends
 * only the condition enum; filenames never cross the network, so a malicious
 * or buggy client cannot request an arbitrary path.
 */
const PROMPT_FILES: Record<LlmMode, string> = {
  ANALYTICAL: "analytical_prompt.txt",
  HYPOTHESIS_DRIVEN: "hypothesis_driven_prompt.txt",
};

export class PromptLoadError extends Error {}

/**
 * Reads the prompt file for a condition. Not cached: editing a .txt file takes
 * effect on the next message, with no server restart or code change.
 */
export async function loadSystemPrompt(mode: LlmMode): Promise<string> {
  const filename = PROMPT_FILES[mode];
  if (!filename) {
    throw new PromptLoadError(`No prompt file is mapped for condition "${mode}".`);
  }

  const path = join(PROMPTS_DIR, filename);
  // Defence in depth: the resolved path must stay inside prompts/.
  if (!resolve(path).startsWith(PROMPTS_DIR)) {
    throw new PromptLoadError("Resolved prompt path escaped the prompts directory.");
  }

  try {
    const contents = await readFile(path, "utf8");
    if (contents.trim().length === 0) {
      throw new PromptLoadError(`Prompt file "${filename}" is empty.`);
    }
    return contents;
  } catch (error) {
    if (error instanceof PromptLoadError) throw error;
    throw new PromptLoadError(`Could not read prompt file "${filename}".`);
  }
}

export function getPromptFilename(mode: LlmMode): string {
  return PROMPT_FILES[mode];
}
