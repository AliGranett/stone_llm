import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import { getPromptFilename, loadSystemPrompt } from "./promptLoader";

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual, readFile: vi.fn(actual.readFile) };
});

describe("promptLoader", () => {
  it("maps each condition to its own prompt file", () => {
    expect(getPromptFilename("ANALYTICAL")).toBe("analytical_prompt.txt");
    expect(getPromptFilename("HYPOTHESIS_DRIVEN")).toBe("hypothesis_driven_prompt.txt");
  });

  it("loads the analytical prompt from disk", async () => {
    const prompt = await loadSystemPrompt("ANALYTICAL");
    expect(prompt).toContain("ANALYZE the available evidence");
  });

  it("loads the hypothesis-driven prompt from disk", async () => {
    const prompt = await loadSystemPrompt("HYPOTHESIS_DRIVEN");
    expect(prompt).toContain("DEVELOP AND APPLY A SYSTEMATIC METHOD");
  });

  it("gives the two conditions different prompt text", async () => {
    const analytical = await loadSystemPrompt("ANALYTICAL");
    const hypothesisDriven = await loadSystemPrompt("HYPOTHESIS_DRIVEN");
    expect(analytical).not.toBe(hypothesisDriven);
  });

  it("re-reads the file on every call, so prompt edits take effect immediately", async () => {
    // Nothing is cached: editing a .txt file changes the next request's
    // system prompt with no restart and no source change.
    vi.mocked(readFile).mockClear();
    await loadSystemPrompt("ANALYTICAL");
    await loadSystemPrompt("ANALYTICAL");
    expect(vi.mocked(readFile)).toHaveBeenCalledTimes(2);
  });

  it("cannot be pointed at a path outside prompts/", async () => {
    // Only the two enum values are mapped; anything else has no filename.
    await expect(
      // @ts-expect-error deliberately invalid condition
      loadSystemPrompt("../../.env"),
    ).rejects.toThrow(/No prompt file is mapped/);
  });
});
