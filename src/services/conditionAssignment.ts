import { studyConfig } from "../config/studyConfig";
import type { ExperimentalCondition } from "../types";

/**
 * Parses a condition value from a URL parameter or config string.
 * Accepts ANALYTICAL, HYPOTHESIS_DRIVEN, and common lowercase/hyphen variants.
 */
export function parseConditionParam(
  value: string | null | undefined,
): ExperimentalCondition | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase().replace(/-/g, "_");
  if (normalized === "ANALYTICAL") return "ANALYTICAL";
  if (normalized === "HYPOTHESIS_DRIVEN" || normalized === "HYPOTHESISDRIVEN") {
    return "HYPOTHESIS_DRIVEN";
  }
  return null;
}

/**
 * Returns the manually configured condition for this session, if any.
 *
 * Priority:
 *  1. `?condition=` or `?llm=` URL parameter (experimenter-supplied link)
 *  2. `studyConfig.fixedCondition` (deployment-wide default)
 *
 * Returns null when neither is set — the session must not auto-assign.
 */
export function resolveManualCondition(search?: string): ExperimentalCondition | null {
  const query =
    search ??
    (typeof window !== "undefined" ? (window.location?.search ?? "") : "");
  const params = new URLSearchParams(query);
  const fromUrl =
    parseConditionParam(params.get("condition")) ??
    parseConditionParam(params.get("llm"));
  if (fromUrl) return fromUrl;
  if (studyConfig.fixedCondition) return studyConfig.fixedCondition;
  return null;
}

/** Whether a manual condition is available for Participant Mode. */
export function hasManualCondition(search?: string): boolean {
  return resolveManualCondition(search) !== null;
}
