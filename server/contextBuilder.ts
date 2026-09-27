import type { ResearchPartnerApiRequest, WireExperiment, WireStone } from "./types";

/**
 * Renders the participant's current study state as plain text for the model.
 *
 * This is the ONLY place study data becomes model input, and it reads a fixed
 * set of participant-observable fields. Hidden rule-engine information — the
 * decision tree, `appliedRule`, `internalExplanation`, and any answer key —
 * is never read here and so can never reach the model.
 *
 * Affinity dominance / neutral pairs ARE included because they were explicitly
 * given to the participant in the instructions (participant-visible knowledge).
 *
 * Both experimental conditions call this same function with the same data;
 * the manipulation lives entirely in the prompt files.
 *
 * Status rules:
 * - COMPLETED EXPERIMENTS: every entry in experimentHistory has an observed
 *   result and is authoritative evidence.
 * - CURRENT EXPERIMENT: selectedStones only, and only when that pair has NOT
 *   been run yet. A completed/pending-result experiment must never appear here.
 */

/** Participant-visible affinity map, mirrored from the instructions page. */
const PROVIDED_AFFINITY_RELATIONSHIPS_CONTEXT = [
  "PROVIDED AFFINITY RELATIONSHIPS (explicitly given to the participant in the instructions — not something they need to discover):",
  "Dominance cycle: Fire → Earth → Wind → Water → Fire (each affinity dominates the next in the cycle).",
  "Neutral pairs: Fire ↔ Wind, and Water ↔ Earth.",
  "Treat these relationships as shared background knowledge. The participant's task is to discover when strength, charge, and these known affinity relationships matter for outcomes — not to rediscover the affinity map itself.",
  "Do not reveal or invent any additional hidden decision rules beyond what their experiments show.",
].join("\n");

const OUTCOME_TEXT: Record<string, string> = {
  STONE_A_WINS: "Stone A wins",
  STONE_B_WINS: "Stone B wins",
  STALEMATE: "Stalemate",
  MUTUAL_NEUTRALIZATION: "Mutual neutralization",
};

const EVIDENCE_TEXT: Record<string, string> = {
  SUPPORTED: "Supported",
  PARTIALLY_SUPPORTED: "Partially supported",
  CONTRADICTED: "Contradicted",
  UNCLEAR: "Unclear",
};

function humanize(value: string, table: Record<string, string>): string {
  return table[value] ?? value.replace(/_/g, " ").toLowerCase();
}

