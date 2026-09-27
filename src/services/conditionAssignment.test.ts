import { afterEach, describe, expect, it } from "vitest";
import { studyConfig } from "../config/studyConfig";
import {
  hasManualCondition,
  parseConditionParam,
  resolveManualCondition,
} from "./conditionAssignment";

describe("parseConditionParam", () => {
  it("accepts canonical condition names", () => {
    expect(parseConditionParam("ANALYTICAL")).toBe("ANALYTICAL");
    expect(parseConditionParam("HYPOTHESIS_DRIVEN")).toBe("HYPOTHESIS_DRIVEN");
  });

  it("accepts lowercase and hyphenated variants", () => {
    expect(parseConditionParam("analytical")).toBe("ANALYTICAL");
    expect(parseConditionParam("hypothesis-driven")).toBe("HYPOTHESIS_DRIVEN");
  });

  it("returns null for unknown values", () => {
    expect(parseConditionParam("creative")).toBeNull();
    expect(parseConditionParam("")).toBeNull();
  });
});

describe("resolveManualCondition", () => {
  afterEach(() => {
    studyConfig.fixedCondition = null;
  });

  it("prefers the URL parameter over fixedCondition", () => {
    studyConfig.fixedCondition = "ANALYTICAL";
    expect(
      resolveManualCondition("?condition=HYPOTHESIS_DRIVEN"),
    ).toBe("HYPOTHESIS_DRIVEN");
  });

  it("falls back to fixedCondition when the URL has no condition", () => {
    studyConfig.fixedCondition = "ANALYTICAL";
    expect(resolveManualCondition("")).toBe("ANALYTICAL");
  });

  it("reads the llm alias parameter", () => {
    expect(resolveManualCondition("?llm=analytical")).toBe("ANALYTICAL");
  });

  it("returns null when nothing is configured", () => {
    expect(resolveManualCondition("")).toBeNull();
    expect(hasManualCondition("")).toBe(false);
  });
});

describe("hasManualCondition", () => {
  afterEach(() => {
    studyConfig.fixedCondition = null;
  });

  it("is true when a manual condition is available", () => {
    studyConfig.fixedCondition = "HYPOTHESIS_DRIVEN";
    expect(hasManualCondition()).toBe(true);
  });
});
