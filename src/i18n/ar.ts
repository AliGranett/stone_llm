import type { Translations } from "./types";

export const ar: Translations = {
  language: {
    label: "اللغة",
    en: "English",
    he: "עברית",
    ar: "العربية",
  },
  app: {
    title: "مختبر بلورات أستريون",
    subtitle: "استكشف كيف تتفاعل البلورات مع بعضها",
    saveError:
      "تعذّر حفظ تقدّمك في هذا المتصفّح. يُرجى تجنّب تحديث الصفحة.",
    mainAria: "الدراسة",
    demoNotice:
      "وضع تجريبي. يجيب شريك البحث بإجابات نموذجية حتى يمكن تجربة الواجهة. ما تكتبونه لا يُرسَل إلى نموذج لغوي.",
  },
  entry: {
    title: "مرحباً",
    subtitle: "اختر كيف تريد أن تبدأ.",
    participantMode: "وضع المشارك",
    participantDescription:
      "ابدأ الدراسة كمشارك. اختر أسلوب شريك البحث، ثم أجب عن بعض أسئلة الخلفية قبل البدء.",
    testingMode: "وضع الاختبار",
    testingDescription: "استعرض الدراسة واختر أسلوب شريك البحث للاختبار.",
    conditionLabel: "أسلوب شريك البحث",
    testingConditionLabel: "أسلوب شريك البحث",
    beginParticipant: "بدء الدراسة",
    beginTesting: "بدء الاختبار",
  },
  background: {
    title: "معلومات الخلفية",
    subtitle: "يُرجى الإجابة على الأسئلة التالية قبل البدء.",
    participantId: "معرّف الجلسة",
    ageLabel: "العمر",
    ageHint: "أدخل عمرك بالسنوات",
    educationLabel: "المستوى التعليمي",
    fieldLabel: "مجال الدراسة أو المهنة",
    fieldPlaceholder: "مثلاً: أحياء، هندسة برمجيات، معلم",
    llmExperienceLabel: "كم مرة استخدمت أدوات الذكاء الاصطناعي اللغوية (مثل ChatGPT)؟",
    aiLearningFrequencyLabel:
      "كم مرة تستخدم أدوات الذكاء الاصطناعي للتعلّم أو حل المشكلات؟",
    aiConfidenceLabel:
      "ما مدى ثقتك في استخدام أدوات الذكاء الاصطناعي لحل مشكلات غير مألوفة؟",
    beginStudy: "بدء الدراسة",
    validationAge: "يُرجى إدخال عمر صالح (1–120).",
    validationEducation: "يُرجى اختيار مستواك التعليمي.",
    validationField: "يُرجى إدخال مجال دراستك أو مهنتك.",
    validationLlmExperience: "يُرجى اختيار مدى استخدامك لأدوات الذكاء الاصطناعي اللغوية.",
    validationAiLearningFrequency:
      "يُرجى اختيار مدى استخدامك لأدوات الذكاء الاصطناعي للتعلّم أو حل المشكلات.",
    validationAiConfidence:
      "يُرجى اختيار مدى ثقتك في استخدام أدوات الذكاء الاصطناعي لحل مشكلات غير مألوفة.",
    conditionMissing:
      "لم يُخصَّص أسلوب شريك البحث لهذه الجلسة. يجب على الباحث فتح الدراسة عبر رابط يحتوي ?condition=ANALYTICAL أو ?condition=HYPOTHESIS_DRIVEN، أو ضبط شرط ثابت في إعدادات النشر.",
  },
  instructions: {
    title: "كيف تعمل البلورات",
    subtitle: "نظرة سريعة قبل أن تبدأ التحقيق.",
    introWelcome: "مرحباً بك في مختبر بلورات أستريون.",
    introDiscovery:
      "اكتشف الباحثون مجموعة من البلورات غير العادية التي تتفاعل بطرق يمكن التنبؤ بها—لكن القواعد التي تحكم هذه التفاعلات غير معروفة.",
    introTask:
      "مهمتك هي إجراء تجارب، وملاحظة ما يحدث، واكتشاف كيفية عمل النظام تدريجياً.",
    introPartner:
      "سيكون شريك البحث متاحاً أثناء التحقيق لمساعدتك على التفكير في الأدلة.",
    propertiesTitle: "ما الذي تملكه البلورة؟",
    affinityLabel: "الانتماء",
    strengthLabel: "القوّة",
    chargeLabel: "الشحنة",
    outcomesTitle: "ماذا يمكن أن يحدث؟",
    outcomes: {
      stoneAWins: "البلورة أ تفوز",
      stoneBWins: "البلورة ب تفوز",
      stalemate: "جمود",
      neutralization: "تحييد متبادل",
    },
    affinityMapTitle: "علاقات الأفينية (معلومات مُعطاة)",
    affinityMapGiven:
      "علاقات الأفينية هذه مُعطاة لك من البداية. لست بحاجة إلى اكتشاف أيّ الأفينيات تهيمن على أيّها، أو أيّ الأزواج محايدة.",
    dominanceTitle: "دورة الهيمنة",
    dominanceHint: "كل أفينية تهيمن على التالية في هذه الدورة:",
    dominanceCycleText: "نار → أرض → ريح → ماء → نار",
    neutralTitle: "أزواج محايدة",
    neutralHint: "هذه الأزواج ليس لها علاقة هيمنة:",
    affinityMapFootnote:
      "ما زلت بحاجة إلى اكتشاف متى تؤثر علاقات الأفينية على النتيجة — ومتى تؤثر القوّة أو الشحنة بدلاً منها. عملية القرار الإجمالية تبقى غير معروفة.",
    goalTitle: "هدفك",
    goalIntro:
      "قد تعتمد نتيجة التفاعل على الانتماء أو القوّة أو الشحنة أو على مزيج من هذه الخصائص.",
    goalAffinity:
      "أنت تعرف بالفعل كيف ترتبط الأفينيات ببعضها. مهمتك هي اكتشاف متى تحدّد هذه العلاقات الفائز، ومتى تفعل خصائص أخرى ذلك.",
    goalTask:
      "أجرِ تجارب، وابحث عن أنماط، وطوّر فرضيات، واكتشف متى تكون الخصائص المختلفة مهمة.",
    startButton: "بدء التحقيق",
    helpButton: "التعليمات",
    closeButton: "إغلاق",
    dialogAria: "تعليمات نظام البلورات",
    pageAria: "تعليمات الدراسة",
  },
  educationLevel: {
    highSchoolOrBelow: "ثانوية أو أقل",
    bachelors: "بكالوريوس / أدرس حالياً للحصول على بكالوريوس",
    masters: "ماجستير / أدرس حالياً للحصول على ماجستير",
    doctorate: "درجة دكتوراه",
    other: "أخرى",
  },
  llmExperience: {
    never: "أبداً",
    rarely: "نادراً",
    sometimes: "أحياناً",
    frequently: "غالباً",
    veryFrequently: "كثيراً جداً",
  },
  aiProblemSolvingConfidence: {
    notAtAll: "غير واثق/ة على الإطلاق",
    slightly: "واثق/ة قليلاً",
    moderately: "واثق/ة إلى حدٍّ متوسط",
    very: "واثق/ة جداً",
    extremely: "واثق/ة للغاية",
  },
  phase: {
    assisted: "التحقيق",
    finalInvestigation: "التحقيق النهائي",
    complete: "اكتملت الدراسة",
    progressAria: "تقدّم الدراسة",
    roundLabel: "الجولة {{round}} من {{total}}",
    experimentsCounter: "التجارب: {{used}} / {{total}}",
    inquiriesCounter: "استفسارات شريك البحث: {{used}} / {{total}}",
    experimentsUsedAria: "تم استخدام {{used}} من {{total}} تجارب",
  },
  round: {
    completeTitle: "اكتملت الجولة {{round}}",
    completeBody:
      "أكملت تجارب هذه الجولة. عندما تكون مستعداً، تابع إلى الجزء التالي من الدراسة.",
    continueNext: "المتابعة إلى الجولة {{round}}",
    continueFinal: "المتابعة إلى التحقيق النهائي",
    needMoreInquiries:
      "قبل المتابعة، يُرجى مناقشة تحقيقك مع شريك البحث. استخدمت {{used}} من {{min}} الاستفسارات المطلوبة في هذه الجولة.",
  },
  history: {
    title: "سجل التجارب",
    empty: "لا توجد تجارب بعد. ستظهر التجارب المكتملة هنا.",
    experiment: "التجربة {{number}}",
    prediction: "التوقّع",
    actualResult: "النتيجة الفعلية",
    mostImportantProperty: "الخاصية الأهم",
    notes: "ملاحظات",
    evidenceAssessment: "تقييم الأدلة",
    observation: "ماذا تعلّمت",
    completed: "اكتملت",
    winnerSuffix: " (الفائز: {{id}})",
  },
  partner: {
    title: "شريك البحث",
    subtitle: "ناقش أفكارك وخططك ونتائجك مع شريك البحث.",
    empty: "لا توجد رسائل بعد. اسأل شريك البحث أي شيء عن تحقيقك.",
    inputLabel: "رسالة إلى شريك البحث",
    placeholder: "اكتب رسالة…",
    send: "إرسال",
    error:
      "تعذّر على شريك البحث الرد الآن. تم حفظ رسالتك — يُرجى المحاولة مجدداً.",
    typing: "شريك البحث يكتب",
    retry: "حاول مرة أخرى",
    you: "أنت",
    partner: "شريك البحث",
    devClear: "مسح المحادثة (تطوير)",
    unavailable:
      "شريك البحث غير متاح في هذا الجزء من الدراسة. تابع التحقيق بشكل مستقل.",
    limitReached:
      "استخدمت جميع استفسارات شريك البحث لهذه الجولة. ستحصل على مجموعة جديدة من الاستفسارات في الجولة التالية.",
    readOnly:
      "لم يعد شريك البحث متاحاً. محادثتك السابقة تبقى هنا للمراجعة.",
  },
  stones: {
    available: "الأحجار المتاحة",
    hint: "اختر حجرين للمقارنة. انقر على حجر مرة أخرى لإلغاء تحديده.",
    ariaGroup: "الأحجار المتاحة",
    strength: "القوّة",
    charge: "الشحنة",
    id: "المعرّف",
    stoneSlot: "الحجر {{slot}}",
    ariaDescription:
      "حجر {{affinity}} {{id}}، قوّة {{strength}}، شحنة {{charge}}",
    ariaSelectedSuffix: ". محدّد حالياً كالحجر {{slot}}",
  },
  affinities: {
    TIDE: "ماء",
    EMBER: "نار",
    GALE: "ريح",
    GROVE: "أرض",
  },
  charges: { positive: "موجبة", negative: "سالبة" },
  selectedPair: {
    title: "الزوج المحدّد",
    clear: "مسح التحديد",
    stoneA: "الحجر أ",
    stoneB: "الحجر ب",
    selectFirst: "اختر الحجر الأول",
    selectSecond: "اختر الحجر الثاني",
    vs: "مقابل",
  },
  prediction: {
    title: "توقّعك",
    hint: "ماذا تتوقّع أن يحدث عند تفاعل هذين الحجرين؟",
    aria: "النتيجة المتوقّعة",
  },
  outcomes: {
    STONE_A_WINS: {
      label: "الحجر أ يفوز",
      description: "الحجر أ يتفوّق على الحجر ب.",
    },
    STONE_B_WINS: {
      label: "الحجر ب يفوز",
      description: "الحجر ب يتفوّق على الحجر أ.",
    },
    STALEMATE: {
      label: "تعادل",
      description: "لا يتفوّق أي حجر على الآخر.",
    },
    MUTUAL_NEUTRALIZATION: {
      label: "تحييد متبادل",
      description: "يلغي الحجران بعضهما البعض.",
    },
  },
  hypothesis: {
    title: "فكرتك الحالية",
    propertyLabel: "أي خاصية تعتقد أنها الأهم حالياً؟",
    properties: {
      STRENGTH: "القوّة",
      CHARGE: "الشحنة",
      AFFINITY: "الانتماء",
      UNSURE: "لست متأكداً/ة",
    },
    notesLabel: "ملاحظات",
    notesOptional: "(اختياري)",
    notesHint:
      "أي شيء تريد تذكّره عن هذه التجربة أو تفكيرك أو شيء قد ترغب في التحقيق فيه لاحقاً.",
  },
  controls: {
    run: "تشغيل التجربة",
    selectStones: "اختر حجرين للمقارنة.",
    choosePrediction: "اختر نتيجة متوقّعة.",
    chooseProperty: "اختر الخاصية التي تعتقد أنها الأهم حالياً.",
  },
  experimentStage: {
    title: "التجربة {{number}}",
    running: "جارٍ تشغيل التجربة…",
    winner: "الفائز",
    stoneA: "الحجر أ",
    stoneB: "الحجر ب",
    yourPrediction: "توقّعك",
    matched: "طابق النتيجة",
    notMatched: "لم يطابق النتيجة",
  },
  reflection: {
    title: "تأمّل",
    hint: "فحص سريع قبل تجربتك التالية.",
    evidenceLabel: "هل تدعم هذه النتيجة نظريتك/فرضيتك؟",
    observationLabel: "ماذا تعلّمت من هذه النتيجة؟",
    observationOptional: "(اختياري)",
    incomplete: "اختر ما إذا كانت النتيجة تدعم نظريتك للمتابعة.",
    submit: "حفظ التأمّل والمتابعة",
  },
  evidence: {
    SUPPORTED: "مدعومة",
    PARTIALLY_SUPPORTED: "مدعومة جزئياً",
    CONTRADICTED: "مناقضة",
    UNCLEAR: "غير واضح",
  },
  complete: {
    title: "شكراً لك!",
    body: "تم إرسال إجابتك النهائية. يمكنك الآن إغلاق هذه النافذة، أو مراجعة سجل التجارب والمحادثة.",
    downloadsTitle: "تنزيلات بيانات البحث",
    downloadsHint:
      "نزّل بيانات الدراسة للتحليل. هذه الخيارات متاحة في وضع الاختبار فقط.",
    downloadFinalReport: "تنزيل التقرير النهائي (CSV)",
    downloadExperiments: "تنزيل بيانات التجارب (CSV)",
    downloadParticipant: "تنزيل participant.csv",
    downloadLlm: "تنزيل llm_interactions.csv",
    downloadJson: "تنزيل JSON الكامل للدراسة",
  },
  finalInvestigation: {
    title: "التحقيق النهائي",
    partnerNote:
      "لم يعد شريك البحث متاحاً. محادثتك السابقة تبقى ظاهرة للمراجعة.",
    experimentsNote:
      "لديك {{count}} تجارب أخيرة، وجميع الأحجار متاحة الآن. يمكنك استخدام هذه التجارب لحسم أي شكوك متبقية في فهمك.",
    modelNote:
      "واصل بناء شجرة القرار أدناه. علاقات الأفينية من التعليمات تبقى متاحة كمرجع. يمكنك تعديل الشجرة في أي وقت قبل الإرسال.",
  },
  tree: {
    title: "شجرة القرار الخاصة بك",
    intro:
      "صِف كيف تُحدَّد برأيك نتيجة أي بلورتين. ضع بطاقة شرط على كل نقطة قرار، وسمِّ كل فرع بـ«نعم» أو «لا»، وضع بطاقة نتيجة على كل نقطة نهاية.",
    bankConditionsTitle: "بطاقات الشروط",
    bankOutcomesTitle: "بطاقات النتائج",
    bankHint:
      "اختر بطاقة ثم اختر خانة فارغة لوضعها — أو اسحب البطاقة إلى الخانة. يمكن استخدام كل بطاقة أكثر من مرة.",
    nodeTitle: "نقطة القرار {{number}}",
    terminalTitle: "النتيجة {{number}}",
    emptyNode: "ضع بطاقة شرط هنا",
    emptyTerminal: "ضع بطاقة نتيجة هنا",
    yes: "نعم",
    no: "لا",
    branchAria: "تسمية الفرع",
    remove: "إزالة",
    caseLabel: "الحالة",
    outcomeLabel: "النتيجة",
    pathSegments: {
      SAME_CHARGE: "نفس الشحنة",
      DIFFERENT_CHARGE: "شحنة مختلفة",
      SAME_STRENGTH: "نفس القوّة",
      DIFFERENT_STRENGTH: "قوّة مختلفة",
      SAME_AFFINITY: "نفس الأفينية",
      DIFFERENT_AFFINITY: "أفينية مختلفة",
      NEUTRAL_AFFINITY_PAIR: "زوج أفينية محايد",
      NON_NEUTRAL_AFFINITY_PAIR: "زوج أفينية غير محايد",
    },
    conditions: {
      SAME_CHARGE: "هل للبلورتين الشحنة نفسها؟",
      SAME_STRENGTH: "هل للبلورتين القوّة نفسها؟",
      SAME_AFFINITY: "هل للبلورتين الأفينية نفسها؟",
      NEUTRAL_AFFINITY_PAIR: "هل تشكّل الأفينيتان زوجاً محايداً؟",
    },
    outcomes: {
      STALEMATE: "تعادل",
      DOMINANT_AFFINITY_WINS: "الأفينية المهيمنة تفوز",
      STRONGER_CRYSTAL_WINS: "البلورة الأقوى تفوز",
      MUTUAL_NEUTRALIZATION: "تحييد متبادل",
    },
  },
  affinityMap: {
    title: "خريطة علاقات الأفينية",
    intro:
      "لكل زوج من الأفينيات، حدّد ما تعتقد أنه العلاقة بينهما. يمكنك ترك أزواج دون حسم.",
    beats: "{{winner}} يتغلّب على {{loser}}",
    neutral: "زوج محايد",
    unset: "لم يُحسم بعد",
    pairAria: "العلاقة بين {{first}} و{{second}}",
    referenceTitle: "علاقات الأفينية (مرجع)",
    referenceIntro:
      "أُعطيت هذه العلاقات في التعليمات. استخدمها كمرجع أثناء إكمال شجرة القرار.",
  },
  finalModel: {
    title: "إرسال نموذجك النهائي",
    hint: "عند انتهائك من تجاربك الأخيرة ورضاك عن شجرة القرار، أرسل نموذجك النهائي.",
    notesLabel: "هل من شيء آخر حول كيفية عمل النظام برأيك؟ (اختياري)",
    confidenceLabel: "ما مدى ثقتك بنموذجك؟",
    confidenceHint: "{{min}} = غير واثق إطلاقاً، {{max}} = واثق تماماً",
    incomplete:
      "أكمل {{count}} التجارب الأخيرة واختر مستوى الثقة للإرسال.",
    submit: "إرسال النموذج النهائي",
  },
  mockPartner: {
    prefix: "[ردّ تطوير]",
    analytical: [
      "ما الخاصية الواحدة التي غيّرتها عبر تجاربك حتى الآن؟ إبقاء كل شيء آخر ثابتاً يجعل المقارنة أوضح.",
      "راجع نتائجك: هل هناك تجربتان اختلفتا في خاصية واحدة فقط؟ ماذا تغيّر في النتيجة؟",
      "حاول تنظيم ما تعرفه حسب الخاصية — الشحنة، القوّة، الأفينية — وملاحظة النتائج المرتبطة بكل منها.",
      "هل هناك زوج لم تجربه بعد يعزل متغيّراً واحداً؟ قد تكون هذه التجربة التالية الأكثر فائدة.",
    ],
    hypothesisDriven: [
      "ماذا تتوقّع فرضيتك الحالية للزوج الذي اخترته؟ الالتزام بتوقّع قبل التشغيل يجعل النتيجة أكثر إفادة.",
      "إذا كانت فرضيتك خاطئة، أي نتيجة ستثبت ذلك؟ صمّم تجربة قد تنقضها.",
      "نتيجتك الأخيرة — هل دعمت فرضيتك أم تحدّتها؟ كيف ستُعيد صياغة القاعدة؟",
      "اختر التجربة التي أنت أقل يقيناً بشأن نتيجتها. النتائج المفاجئة تعلّمنا أكثر.",
    ],
    remaining: "متبقٍ لديك {{count}} تجارب.",
    remainingOne: "متبقٍ لديك تجربة واحدة.",
    allUsed: "استخدمت جميع تجاربك — ربما حان وقت كتابة استنتاجاتك.",
  },
};
