import type {
  Affinity,
  Charge,
  EvidenceAssessment,
  ExperimentOutcome,
} from "../types";

/**
 * Single source of truth for affinity presentation (labels + colors).
 * Icons live in components/icons/AffinityIcon.tsx and key off the same
 * Affinity union, so no mapping is duplicated elsewhere.
 */
export interface AffinityMeta {
  label: string;
  /** Primary identity color (must pass contrast against white text). */
  primary: string;
  /** Darker shade used in gradients and borders. */
  deep: string;
  /** Light tint for backgrounds and chips. */
  light: string;
}

export const AFFINITY_META: Record<Affinity, AffinityMeta> = {
  TIDE: { label: "Water", primary: "#2563EB", deep: "#1E40AF", light: "#DBEAFE" },
  EMBER: { label: "Fire", primary: "#EA580C", deep: "#9A3412", light: "#FFEDD5" },
  GALE: { label: "Wind", primary: "#64748B", deep: "#334155", light: "#E2E8F0" },
  GROVE: { label: "Earth", primary: "#166534", deep: "#14532D", light: "#DCFCE7" },
};

export const AFFINITIES: Affinity[] = ["TIDE", "EMBER", "GALE", "GROVE"];

/** Participant-facing labels for outcomes/predictions — defined once. */
export const OUTCOME_META: Record<
  ExperimentOutcome,
  { label: string; description: string }
> = {
  STONE_A_WINS: {
    label: "Stone A wins",
    description: "Stone A overpowers Stone B.",
  },
  STONE_B_WINS: {
    label: "Stone B wins",
    description: "Stone B overpowers Stone A.",
  },
  STALEMATE: {
    label: "Stalemate",
    description: "Neither stone gains the upper hand.",
  },
  MUTUAL_NEUTRALIZATION: {
    label: "Mutual neutralization",
    description: "Both stones cancel each other out.",
  },
};

export const OUTCOME_ORDER: ExperimentOutcome[] = [
  "STONE_A_WINS",
  "STONE_B_WINS",
  "STALEMATE",
  "MUTUAL_NEUTRALIZATION",
];

export const CHARGE_META: Record<Charge, { label: string; symbol: string }> = {
  POSITIVE: { label: "Positive", symbol: "+" },
  NEGATIVE: { label: "Negative", symbol: "−" },
};

export const EVIDENCE_META: Record<EvidenceAssessment, { label: string }> = {
  SUPPORTED: { label: "Supported" },
  PARTIALLY_SUPPORTED: { label: "Partially supported" },
  CONTRADICTED: { label: "Contradicted" },
  UNCLEAR: { label: "Unclear" },
};

export const EVIDENCE_ORDER: EvidenceAssessment[] = [
  "SUPPORTED",
  "PARTIALLY_SUPPORTED",
  "CONTRADICTED",
  "UNCLEAR",
];
