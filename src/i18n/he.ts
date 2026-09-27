import type { Translations } from "./types";

export const he: Translations = {
  language: {
    label: "שפה",
    en: "English",
    he: "עברית",
    ar: "العربية",
  },
  app: {
    title: "מעבדת קריסטלי אסטריון",
    subtitle: "חקור כיצד הקריסטלים משפיעים זה על זה",
    saveError:
      "לא ניתן היה לשמור את ההתקדמות שלך בדפדפן זה. נא להימנע מרענון הדף.",
    mainAria: "מחקר",
    demoNotice:
      "מצב הדגמה. שותף המחקר עונה בתשובות לדוגמה כדי שתוכלו לנסות את הממשק. מה שתקלידו לא נשלח למודל שפה.",
  },
  entry: {
    title: "ברוכים הבאים",
    subtitle: "בחר/י כיצד ברצונך להתחיל.",
    participantMode: "מצב משתתף",
    participantDescription:
      "התחל/י את המחקר כמשתתף/ת. בחר/י את סגנון שותף המחקר, ואז ענה/י על מספר שאלות רקע לפני ההתחלה.",
    testingMode: "מצב בדיקה",
    testingDescription: "צפה/י במחקר ובחר/י איזה סגנון שותף מחקר לבדוק.",
    conditionLabel: "סגנון שותף מחקר",
    testingConditionLabel: "סגנון שותף מחקר",
    beginParticipant: "התחל מחקר",
    beginTesting: "התחל בדיקה",
  },
  background: {
    title: "מידע רקע",
    subtitle: "נא לענות על השאלות הבאות לפני ההתחלה.",
    participantId: "מזהה סשן",
    ageLabel: "גיל",
    ageHint: "הזן/י את גילך בשנים",
    educationLabel: "רמת השכלה",
    fieldLabel: "תחום לימוד או עיסוק",
    fieldPlaceholder: "למשל ביולוגיה, הנדסת תוכנה, מורה",
    llmExperienceLabel: "באיזו תדירות השתמשת בכלי AI לשפה (כמו ChatGPT)?",
    aiLearningFrequencyLabel: "באיזו תדירות את/ה משתמש/ת בכלי AI ללמידה או לפתרון בעיות?",
    aiConfidenceLabel: "עד כמה את/ה בטוח/ה בשימוש בכלי AI לפתרון בעיות לא מוכרות?",
    beginStudy: "התחל מחקר",
    validationAge: "נא להזין גיל תקין (1–120).",
    validationEducation: "נא לבחור רמת השכלה.",
    validationField: "נא להזין תחום לימוד או עיסוק.",
    validationLlmExperience: "נא לבחור באיזו תדירות השתמשת בכלי AI לשפה.",
    validationAiLearningFrequency:
      "נא לבחור באיזו תדירות את/ה משתמש/ת בכלי AI ללמידה או לפתרון בעיות.",
    validationAiConfidence:
      "נא לבחור עד כמה את/ה בטוח/ה בשימוש בכלי AI לפתרון בעיות לא מוכרות.",
    conditionMissing:
      "לסשן זה לא הוקצה סגנון שותף מחקר. החוקר/ת חייב/ת לפתוח את המחקר עם ?condition=ANALYTICAL או ?condition=HYPOTHESIS_DRIVEN בקישור, או להגדיר תנאי קבוע בהגדרות הפריסה.",
  },
  instructions: {
    title: "איך האבנים פועלות",
    subtitle: "סקירה קצרה לפני שמתחילים לחקור.",
    introWelcome: "ברוכים הבאים למעבדת אבני האסטריון.",
    introDiscovery:
      "חוקרים גילו אוסף של אבנים יוצאות דופן שמגיבות זו לזו בדרכים צפויות—אך החוקים שמנהלים את האינטראקציות האלה אינם ידועים.",
    introTask:
      "משימתך היא לבצע ניסויים, לצפות במה שקורה, ולגלות בהדרגה כיצד המערכת פועלת.",
    introPartner:
      "שותף מחקר יהיה זמין במהלך החקירה כדי לעזור לך לחשוב על הראיות.",
    propertiesTitle: "מה יש לאבן?",
    affinityLabel: "זיקה",
    strengthLabel: "עוצמה",
    chargeLabel: "מטען",
    outcomesTitle: "מה יכול לקרות?",
    outcomes: {
      stoneAWins: "אבן א' מנצחת",
      stoneBWins: "אבן ב' מנצחת",
      stalemate: "מצב תיקו",
      neutralization: "ניטרול הדדי",
    },
    affinityMapTitle: "יחסי הזיקות (מידע נתון)",
    affinityMapGiven:
      "יחסי הזיקות האלה ניתנים לך מההתחלה. אין צורך לגלות אילו זיקות גוברות על אילו, או אילו זוגות הם ניטרליים.",
    dominanceTitle: "מעגל דומיננטיות",
    dominanceHint: "כל זיקה גוברת על הבאה אחריה במעגל זה:",
    dominanceCycleText: "אש → אדמה → רוח → מים → אש",
    neutralTitle: "זוגות ניטרליים",
    neutralHint: "לזוגות אלה אין יחס דומיננטיות:",
    affinityMapFootnote:
      "מה שעדיין עליך לגלות הוא מתי יחסי הזיקות משפיעים על התוצאה — ומתי העוצמה או המטען משפיעים במקומם. תהליך ההחלטה הכללי נותר לא ידוע.",
    goalTitle: "המטרה שלך",
    goalIntro:
      "תוצאת האינטראקציה עשויה להיות תלויה בזיקה, בעוצמה, במטען או בשילוב של תכונות אלה.",
    goalAffinity:
      "את/ה כבר יודע/ת כיצד הזיקות קשורות זו לזו. המשימה שלך היא לגלות מתי היחסים האלה קובעים את המנצח, ומתי תכונות אחרות קובעות.",
    goalTask:
      "בצע/י ניסויים, חפש/י דפוסים, פתח/י השערות וגלה/י מתי התכונות השונות חשובות.",
    startButton: "התחל חקירה",
    helpButton: "הוראות",
    closeButton: "סגור",
    dialogAria: "הוראות מערכת האבנים",
    pageAria: "הוראות המחקר",
  },
  educationLevel: {
    highSchoolOrBelow: "תיכון ומטה",
    bachelors: "תואר ראשון / לומד/ת לקראת תואר ראשון",
    masters: "תואר שני / לומד/ת לקראת תואר שני",
    doctorate: "תואר שלישי (דוקטורט)",
    other: "אחר",
  },
  llmExperience: {
    never: "אף פעם",
    rarely: "לעיתים רחוקות",
    sometimes: "לפעמים",
    frequently: "לעיתים קרובות",
    veryFrequently: "בתדירות גבוהה מאוד",
  },
  aiProblemSolvingConfidence: {
    notAtAll: "בכלל לא בטוח/ה",
    slightly: "מעט בטוח/ה",
    moderately: "בינוני בטוח/ה",
    very: "מאוד בטוח/ה",
    extremely: "בטוח/ה במיוחד",
  },
  phase: {
    assisted: "חקירה",
    finalInvestigation: "חקירה סופית",
    complete: "המחקר הושלם",
    progressAria: "התקדמות המחקר",
    roundLabel: "סבב {{round}} מתוך {{total}}",
    experimentsCounter: "ניסויים: {{used}} / {{total}}",
    inquiriesCounter: "פניות לשותף המחקר: {{used}} / {{total}}",
    experimentsUsedAria: "{{used}} מתוך {{total}} ניסויים נוצלו",
  },
  round: {
    completeTitle: "סבב {{round}} הושלם",
    completeBody:
      "השלמת את הניסויים של סבב זה. כשאת/ה מוכן/ה, המשך/י לחלק הבא של המחקר.",
    continueNext: "המשך לסבב {{round}}",
    continueFinal: "המשך לחקירה הסופית",
    needMoreInquiries:
      "לפני שממשיכים, נא לדון בחקירה שלך עם שותף המחקר. השתמשת ב-{{used}} מתוך {{min}} הפניות הנדרשות בסבב זה.",
  },
  history: {
    title: "היסטוריית ניסויים",
    empty: "עדיין אין ניסויים. ניסויים שהושלמו יופיעו כאן.",
    experiment: "ניסוי {{number}}",
    prediction: "תחזית",
    actualResult: "תוצאה בפועל",
    mostImportantProperty: "התכונה החשובה ביותר",
    notes: "הערות",
    evidenceAssessment: "הערכת ראיות",
    observation: "מה למדת",
    completed: "הושלם",
    winnerSuffix: " (מנצח: {{id}})",
  },
  partner: {
    title: "שותף מחקר",
    subtitle: "דון ברעיונות, בתוכניות ובתוצאות שלך עם שותף המחקר.",
    empty: "אין הודעות עדיין. שאל את שותף המחקר כל דבר על החקירה שלך.",
    inputLabel: "הודעה לשותף המחקר",
    placeholder: "הקלד הודעה…",
    send: "שלח",
    error:
      "שותף המחקר לא הצליח להגיב כעת. ההודעה שלך נשמרה — נא לנסות שוב.",
    typing: "שותף המחקר כותב",
    retry: "נסה שוב",
    you: "את/ה",
    partner: "שותף מחקר",
    devClear: "נקה שיחה (פיתוח)",
    unavailable:
      "שותף המחקר אינו זמין בחלק זה של המחקר. המשך/י בחקירה באופן עצמאי.",
    limitReached:
      "השתמשת בכל הפניות לשותף המחקר בסבב זה. בסבב הבא תקבל/י מכסת פניות חדשה.",
    readOnly:
      "שותף המחקר אינו זמין עוד. השיחה הקודמת שלך נשארת כאן לעיון.",
  },
  stones: {
    available: "אבנים זמינות",
    hint: "בחר שתי אבנים להשוואה. לחץ שוב על אבן כדי לבטל את הבחירה.",
    ariaGroup: "אבנים זמינות",
    strength: "עוצמה",
    charge: "מטען",
    id: "מזהה",
    stoneSlot: "אבן {{slot}}",
    ariaDescription:
      "אבן {{affinity}} {{id}}, עוצמה {{strength}}, מטען {{charge}}",
    ariaSelectedSuffix: ". נבחרה כרגע כאבן {{slot}}",
  },
  affinities: {
    TIDE: "מים",
    EMBER: "אש",
    GALE: "רוח",
    GROVE: "אדמה",
  },
  charges: { positive: "חיובי", negative: "שלילי" },
  selectedPair: {
    title: "זוג נבחר",
    clear: "נקה בחירה",
    stoneA: "אבן א",
    stoneB: "אבן ב",
    selectFirst: "בחר אבן ראשונה",
    selectSecond: "בחר אבן שנייה",
    vs: "מול",
  },
  prediction: {
    title: "התחזית שלך",
    hint: "מה את/ה מצפה שיקרה כשהאבנים האלה יתקשרו?",
    aria: "תוצאה צפויה",
  },
  outcomes: {
    STONE_A_WINS: {
      label: "אבן א מנצחת",
      description: "אבן א גוברת על אבן ב.",
    },
    STONE_B_WINS: {
      label: "אבן ב מנצחת",
      description: "אבן ב גוברת על אבן א.",
    },
    STALEMATE: {
      label: "תיקו",
      description: "אף אבן לא מצליחה לגבור על השנייה.",
    },
    MUTUAL_NEUTRALIZATION: {
      label: "ניטרול הדדי",
      description: "שתי האבנים מבטלות זו את זו.",
    },
  },
  hypothesis: {
    title: "הרעיון הנוכחי שלך",
    propertyLabel: "איזו תכונה חשובה ביותר כרגע לדעתך?",
    properties: {
      STRENGTH: "עוצמה",
      CHARGE: "מטען",
      AFFINITY: "זיקה",
      UNSURE: "אני לא בטוח/ה",
    },
    notesLabel: "הערות",
    notesOptional: "(אופציונלי)",
    notesHint:
      "כל דבר שתרצה/י לזכור על הניסוי, על החשיבה שלך, או על משהו לבדוק בהמשך.",
  },
  controls: {
    run: "הרץ ניסוי",
    selectStones: "בחר שתי אבנים להשוואה.",
    choosePrediction: "בחר תוצאה צפויה.",
    chooseProperty: "בחר איזו תכונה חשובה ביותר לדעתך כרגע.",
  },
  experimentStage: {
    title: "ניסוי {{number}}",
    running: "מריץ ניסוי…",
    winner: "מנצח",
    stoneA: "אבן א",
    stoneB: "אבן ב",
    yourPrediction: "התחזית שלך",
    matched: "תואמת את התוצאה",
    notMatched: "לא תואמת את התוצאה",
  },
  reflection: {
    title: "רפלקציה",
    hint: "בדיקה קצרה לפני הניסוי הבא.",
    evidenceLabel: "האם התוצאה תומכת בתיאוריה/בהשערה שלך?",
    observationLabel: "מה למדת מהתוצאה הזו?",
    observationOptional: "(אופציונלי)",
    incomplete: "בחר/י האם התוצאה תומכת בתיאוריה שלך כדי להמשיך.",
    submit: "שמור רפלקציה והמשך",
  },
  evidence: {
    SUPPORTED: "נתמכת",
    PARTIALLY_SUPPORTED: "נתמכת חלקית",
    CONTRADICTED: "סותרת",
    UNCLEAR: "לא ברור",
  },
  complete: {
    title: "תודה!",
    body: "התשובה הסופית שלך נשלחה. כעת ניתן לסגור את החלון, או לעיין בהיסטוריית הניסויים ובשיחה.",
    downloadsTitle: "הורדת נתוני מחקר",
    downloadsHint:
      "הורידו נתוני מחקר לניתוח. אפשרויות אלה זמינות במצב בדיקה בלבד.",
    downloadFinalReport: "הורדת דוח סופי (CSV)",
    downloadExperiments: "הורדת נתוני ניסויים (CSV)",
    downloadParticipant: "הורדת participant.csv",
    downloadLlm: "הורדת llm_interactions.csv",
    downloadJson: "הורדת JSON מלא של המחקר",
  },
  finalInvestigation: {
    title: "חקירה סופית",
    partnerNote:
      "שותף המחקר אינו זמין עוד. השיחה הקודמת שלך נשארת גלויה לעיון.",
    experimentsNote:
      "עומדים לרשותך {{count}} ניסויים אחרונים, וכל האבנים זמינות כעת. ניתן להשתמש בניסויים אלו כדי ליישב אי-ודאויות שנותרו בהבנתך.",
    modelNote:
      "המשך/י לבנות את עץ ההחלטות למטה. יחסי הזיקות מההוראות נשארים זמינים כהפניה. ניתן לעדכן את העץ בכל עת לפני ההגשה.",
  },
  tree: {
    title: "עץ ההחלטות שלך",
    intro:
      "תאר/י כיצד לדעתך נקבעת התוצאה של כל שני קריסטלים. הנח/י כרטיס תנאי על כל נקודת החלטה, סמן/י כל ענף כ\"כן\" או \"לא\", והנח/י כרטיס תוצאה על כל נקודת סיום.",
    bankConditionsTitle: "כרטיסי תנאים",
    bankOutcomesTitle: "כרטיסי תוצאות",
    bankHint:
      "בחר/י כרטיס ואז בחר/י משבצת ריקה כדי למקם אותו — או גרור/י כרטיס אל משבצת. ניתן להשתמש בכל כרטיס יותר מפעם אחת.",
    nodeTitle: "נקודת החלטה {{number}}",
    terminalTitle: "תוצאה {{number}}",
    emptyNode: "הנח/י כאן כרטיס תנאי",
    emptyTerminal: "הנח/י כאן כרטיס תוצאה",
    yes: "כן",
    no: "לא",
    branchAria: "תווית ענף",
    remove: "הסר",
    caseLabel: "מקרה",
    outcomeLabel: "תוצאה",
    pathSegments: {
      SAME_CHARGE: "אותו מטען",
      DIFFERENT_CHARGE: "מטען שונה",
      SAME_STRENGTH: "אותה עוצמה",
      DIFFERENT_STRENGTH: "עוצמה שונה",
      SAME_AFFINITY: "אותה זיקה",
      DIFFERENT_AFFINITY: "זיקה שונה",
      NEUTRAL_AFFINITY_PAIR: "זוג זיקות ניטרלי",
      NON_NEUTRAL_AFFINITY_PAIR: "זוג זיקות שאינו ניטרלי",
    },
    conditions: {
      SAME_CHARGE: "האם לקריסטלים אותו מטען?",
      SAME_STRENGTH: "האם לקריסטלים אותה עוצמה?",
      SAME_AFFINITY: "האם לקריסטלים אותה זיקה?",
      NEUTRAL_AFFINITY_PAIR: "האם הזיקות יוצרות זוג ניטרלי?",
    },
    outcomes: {
      STALEMATE: "תיקו",
      DOMINANT_AFFINITY_WINS: "הזיקה הדומיננטית מנצחת",
      STRONGER_CRYSTAL_WINS: "הקריסטל החזק יותר מנצח",
      MUTUAL_NEUTRALIZATION: "ניטרול הדדי",
    },
  },
  affinityMap: {
    title: "מפת יחסי הזיקות",
    intro:
      "עבור כל זוג זיקות, ציין/י מהו לדעתך היחס ביניהן. ניתן להשאיר זוגות ללא הכרעה.",
    beats: "{{winner}} גובר על {{loser}}",
    neutral: "זוג ניטרלי",
    unset: "טרם הוחלט",
    pairAria: "היחס בין {{first}} ל-{{second}}",
    referenceTitle: "יחסי הזיקות (להפניה)",
    referenceIntro:
      "יחסים אלה ניתנו בהוראות. השתמש/י בהם כהפניה בזמן שאת/ה מסיים/ת את עץ ההחלטות.",
  },
  finalModel: {
    title: "הגשת המודל הסופי",
    hint: "כשסיימת את הניסויים האחרונים ואת/ה שבע/ת רצון מעץ ההחלטות, הגש/י את המודל הסופי.",
    notesLabel: "משהו נוסף על האופן שבו לדעתך המערכת פועלת? (לא חובה)",
    confidenceLabel: "עד כמה את/ה בטוח/ה במודל שלך?",
    confidenceHint: "{{min}} = לא בטוח/ה כלל, {{max}} = בטוח/ה לחלוטין",
    incomplete:
      "השלם/י את {{count}} הניסויים האחרונים ובחר/י דירוג ביטחון כדי להגיש.",
    submit: "הגש מודל סופי",
  },
  mockPartner: {
    prefix: "[תגובת פיתוח]",
    analytical: [
      "איזו תכונה אחת שינית בין הניסויים שלך עד כה? החזקת כל השאר קבוע מקלה על ההשוואה.",
      "הסתכל/י על התוצאות: האם יש שני ניסויים שהבדילו רק בתכונה אחת? מה השתנה בתוצאה?",
      "נסה/י לארגן את מה שאת/ה יודע/ת לפי תכונה — מטען, עוצמה, זיקה — ולרשום אילו תוצאות נראות קשורות לכל אחת.",
      "האם יש זוג שעדיין לא ניסית שיבודד משתנה אחד? זה עשוי להיות הניסוי הבא הכי מועיל.",
    ],
    hypothesisDriven: [
      "מה ההשערה הנוכחית שלך חוזה עבור הזוג שבחרת? התחייבות לתחזית לפני ההרצה הופכת את התוצאה למלמדת יותר.",
      "אם ההשערה שלך שגויה, איזו תוצאה תוכיח זאת? נסה/י לתכנן ניסוי שיכול לסתור אותה.",
      "התוצאה האחרונה — האם היא תמכה או אתגרה את ההשערה? כיצד תנסח/י מחדש את הכלל?",
      "בחר/י את הניסוי שאת/ה הכי פחות בטוח/ה לגבי תוצאתו. תוצאות מפתיעות לרוב מלמדות הכי הרבה.",
    ],
    remaining: "נותרו לך {{count}} ניסויים.",
    remainingOne: "נותר לך ניסוי אחד.",
    allUsed: "ניצלת את כל הניסויים — אולי הגיע הזמן לנסח את המסקנות.",
  },
};