function titleCase(value: string): string {
  if (!value) return "unknown";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/** Participant-facing affinity names (internal ids remain TIDE/EMBER/GALE/GROVE). */
const AFFINITY_LABELS: Record<string, string> = {
  TIDE: "Water",
  EMBER: "Fire",
  GALE: "Wind",
  GROVE: "Earth",
};

function describeAffinity(affinity: string): string {
  return AFFINITY_LABELS[affinity] ?? titleCase(affinity);
}

function describeStone(stone: WireStone): string {
  return `${describeAffinity(stone.affinity)} (${stone.id}), strength ${stone.strength}, ${titleCase(stone.charge)} charge`;
}

const PROPERTY_TEXT: Record<string, string> = {
  STRENGTH: "Strength",
  CHARGE: "Charge",
  AFFINITY: "Affinity",
  UNSURE: "Unsure",
};

function describeExperiment(experiment: WireExperiment): string {
  const roundLabel =
    experiment.round !== null && experiment.round !== undefined
      ? `Assisted round ${experiment.round}`
      : "Final investigation";

  const property =
    experiment.mostImportantProperty ||
    (experiment.hypothesis ? experiment.hypothesis : "");
  const notes = experiment.notes || experiment.justification || "";

  const lines = [
    `Experiment ${experiment.experimentNumber} (${roundLabel}, #${experiment.roundExperimentNumber} in stage):`,
    `  Status: COMPLETED — observed result is available.`,
    `  Stone A: ${describeStone(experiment.stoneA)}`,
    `  Stone B: ${describeStone(experiment.stoneB)}`,
    `  Participant prediction: ${humanize(experiment.prediction, OUTCOME_TEXT)}`,
    `  Observed result: ${humanize(experiment.outcome, OUTCOME_TEXT)}${
      experiment.winningStoneId ? ` (winning stone: ${experiment.winningStoneId})` : ""
    }`,
    `  Prediction matched observed result: ${experiment.predictionMatched ? "yes" : "no"}`,
  ];
  if (property) {
    lines.push(
      `  Property they thought most important: ${
        PROPERTY_TEXT[property] ?? property
      }`,
    );
  }
  if (notes) {
    lines.push(`  Notes: "${notes}"`);
  }
  if (experiment.reflectionStatus === "AWAITING_REFLECTION") {
    lines.push(
      `  Reflection: awaiting participant reflection (result already observed).`,
    );
  } else {
    if (experiment.evidenceAssessment) {
      lines.push(
        `  Their assessment of the evidence: ${humanize(experiment.evidenceAssessment, EVIDENCE_TEXT)}`,
      );
    }
    if (experiment.observation) {
      lines.push(`  What they took from it: "${experiment.observation}"`);
    }
  }
  return lines.join("\n");
}

export function buildStudyContext(request: ResearchPartnerApiRequest): string {
  const sections: string[] = [];

  sections.push(
    [
      "STUDY CONTEXT (current state of this participant's investigation).",
      "This is the same observational record the participant can see.",
      "The COMPLETED EXPERIMENTS and CURRENT EXPERIMENT sections below are",
      "authoritative. If earlier chat referred to a pair as upcoming and that",
      "pair now appears under COMPLETED EXPERIMENTS, treat it as already run.",
      "The underlying decision hierarchy (when each property applies) has not",
      "been revealed to the participant or to you.",
    ].join(" "),
  );

  sections.push(PROVIDED_AFFINITY_RELATIONSHIPS_CONTEXT);

  sections.push(
    [
      `Study phase: ${humanize(request.studyPhase, {
        ENTRY: "Entry",
        BACKGROUND: "Background questionnaire",
        INSTRUCTIONS: "Instructions",
        ASSISTED: "Investigation",
        FINAL_INVESTIGATION: "Independent investigation",
        TRANSFER: "Independent investigation",
        FINAL_SUBMISSION: "Final rule submission",
        COMPLETE: "Complete",
      })}`,
      `Experiments remaining: ${request.experimentsRemaining}`,
    ].join("\n"),
  );

  if (request.availableStones.length > 0) {
    sections.push(
      ["Available stones:", ...request.availableStones.map((s) => `- ${describeStone(s)}`)].join(
        "\n",
      ),
    );
  }

  sections.push(
    request.experimentHistory.length > 0
      ? [
          "COMPLETED EXPERIMENTS (observed results — do not treat these as upcoming):",
          ...request.experimentHistory.map(describeExperiment),
        ].join("\n\n")
      : "COMPLETED EXPERIMENTS: none.",
  );

  const { stoneA, stoneB } = request.selectedStones;
  if (stoneA || stoneB) {
    sections.push(
      [
        "CURRENT EXPERIMENT (being prepared; NOT yet run — no observed result yet):",
        `- Stone A: ${stoneA ? describeStone(stoneA) : "not selected"}`,
        `- Stone B: ${stoneB ? describeStone(stoneB) : "not selected"}`,
      ].join("\n"),
    );
  } else {
    sections.push(
      "CURRENT EXPERIMENT: none. (No pair is currently being prepared. Do not invent an upcoming experiment.)",
    );
  }

  sections.push(
    request.currentMostImportantProperty
      ? `Property the participant currently thinks is most important: ${
          PROPERTY_TEXT[request.currentMostImportantProperty] ??
          request.currentMostImportantProperty
        }`
      : request.currentHypothesis.trim().length > 0
        ? `Participant's current hypothesis: "${request.currentHypothesis}"`
        : "Property the participant currently thinks is most important: none recorded yet.",
  );
  if (request.currentNotes?.trim()) {
    sections.push(`Participant's current notes: "${request.currentNotes.trim()}"`);
  }

  if (request.locale && request.locale !== "en") {
    sections.push(
      `The participant's interface language is "${request.locale}". Reply in that language.`,
    );
  }

  return sections.join("\n\n");
}
