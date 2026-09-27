import type {
  Affinity,
  DecisionConditionId,
  EvidenceAssessment,
  ExperimentOutcome,
  TerminalOutcomeId,
} from "../types";

export type Locale = "en" | "he" | "ar";

export interface OutcomeStrings {
  label: string;
  description: string;
}


export interface Translations {
  language: {
    label: string;
    en: string;
    he: string;
    ar: string;
  };
  app: {
    title: string;
    subtitle: string;
    saveError: string;
    mainAria: string;
    /** Shown on the public static demo, where replies are sample text. */
    demoNotice: string;
  };
  entry: {
    title: string;
    subtitle: string;
    participantMode: string;
    participantDescription: string;
    testingMode: string;
    testingDescription: string;
    testingConditionLabel: string;
    conditionLabel: string;
    beginParticipant: string;
    beginTesting: string;
  };
  background: {
    title: string;
    subtitle: string;
    participantId: string;
    ageLabel: string;
    ageHint: string;
    educationLabel: string;
    fieldLabel: string;
    fieldPlaceholder: string;
    llmExperienceLabel: string;
    aiLearningFrequencyLabel: string;
    aiConfidenceLabel: string;
    beginStudy: string;
    validationAge: string;
    validationEducation: string;
    validationField: string;
    validationLlmExperience: string;
    validationAiLearningFrequency: string;
    validationAiConfidence: string;
    conditionMissing: string;
  };
  instructions: {
    title: string;
    subtitle: string;
    introWelcome: string;
    introDiscovery: string;
    introTask: string;
    introPartner: string;
    propertiesTitle: string;
    affinityLabel: string;
    strengthLabel: string;
    chargeLabel: string;
    outcomesTitle: string;
    outcomes: {
      stoneAWins: string;
      stoneBWins: string;
      stalemate: string;
      neutralization: string;
    };
    affinityMapTitle: string;
    affinityMapGiven: string;
    dominanceTitle: string;
    dominanceHint: string;
    dominanceCycleText: string;
    neutralTitle: string;
    neutralHint: string;
    affinityMapFootnote: string;
    goalTitle: string;
    goalIntro: string;
    goalAffinity: string;
    goalTask: string;
    startButton: string;
    helpButton: string;
    closeButton: string;
    dialogAria: string;
    pageAria: string;
  };
  educationLevel: {
    highSchoolOrBelow: string;
    bachelors: string;
    masters: string;
    doctorate: string;
    other: string;
  };
  llmExperience: {
    never: string;
    rarely: string;
    sometimes: string;
    frequently: string;
    veryFrequently: string;
  };
  aiProblemSolvingConfidence: {
    notAtAll: string;
    slightly: string;
    moderately: string;
    very: string;
    extremely: string;
  };
  phase: {
    assisted: string;
    finalInvestigation: string;
    complete: string;
    progressAria: string;
    /** {{round}}, {{total}} */
    roundLabel: string;
    /** {{used}}, {{total}} */
    experimentsCounter: string;
    /** {{used}}, {{total}} */
    inquiriesCounter: string;
    /** {{used}}, {{total}} */
    experimentsUsedAria: string;
  };
  round: {
    /** {{round}} */
    completeTitle: string;
    completeBody: string;
    /** {{round}} */
    continueNext: string;
    continueFinal: string;
    /** {{used}}, {{min}} */
    needMoreInquiries: string;
  };
  history: {
    title: string;
    empty: string;
    experiment: string;
    prediction: string;
    actualResult: string;
    mostImportantProperty: string;
    notes: string;
    evidenceAssessment: string;
    observation: string;
    completed: string;
    /** {{id}} */
    winnerSuffix: string;
  };
  partner: {
    title: string;
    subtitle: string;
    empty: string;
    inputLabel: string;
    placeholder: string;
    send: string;
    error: string;
    typing: string;
    retry: string;
    you: string;
    partner: string;
    devClear: string;
    unavailable: string;
    limitReached: string;
    readOnly: string;
  };
  stones: {
    available: string;
    hint: string;
    ariaGroup: string;
    strength: string;
    charge: string;
    id: string;
    /** {{slot}} */
    stoneSlot: string;
    /** {{affinity}}, {{id}}, {{strength}}, {{charge}} */
    ariaDescription: string;
    /** {{slot}} appended when selected */
    ariaSelectedSuffix: string;
  };
  affinities: Record<Affinity, string>;
  charges: { positive: string; negative: string };
  selectedPair: {
    title: string;
    clear: string;
    stoneA: string;
    stoneB: string;
    selectFirst: string;
    selectSecond: string;
    vs: string;
  };
  prediction: {
    title: string;
    hint: string;
    aria: string;
  };
  outcomes: Record<ExperimentOutcome, OutcomeStrings>;
  hypothesis: {
    title: string;
    propertyLabel: string;
    properties: {
      STRENGTH: string;
      CHARGE: string;
      AFFINITY: string;
      UNSURE: string;
    };
    notesLabel: string;
    notesOptional: string;
    notesHint: string;
  };
  controls: {
    run: string;
    selectStones: string;
    choosePrediction: string;
    chooseProperty: string;
  };
  experimentStage: {
    title: string;
    running: string;
    winner: string;
    stoneA: string;
    stoneB: string;
    yourPrediction: string;
    matched: string;
    notMatched: string;
  };
  reflection: {
    title: string;
    hint: string;
    evidenceLabel: string;
    observationLabel: string;
    observationOptional: string;
    incomplete: string;
    submit: string;
  };
  evidence: Record<EvidenceAssessment, string>;
  complete: {
    title: string;
    body: string;
    downloadsTitle: string;
    downloadsHint: string;
    downloadFinalReport: string;
    downloadExperiments: string;
    downloadParticipant: string;
    downloadLlm: string;
    downloadJson: string;
  };
  finalInvestigation: {
    title: string;
    partnerNote: string;
    /** {{count}} */
    experimentsNote: string;
    modelNote: string;
  };
  tree: {
    title: string;
    intro: string;
    bankConditionsTitle: string;
    bankOutcomesTitle: string;
    bankHint: string;
    /** {{number}} */
    nodeTitle: string;
    /** {{number}} */
    terminalTitle: string;
    emptyNode: string;
    emptyTerminal: string;
    yes: string;
    no: string;
    branchAria: string;
    remove: string;
    caseLabel: string;
    outcomeLabel: string;
    /** Derived YES/NO meanings for path chips — not hidden-rule cases. */
    pathSegments: {
      SAME_CHARGE: string;
      DIFFERENT_CHARGE: string;
      SAME_STRENGTH: string;
      DIFFERENT_STRENGTH: string;
      SAME_AFFINITY: string;
      DIFFERENT_AFFINITY: string;
      NEUTRAL_AFFINITY_PAIR: string;
      NON_NEUTRAL_AFFINITY_PAIR: string;
    };
    conditions: Record<DecisionConditionId, string>;
    outcomes: Record<TerminalOutcomeId, string>;
  };
  affinityMap: {
    title: string;
    intro: string;
    /** {{winner}}, {{loser}} */
    beats: string;
    neutral: string;
    unset: string;
    /** {{first}}, {{second}} */
    pairAria: string;
    /** Read-only reference panel shown in the final stage. */
    referenceTitle: string;
    referenceIntro: string;
  };
  finalModel: {
    title: string;
    hint: string;
    notesLabel: string;
    confidenceLabel: string;
    /** {{min}}, {{max}} */
    confidenceHint: string;
    /** {{count}} */
    incomplete: string;
    submit: string;
  };
  mockPartner: {
    prefix: string;
    analytical: readonly string[];
    hypothesisDriven: readonly string[];
    /** {{count}} */
    remaining: string;
    remainingOne: string;
    allUsed: string;
  };
}
