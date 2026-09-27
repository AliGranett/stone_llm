import type { Translations } from "./types";

export const en: Translations = {
  language: {
    label: "Language",
    en: "English",
    he: "עברית",
    ar: "العربية",
  },
  app: {
    title: "Asterion Crystal Laboratory",
    subtitle: "Investigate how the crystals interact",
    saveError:
      "Your progress could not be saved in this browser. Please avoid refreshing the page.",
    mainAria: "Study",
    demoNotice:
      "Demo mode. The Research Partner replies with sample answers so you can try the interface. Nothing you type is sent to a language model.",
  },
  entry: {
    title: "Welcome",
    subtitle: "Choose how you would like to begin.",
    participantMode: "Participant Mode",
    participantDescription:
      "Begin the study as a research participant. Choose the Research Partner style, then answer a few background questions before starting.",
    testingMode: "Testing Mode",
    testingDescription:
      "Preview the study and choose which Research Partner style to test.",
    conditionLabel: "Research Partner style",
    /** @deprecated Use conditionLabel */
    testingConditionLabel: "Research Partner style",
    beginParticipant: "Begin study",
    beginTesting: "Begin testing",
  },
  background: {
    title: "Background information",
    subtitle:
      "Please answer the following questions before you begin. Your responses help us understand who took part in the study.",
    participantId: "Session ID",
    ageLabel: "Age",
    ageHint: "Enter your age in years",
    educationLabel: "Education level",
    fieldLabel: "Field of study or occupation",
    fieldPlaceholder: "e.g. Biology, software engineering, teacher",
    llmExperienceLabel: "How often have you used AI language tools (such as ChatGPT)?",
    aiLearningFrequencyLabel:
      "How often do you use AI tools for learning or problem solving?",
    aiConfidenceLabel:
      "How confident are you in using AI tools to help solve unfamiliar problems?",
    beginStudy: "Begin study",
    validationAge: "Please enter a valid age (1–120).",
    validationEducation: "Please select your education level.",
    validationField: "Please enter your field of study or occupation.",
    validationLlmExperience: "Please select how often you have used AI language tools.",
    validationAiLearningFrequency:
      "Please select how often you use AI tools for learning or problem solving.",
    validationAiConfidence:
      "Please select how confident you are using AI tools to solve unfamiliar problems.",
    conditionMissing:
      "This session has no Research Partner style assigned. The experimenter must open the study with ?condition=ANALYTICAL or ?condition=HYPOTHESIS_DRIVEN in the link, or configure a fixed condition for this deployment.",
  },
  instructions: {
    title: "How crystals work",
    subtitle: "A quick overview before you begin investigating.",
    introWelcome: "Welcome to the Asterion Crystal Laboratory.",
    introDiscovery:
      "Researchers have discovered a collection of unusual crystals that interact in predictable ways—but the rules governing these interactions are unknown.",
    introTask:
      "Your task is to conduct experiments, observe what happens, and gradually work out how the system works.",
    introPartner:
      "A Research Partner will be available during the investigation to help you think through the evidence.",
    propertiesTitle: "What does a crystal have?",
    affinityLabel: "Affinity",
    strengthLabel: "Strength",
    chargeLabel: "Charge",
    outcomesTitle: "What can happen?",
    outcomes: {
      stoneAWins: "Crystal A wins",
      stoneBWins: "Crystal B wins",
      stalemate: "Stalemate",
      neutralization: "Mutual neutralization",
    },
    affinityMapTitle: "Affinity relationships (given information)",
    affinityMapGiven:
      "These affinity relationships are provided to you from the start. You do not need to discover which affinities dominate which, or which pairs are neutral.",
    dominanceTitle: "Dominance cycle",
    dominanceHint: "Each affinity dominates the next in this cycle:",
    dominanceCycleText: "Fire → Earth → Wind → Water → Fire",
    neutralTitle: "Neutral pairs",
    neutralHint: "These pairs have no dominance relationship:",
    affinityMapFootnote:
      "What you still need to discover is when affinity relationships matter for an outcome — and when strength or charge matters instead. The overall decision process remains unknown.",
    goalTitle: "Your goal",
    goalIntro:
      "The outcome of an interaction may depend on a crystal's affinity, strength, charge, or a combination of these properties.",
    goalAffinity:
      "You already know how affinities relate to each other. Your task is to find out when those relationships decide the winner, and when other properties do.",
    goalTask:
      "Conduct experiments, look for patterns, develop hypotheses, and discover when the different properties matter.",
    startButton: "Start Investigation",
    helpButton: "Instructions",
    closeButton: "Close",
    dialogAria: "Crystal system instructions",
    pageAria: "Study instructions",
  },
  educationLevel: {
    highSchoolOrBelow: "High school or below",
    bachelors: "Bachelor's degree / currently studying toward one",
    masters: "Master's degree / currently studying toward one",
    doctorate: "Doctoral degree",
    other: "Other",
  },
  llmExperience: {
    never: "Never",
    rarely: "Rarely",
    sometimes: "Sometimes",
    frequently: "Frequently",
    veryFrequently: "Very frequently",
  },
  aiProblemSolvingConfidence: {
    notAtAll: "Not at all confident",
    slightly: "Slightly confident",
    moderately: "Moderately confident",
    very: "Very confident",
    extremely: "Extremely confident",
  },
  phase: {
    assisted: "Investigation",
    finalInvestigation: "Final Investigation",
    complete: "Study Complete",
    progressAria: "Study progress",
    roundLabel: "Round {{round}} of {{total}}",
    experimentsCounter: "Experiments: {{used}} / {{total}}",
    inquiriesCounter: "Research Partner inquiries: {{used}} / {{total}}",
    experimentsUsedAria: "{{used}} of {{total}} experiments used",
  },
  round: {
    completeTitle: "Round {{round}} complete",
    completeBody:
      "You have completed the experiments for this round. When you are ready, continue to the next part of the study.",
    continueNext: "Continue to Round {{round}}",
    continueFinal: "Continue to the Final Investigation",
    needMoreInquiries:
      "Before continuing, please discuss your investigation with the Research Partner. You have used {{used}} of the {{min}} required inquiries for this round.",
  },
  history: {
    title: "Experiment history",
    empty: "No experiments yet. Completed experiments will appear here.",
    experiment: "Experiment {{number}}",
    prediction: "Prediction",
    actualResult: "Actual result",
    mostImportantProperty: "Most important property",
    notes: "Notes",
    evidenceAssessment: "Evidence assessment",
    observation: "What you learned",
    completed: "Completed",
    winnerSuffix: " (winner: {{id}})",
  },
  partner: {
    title: "Research Partner",
    subtitle: "Discuss your ideas, plans, and results with your research partner.",
    empty: "No messages yet. Ask your research partner anything about your investigation.",
    inputLabel: "Message to Research Partner",
    placeholder: "Type a message…",
    send: "Send",
    error:
      "The Research Partner could not respond right now. Your message was saved — please try again.",
    typing: "Research Partner is typing",
    retry: "Try again",
    you: "You",
    partner: "Research Partner",
    devClear: "Clear conversation (dev)",
    unavailable:
      "The Research Partner is unavailable during this part of the study. Continue the investigation independently.",
    limitReached:
      "You have used all Research Partner inquiries for this round. You will receive a new set of inquiries in the next round.",
    readOnly:
      "The Research Partner is no longer available. Your earlier conversation remains here for reference.",
  },
  stones: {
    available: "Available stones",
    hint: "Select two stones to compare. Select a stone again to deselect it.",
    ariaGroup: "Available stones",
    strength: "Strength",
    charge: "Charge",
    id: "ID",
    stoneSlot: "Stone {{slot}}",
    ariaDescription:
      "{{affinity}} stone {{id}}, strength {{strength}}, {{charge}} charge",
    ariaSelectedSuffix: ". Currently selected as Stone {{slot}}",
  },
  affinities: {
    TIDE: "Water",
    EMBER: "Fire",
    GALE: "Wind",
    GROVE: "Earth",
  },
  charges: { positive: "Positive", negative: "Negative" },
  selectedPair: {
    title: "Selected pair",
    clear: "Clear selection",
    stoneA: "Stone A",
    stoneB: "Stone B",
    selectFirst: "Select a first stone",
    selectSecond: "Select a second stone",
    vs: "vs",
  },
  prediction: {
    title: "Your prediction",
    hint: "What do you expect to happen when these stones interact?",
    aria: "Predicted outcome",
  },
  outcomes: {
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
  },
  hypothesis: {
    title: "Your current idea",
    propertyLabel: "Which property do you currently think is most important?",
    properties: {
      STRENGTH: "Strength",
      CHARGE: "Charge",
      AFFINITY: "Affinity",
      UNSURE: "I'm not sure",
    },
    notesLabel: "Notes",
    notesOptional: "(optional)",
    notesHint:
      "Anything you want to remember about this experiment, your thinking, or something to investigate later.",
  },
  controls: {
    run: "Run experiment",
    selectStones: "Select two stones to compare.",
    choosePrediction: "Choose a predicted outcome.",
    chooseProperty: "Choose which property you currently think is most important.",
  },
  experimentStage: {
    title: "Experiment {{number}}",
    running: "Running experiment…",
    winner: "Winner",
    stoneA: "Stone A",
    stoneB: "Stone B",
    yourPrediction: "Your prediction",
    matched: "matched the result",
    notMatched: "did not match the result",
  },
  reflection: {
    title: "Reflection",
    hint: "A quick check before your next experiment.",
    evidenceLabel: "Does this result support your theory/hypothesis?",
    observationLabel: "What did you learn from this result?",
    observationOptional: "(optional)",
    incomplete: "Select whether this result supports your theory to continue.",
    submit: "Save reflection and continue",
  },
  evidence: {
    SUPPORTED: "Supported",
    PARTIALLY_SUPPORTED: "Partially supported",
    CONTRADICTED: "Contradicted",
    UNCLEAR: "Unclear",
  },
  complete: {
    title: "Thank you!",
    body: "Your final answer has been submitted. You may now close this window, or review your experiment history and conversation.",
    downloadsTitle: "Research data downloads",
    downloadsHint:
      "Download study data for analysis. These options are available in Testing Mode only.",
    downloadFinalReport: "Download final report (CSV)",
    downloadExperiments: "Download experiment data (CSV)",
    downloadParticipant: "Download participant.csv",
    downloadLlm: "Download llm_interactions.csv",
    downloadJson: "Download full study JSON",
  },
  finalInvestigation: {
    title: "Final Investigation",
    partnerNote:
      "The Research Partner is no longer available. Your earlier conversation remains visible for reference.",
    experimentsNote:
      "You have {{count}} final experiments, and every stone is now available. You may use these experiments to resolve any remaining uncertainties in your understanding.",
    modelNote:
      "Continue building your decision tree below. The affinity relationships from the instructions remain available as a reference. You can revise your tree at any time before submitting.",
  },
  tree: {
    title: "Your decision tree",
    intro:
      "Describe how you think the outcome of any two crystals is decided. Place a condition card on each decision point, label each branch Yes or No, and place an outcome card on each end point.",
    bankConditionsTitle: "Condition cards",
    bankOutcomesTitle: "Outcome cards",
    bankHint:
      "Select a card, then select an empty slot to place it — or drag a card into a slot. Cards can be used more than once.",
    nodeTitle: "Decision point {{number}}",
    terminalTitle: "Outcome {{number}}",
    emptyNode: "Place a condition card here",
    emptyTerminal: "Place an outcome card here",
    yes: "Yes",
    no: "No",
    branchAria: "Branch label",
    remove: "Remove",
    caseLabel: "Case",
    outcomeLabel: "Outcome",
    pathSegments: {
      SAME_CHARGE: "Same charge",
      DIFFERENT_CHARGE: "Different charge",
      SAME_STRENGTH: "Same strength",
      DIFFERENT_STRENGTH: "Different strength",
      SAME_AFFINITY: "Same affinity",
      DIFFERENT_AFFINITY: "Different affinity",
      NEUTRAL_AFFINITY_PAIR: "Neutral affinity pair",
      NON_NEUTRAL_AFFINITY_PAIR: "Non-neutral affinity pair",
    },
    conditions: {
      SAME_CHARGE: "Do the crystals have the same charge?",
      SAME_STRENGTH: "Do the crystals have the same strength?",
      SAME_AFFINITY: "Do the crystals have the same affinity?",
      NEUTRAL_AFFINITY_PAIR: "Do the affinities form a neutral pair?",
    },
    outcomes: {
      STALEMATE: "Stalemate",
      DOMINANT_AFFINITY_WINS: "Dominant affinity wins",
      STRONGER_CRYSTAL_WINS: "Stronger crystal wins",
      MUTUAL_NEUTRALIZATION: "Mutual neutralization",
    },
  },
  affinityMap: {
    title: "Affinity relationship map",
    intro:
      "For each pair of affinities, indicate what you think the relationship is. You may leave pairs undecided.",
    beats: "{{winner}} beats {{loser}}",
    neutral: "Neutral pair",
    unset: "Not decided",
    pairAria: "Relationship between {{first}} and {{second}}",
    referenceTitle: "Affinity relationships (reference)",
    referenceIntro:
      "These relationships were given in the instructions. Use them as a reference while you finish your decision tree.",
  },
  finalModel: {
    title: "Submit your final model",
    hint: "When you have finished your final experiments and are satisfied with your decision tree, submit your final model.",
    notesLabel: "Anything else about how you think the system works? (optional)",
    confidenceLabel: "How confident are you in your model?",
    confidenceHint: "{{min}} = not at all confident, {{max}} = completely confident",
    incomplete:
      "Complete your {{count}} final experiments and select a confidence rating to submit.",
    submit: "Submit final model",
  },
  mockPartner: {
    prefix: "[Development mock response]",
    analytical: [
      "Which single property have you varied across your experiments so far? Holding everything else constant makes comparisons cleaner.",
      "Look back at your results: are there two experiments that differed in only one property? What changed in the outcome?",
      "Consider organizing what you know by property — charge, strength, affinity — and noting which outcomes each seems tied to.",
      "Is there a pairing you have not tried yet that would isolate one variable? That might be a high-value next experiment.",
    ],
    hypothesisDriven: [
      "What does your current hypothesis predict for the pair you have selected? Committing to a prediction before running makes the result more informative.",
      "If your hypothesis were wrong, what result would show that? Try designing an experiment that could contradict it.",
      "Your last result — did it support or challenge your hypothesis? How would you restate the rule to account for it?",
      "Pick the experiment whose outcome you are least sure about. Surprising results usually teach the most.",
    ],
    remaining: "You have {{count}} experiments remaining.",
    remainingOne: "You have 1 experiment remaining.",
    allUsed:
      "You have used all of your experiments — it may be time to write up your conclusions.",
  },
};
