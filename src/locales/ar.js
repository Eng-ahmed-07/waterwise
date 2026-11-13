// All user-facing Arabic strings live here (Phase 0 decision: no Arabic scattered through JSX).
// Exception: the dev-only component showcase in features/dev-ui.
// Strings that need numbers are functions; callers pass numbers already formatted by lib/format.js.

export const ar = {
  app: {
    name: 'WaterWise',
    description: 'منصة عربية لتقدير استهلاك المياه المنزلي وترشيده في مصر.',
  },

  common: {
    close: 'إغلاق',
    loading: 'جارٍ التحميل…',
    required: 'مطلوب',
    optional: 'اختياري',
    backHome: 'العودة إلى الرئيسية',
  },

  // The labelling contract (Phase 0, section 4). "actual" is reserved: see lib/basis.js.
  basis: {
    estimated: {
      label: 'تقديري',
      description: 'محسوب من عاداتك المُدخلة × افتراضات قابلة للتعديل.',
    },
    projected: {
      label: 'متوقع',
      description: 'امتداد حسابي للمتوسط اليومي، وليس استهلاكًا فعليًا.',
    },
    actual: {
      label: 'فعلي',
      description: 'مأخوذ من قراءات العداد فقط (غير مُفعّل حاليًا).',
    },
  },

  notices: {
    estimateNotMeasurement: 'تقدير وليس قياسًا فعليًا',
  },

  units: {
    liter: 'لتر',
    cubicMeter: 'م³',
    literPerDay: 'لتر/يوم',
    literPerPersonDay: 'لتر/فرد/يوم',
  },

  metric: {
    noValue: 'لا توجد بيانات',
  },

  coverage: {
    completeDays: (covered, total) => `الأيام المكتملة: ${covered} من ${total}`,
  },

  toast: {
    region: 'الإشعارات',
    dismiss: 'إغلاق الإشعار',
  },

  notFound: {
    title: 'الصفحة غير موجودة',
    body: 'تحقق من الرابط، أو عد إلى الصفحة الرئيسية.',
  },

  // Phase 2: calculator domain. Domain code returns codes and numbers; every sentence lives here.
  // Functions receive an object of values already formatted by lib/format.js.
  calculator: {
    // The six approved activities (Phase 0, Revision 2 section 6; labels from Revision 3 section B).
    activities: {
      shower: {
        name: 'الاستحمام',
        occurrencesDay: 'عدد مرات الاستحمام اليوم',
        occurrencesWeek: 'إجمالي مرات الاستحمام خلال الأسبوع',
      },
      faucet: {
        name: 'استخدام الصنبور',
        occurrencesDay: 'عدد مرات استخدام الصنبور اليوم',
        occurrencesWeek: 'إجمالي مرات استخدام الصنبور خلال الأسبوع',
      },
      dishwashing: {
        name: 'غسل الأطباق (يدويًا)',
        occurrencesDay: 'عدد مرات غسل الأطباق اليوم',
        occurrencesWeek: 'إجمالي مرات غسل الأطباق خلال الأسبوع',
      },
      plant_watering: {
        name: 'ري النباتات',
        occurrencesDay: 'عدد مرات ري النباتات اليوم',
        occurrencesWeek: 'إجمالي مرات ري النباتات خلال الأسبوع',
      },
      washing_machine: {
        name: 'الغسالة',
        occurrencesDay: 'عدد دورات الغسيل اليوم',
        occurrencesWeek: 'إجمالي دورات الغسيل خلال الأسبوع',
      },
      house_cleaning: {
        name: 'تنظيف المنزل',
        occurrencesDay: 'عدد جلسات التنظيف اليوم',
        occurrencesWeek: 'إجمالي جلسات التنظيف خلال الأسبوع',
      },
    },
    durationLabel: 'مدة المرة الواحدة (بالدقائق)',
    noUsage: 'لا استخدام',
    rateUnits: {
      literPerMinute: 'لتر/دقيقة',
      literPerCycle: 'لتر/دورة',
      literPerSession: 'لتر/جلسة',
    },
    assumptionNote: 'قيمة افتراضية قابلة للتعديل، وليست معيارًا رسميًا',
    periodTypes: { day: 'يوم', week: 'أسبوع' },
    status: { draft: 'مسودة', complete: 'مكتمل' },
    progress: (answered, required) => `${answered} من ${required} أنشطة مُجابة`,

    period: {
      day: ({ date }) => `يوم ${date}`,
      week: ({ start, end }) => `الأسبوع من ${start} إلى ${end}`,
    },

    errors: {
      ACTIVITY_UNKNOWN: 'نشاط غير معروف.',
      ACTIVITY_DUPLICATE: 'تم إدخال هذا النشاط أكثر من مرة في السجل نفسه.',
      ENTRIES_INVALID: 'بيانات الأنشطة غير صالحة.',
      OCCURRENCES_MISSING: 'أدخل عدد المرات، أو اختر «لا استخدام».',
      OCCURRENCES_INVALID: 'أدخل رقمًا صحيحًا.',
      OCCURRENCES_NEGATIVE: 'لا يمكن أن يكون العدد سالبًا.',
      OCCURRENCES_NOT_INTEGER: 'أدخل عددًا صحيحًا بدون كسور.',
      OCCURRENCES_TOO_LARGE: ({ max }) => `القيمة كبيرة جدًا. الحد الأقصى ${max}.`,
      DURATION_MISSING: 'أدخل مدة المرة الواحدة بالدقائق.',
      DURATION_INVALID: 'أدخل مدة صحيحة بالدقائق.',
      DURATION_NEGATIVE: 'لا يمكن أن تكون المدة سالبة.',
      DURATION_ZERO: 'يجب أن تكون المدة أكبر من صفر. إن لم يحدث استخدام فاختر «لا استخدام».',
      DURATION_TOO_LARGE: ({ max }) => `المدة كبيرة جدًا. الحد الأقصى ${max} دقيقة للمرة الواحدة.`,
      DURATION_NOT_APPLICABLE: 'هذا النشاط لا يحتاج إلى مدة.',
      RATE_INVALID: 'قيمة الافتراض غير صالحة. يجب أن تكون أكبر من صفر.',
      RATE_TOO_LARGE: ({ max }) => `قيمة الافتراض كبيرة جدًا. الحد الأقصى ${max}.`,
      ASSUMPTION_MISSING: 'لا توجد قيمة افتراضية لهذا النشاط.',
      LITERS_MISMATCH: 'الكمية المحسوبة لا تطابق المدخلات.',
      PERIOD_TYPE_INVALID: 'نوع الفترة يجب أن يكون يومًا أو أسبوعًا.',
      DATE_INVALID: 'تاريخ غير صالح.',
      PERIOD_LENGTH_MISMATCH: 'الفترة يجب أن تكون يومًا واحدًا أو سبعة أيام متتالية.',
      PERIOD_IN_FUTURE: 'لا يمكن تسجيل فترة لم تنتهِ بعد.',
      LOG_OVERLAP: 'هذه الفترة تتداخل مع سجل آخر. عدّل السجل الموجود أو احذفه أولًا.',
      LOG_ID_MISSING: 'السجل يحتاج إلى معرّف.',
      STATUS_INVALID: 'حالة السجل يجب أن تكون مسودة أو مكتمل.',
      COMPLETE_STATUS_MISMATCH: 'لا يمكن حفظ السجل كمكتمل قبل الإجابة عن الأنشطة الستة كلها.',
      HOUSEHOLD_SIZE_INVALID: ({ min, max }) => `عدد أفراد الأسرة يجب أن يكون عددًا صحيحًا بين ${min} و${max}.`,
      LOG_NOT_FOUND: 'لا يوجد سجل لهذه الفترة.',
      CONFIRMATION_REQUIRED: 'يلزم تأكيد الحذف أولًا.',
      RESET_TARGET_MISMATCH: 'تغيّر السجل منذ طلب الحذف، ولم يُحذف شيء.',
    },

    projection: {
      insufficient: ({ covered, min }) =>
        `لديك ${covered} من ${min} أيام مكتملة. نحتاج ${min} أيام مكتملة على الأقل لعرض توقع شهري.`,
      remaining: ({ remaining }) => `المتبقي: ${remaining}`,
      partial: ({ sample }) => `بُني على ${sample} أيام مكتملة. لم نحسب إلا الأيام المكتملة.`,
      fullyCovered: 'كل أيام الشهر مكتملة. هذا مجموع تقديري لجميع الأيام وليس توقعًا.',
      formulaWholeMonth: 'المتوسط اليومي التقديري × عدد أيام الشهر',
      formulaWithRecorded: 'المجموع المسجل + (المتوسط اليومي التقديري × الأيام غير المسجلة)',
      excludedLogs: ({ count }) => `سجلات غير مُدرجة في الحساب: ${count}`,
      labels: {
        monthlyOutlook: 'توقع شهري',
        monthlyEstimatedTotal: 'مجموع تقديري لجميع أيام الشهر',
        recordedTotal: 'مجموع تقديري للأيام المكتملة',
        dailyAverage: 'متوسط يومي تقديري',
      },
    },

    reset: {
      title: 'حذف بيانات الفترة',
      description: ({ period }) => `سيتم حذف بيانات هذه الفترة: ${period}. لا يمكن التراجع عن ذلك.`,
      confirm: 'حذف الفترة',
      cancel: 'إلغاء',
    },
  },

  layout: {
    skipToContent: 'تخطي إلى المحتوى',
    mainNav: 'التنقل الرئيسي',
    quickNav: 'التنقل السريع',
    footerNote: 'WaterWise يعرض تقديرات من عاداتك المُدخلة.',
    nav: {
      home: 'الرئيسية',
      calculator: 'حاسبة المياه',
      aboutEstimates: 'عن التقديرات',
      dashboard: 'لوحة التحكم',
      history: 'السجل',
      recommendations: 'النصائح',
      reports: 'التقارير',
      settings: 'الإعدادات',
      profile: 'الملف الشخصي',
    },
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    logout: 'تسجيل الخروج',
    plannedTitle: 'قيد الإنشاء',
    plannedBody: 'هذه الصفحة ضمن خطة المنصة ولم تكتمل بعد. ستتوفر قريبًا.',
  },

  home: {
    devLink: 'معرض المكوّنات (للتطوير فقط)',
    hero: {
      title: 'اعرف كم تستهلك أسرتك من المياه، وكيف توفّر منها',
      body: 'قدّر استهلاك منزلك من المياه بخطوات بسيطة، وتتبّع عاداتك، واحصل على نصائح عملية لتقليل الهدر.',
      primary: 'جرّب الحاسبة الآن',
      secondary: 'أنشئ حسابًا لتتبّع استهلاكك',
      sampleTitle: 'هكذا نعرض الأرقام',
      sampleNote: 'مثال توضيحي: الأرقام هنا للشرح فقط.',
      sampleEstimateLabel: 'متوسط يومي تقديري',
      sampleProjectionLabel: 'توقع شهري',
      sampleProjectionNote: 'بُني على ٨ أيام مكتملة من ٣٠.',
    },
    benefits: {
      title: 'ماذا تقدّم لك المنصة؟',
      items: [
        { title: 'قدّر استهلاكك', body: 'أدخل عاداتك في الاستحمام والغسيل والري وغيرها، ونحسب لك التقدير.' },
        { title: 'افهم أين تذهب المياه', body: 'اعرف الأنشطة الأعلى استهلاكًا في منزلك لتركّز جهدك عليها.' },
        { title: 'تتبّع وقلّل الهدر', body: 'سجّل أيامك وأسابيعك، وتابع التغيّر عبر الوقت، واستفد من نصائح عملية.' },
      ],
    },
    how: {
      title: 'كيف تعمل الحاسبة؟',
      steps: [
        { title: 'اختر الفترة', body: 'يوم واحد، أو أسبوع كامل من سبعة أيام متتالية.' },
        { title: 'أجب عن الأنشطة الستة', body: 'اكتب عدد المرات والمدة، أو اختر «لا استخدام».' },
        { title: 'اطّلع على النتيجة', body: 'نعرض تقديرًا لكل يوم، وتوقعًا شهريًا عندما تتوفر بيانات كافية.' },
      ],
    },
    honesty: {
      title: 'تقدير، وليس قياسًا',
      body: 'كل رقم تراه هنا محسوب من عاداتك المُدخلة ومن افتراضات قابلة للتعديل، وليس من عدّاد المياه. نميّز في كل مكان بين «تقديري» و«متوقع».',
      link: 'اعرف طريقة الحساب',
    },
  },

  auth: {
    demoNotice: 'نسخة تجريبية: لا يوجد خادم بعد، ولا يتم إرسال أي بيانات.',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    login: {
      title: 'تسجيل الدخول',
      subtitle: 'مرحبًا بعودتك.',
      submit: 'دخول',
      forgot: 'نسيت كلمة المرور؟',
      noAccount: 'ليس لديك حساب؟',
      toRegister: 'أنشئ حسابًا',
    },
    register: {
      title: 'إنشاء حساب',
      subtitle: 'احفظ نتائجك وتتبّع استهلاكك مع الوقت.',
      fullName: 'الاسم',
      passwordHint: '٨ أحرف على الأقل.',
      submit: 'إنشاء الحساب',
      haveAccount: 'لديك حساب بالفعل؟',
      toLogin: 'سجّل الدخول',
    },
    forgot: {
      title: 'استعادة كلمة المرور',
      body: 'أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة التعيين.',
      submit: 'أرسل الرابط',
      sent: 'إن كان البريد مسجلًا لدينا، سيصلك رابط لإعادة تعيين كلمة المرور.',
      back: 'العودة إلى تسجيل الدخول',
    },
    reset: {
      title: 'تعيين كلمة مرور جديدة',
      password: 'كلمة المرور الجديدة',
      confirm: 'تأكيد كلمة المرور',
      submit: 'حفظ كلمة المرور',
    },
  },

  onboarding: {
    title: 'إعداد بيانات أسرتك',
    description: 'نحتاج بعض المعلومات الأساسية لحساب نصيب الفرد.',
    name: 'اسم المنزل',
    nameHint: 'مثال: منزل العائلة',
    nameRequired: 'اسم المنزل مطلوب.',
    size: 'عدد أفراد الأسرة',
    governorate: 'المحافظة (اختياري)',
    governoratePlaceholder: 'اختر المحافظة',
    submit: 'حفظ ومتابعة',
  },

  governorates: [
    { value: 'cairo', label: 'القاهرة' },
    { value: 'giza', label: 'الجيزة' },
    { value: 'alexandria', label: 'الإسكندرية' },
    { value: 'qalyubia', label: 'القليوبية' },
    { value: 'port_said', label: 'بورسعيد' },
    { value: 'suez', label: 'السويس' },
    { value: 'luxor', label: 'الأقصر' },
    { value: 'aswan', label: 'أسوان' },
    { value: 'asyut', label: 'أسيوط' },
    { value: 'beheira', label: 'البحيرة' },
    { value: 'beni_suef', label: 'بني سويف' },
    { value: 'dakahlia', label: 'الدقهلية' },
    { value: 'damietta', label: 'دمياط' },
    { value: 'faiyum', label: 'الفيوم' },
    { value: 'gharbia', label: 'الغربية' },
    { value: 'ismailia', label: 'الإسماعيلية' },
    { value: 'kafr_el_sheikh', label: 'كفر الشيخ' },
    { value: 'matrouh', label: 'مطروح' },
    { value: 'minya', label: 'المنيا' },
    { value: 'monufia', label: 'المنوفية' },
    { value: 'new_valley', label: 'الوادي الجديد' },
    { value: 'north_sinai', label: 'شمال سيناء' },
    { value: 'qena', label: 'قنا' },
    { value: 'red_sea', label: 'البحر الأحمر' },
    { value: 'sharqia', label: 'الشرقية' },
    { value: 'sohag', label: 'سوهاج' },
    { value: 'south_sinai', label: 'جنوب سيناء' },
  ],

  mock: {
    userName: 'مستخدم تجريبي',
    householdName: 'منزل العائلة',
  },

  calculatorPage: {
    title: 'حاسبة المياه',
    subtitle: 'أجب عن الأنشطة الستة لتحصل على تقدير استهلاك أسرتك.',
    guestBanner: 'أنت تستخدم الحاسبة كزائر. يمكنك رؤية النتائج، ولحفظها وتتبّع استهلاكك سجّل حسابًا.',
    guestBannerCta: 'إنشاء حساب',
    period: {
      title: 'الفترة',
      typeLabel: 'نوع الفترة',
      dayDate: 'التاريخ',
      weekDate: 'أول يوم في الأسبوع',
      useToday: 'اليوم',
      useLast7: 'آخر ٧ أيام',
      dayHint: 'أدخل عدد المرات خلال هذا اليوم.',
      weekHint: 'أدخل إجمالي المرات خلال الأسبوع كله (٧ أيام متتالية). لا تضرب الرقم في ٧.',
      weekEnds: ({ end }) => `ينتهي الأسبوع في ${end}`,
      chooseFirst: 'اختر الفترة أولًا لتبدأ الإدخال.',
    },
    changeType: {
      title: 'تغيير نوع الفترة',
      body: 'سيتم مسح القيم المُدخلة، لأن عدد المرات يختلف بين اليوم والأسبوع. لن تُحوَّل القيم تلقائيًا.',
      confirm: 'تغيير ومسح القيم',
      cancel: 'إلغاء',
    },
    activity: {
      rateLine: ({ rate, unit }) => `الافتراض: ${rate} ${unit}`,
      answered: 'تمت الإجابة',
      unanswered: 'بانتظار إجابتك',
      noUsageBody: 'لا يوجد استهلاك لهذا النشاط في هذه الفترة.',
      edit: 'تعديل',
      increase: 'زيادة',
      decrease: 'إنقاص',
      durationDisabledHint: 'المدة غير مطلوبة عند عدم الاستخدام.',
    },
    assumptions: {
      title: 'ما هي الافتراضات؟',
      intro: 'نحسب التقدير بضرب الكمية في معدّل افتراضي. هذه المعدلات قيم افتراضية قابلة للتعديل، وليست معايير رسمية لمصر.',
      guestNote: 'تعديلاتك هنا تخص هذه الجلسة فقط.',
      registeredNote: 'التعديلات تُطبَّق على الحسابات الجديدة فقط، ولا تغيّر السجلات المحفوظة.',
      rateLabel: 'المعدل',
      placeholder: 'افتراضي',
      edited: 'مُعدّل',
      reset: 'استعادة الافتراضي',
      resetAll: 'استعادة كل الافتراضات',
    },
    results: {
      title: 'النتيجة',
      pending: 'أجب عن الأنشطة الستة لعرض النتيجة.',
      partialSubtotal: 'مجموع جزئي (غير مُدرج في الحساب)',
      dailyEstimate: 'متوسط يومي تقديري',
      periodTotal: 'إجمالي الفترة',
      weekNote: 'متوسط أسبوعي موزّع على ٧ أيام',
      perMember: 'تقدير للفرد',
      householdSize: 'عدد أفراد الأسرة',
      needHouseholdSize: 'أدخل عدد أفراد الأسرة لعرض نصيب الفرد.',
      breakdown: 'التوزيع حسب النشاط',
      topActivity: ({ name }) => `أعلى نشاط استهلاكًا: ${name}`,
      guestDayHint: 'أدخل أسبوعًا كاملًا لعرض توقع شهري.',
      share: ({ percent }) => `${percent}٪`,
      addDay: 'أضف يومًا أو أسبوعًا',
    },
    live: { complete: 'إجمالي الفترة', partial: 'مجموع جزئي (غير مُدرج في الحساب)' },
    save: {
      complete: 'حفظ كسجل مكتمل',
      draft: 'حفظ كمسودة',
      clear: 'مسح الإدخال',
      savedComplete: 'تم حفظ السجل.',
      savedDraft: 'تم حفظ المسودة.',
      failed: 'تعذّر الحفظ. راجع الملاحظات في الصفحة.',
      viewHistory: 'عرض السجل',
    },
    gate: {
      title: 'سجّل لحفظ النتيجة',
      body: 'سجّل لحفظ النتيجة وتتبّع استهلاكك. ستحصل على لوحة تحكم شخصية وسجل لأيامك. ما أدخلته سيبقى في الصفحة.',
      register: 'إنشاء حساب',
      login: 'لدي حساب',
      later: 'متابعة كزائر',
    },
  },

  dashboard: {
    title: 'لوحة التحكم',
    householdLine: ({ name, size }) => `${name} · ${size} أفراد`,
    latestDay: 'تقدير آخر يوم مسجل',
    latestWeek: 'متوسط يومي من آخر أسبوع مسجل',
    weekSum: 'مجموع تقديري لآخر ٧ أيام',
    monthToDate: 'مجموع تقديري للأيام المكتملة هذا الشهر',
    perMember: 'تقدير للفرد (متوسط آخر ٣٠ يومًا)',
    topActivities: 'الأنشطة الأعلى استهلاكًا (آخر ٣٠ يومًا)',
    topActivitiesNote: ({ days }) => `مبني على ${days} من الأيام المكتملة.`,
    perMemberMissing: 'نحتاج يومًا مكتملًا واحدًا على الأقل خلال آخر ٣٠ يومًا.',
    emptyTitle: 'لا توجد سجلات مكتملة بعد',
    emptyBody: 'أضف يومًا أو أسبوعًا مكتملًا من الحاسبة لتظهر أرقامك هنا.',
    startCalculator: 'ابدأ بالحاسبة',
    finishDrafts: 'أكمل المسودات من السجل',
    outlookTitle: 'التوقع الشهري',
  },

  history: {
    title: 'السجل',
    description: 'كل الأيام والأسابيع التي سجّلتها. المسودات لا تدخل في أي حساب.',
    filters: {
      from: 'من تاريخ',
      to: 'إلى تاريخ',
      type: 'نوع الفترة',
      status: 'الحالة',
      all: 'الكل',
      clear: 'مسح التصفية',
    },
    count: ({ count }) => `عدد السجلات: ${count}`,
    emptyAll: 'لم تسجّل أي فترة بعد.',
    emptyFiltered: 'لا توجد سجلات في هذا النطاق.',
    draftSubtotal: 'مجموع جزئي، غير مُدرج في الحساب',
    total: 'إجمالي الفترة',
    delete: 'حذف',
    deleted: 'تم حذف الفترة.',
    deleteFailed: 'تعذّر حذف الفترة.',
    addNew: 'سجّل فترة جديدة',
  },

  about: {
    title: 'كيف نحسب تقديراتك؟',
    intro: 'نريدك أن تعرف بالضبط من أين يأتي كل رقم. هذه الصفحة تشرح ذلك ببساطة.',
    sections: {
      bases: {
        title: 'ثلاثة أنواع من الأرقام، لا نخلط بينها',
        items: [
          { label: 'تقديري', body: 'محسوب من عاداتك المُدخلة × افتراضات قابلة للتعديل. مثال: متوسط يومي، أو مجموع أيام مسجلة.' },
          { label: 'متوقع', body: 'امتداد حسابي للمتوسط اليومي على بقية أيام الشهر. وهو ليس استهلاكًا حدث فعلًا، وقد يختلف كثيرًا عن الواقع.' },
        ],
        footer: 'لا نعرض أي رقم على أنه قراءة عدّاد، لأننا لا نستخدم قراءات العدّاد حاليًا.',
      },
      formulas: {
        title: 'طريقة الحساب',
        flow: 'الأنشطة المعتمدة على المدة: لترات = معدّل التدفق (لتر/دقيقة) × مدة المرة الواحدة (دقائق) × عدد المرات.',
        appliance: 'الغسالة وتنظيف المنزل: لترات = لترات الدورة أو الجلسة الواحدة × عدد الدورات أو الجلسات.',
        weekly: 'في السجل الأسبوعي، «عدد المرات» هو إجمالي الأسبوع كله. لا نضربه في ٧، ونقسم الإجمالي على ٧ فقط لنحصل على متوسط يومي.',
      },
      assumptions: {
        title: 'الافتراضات',
        body: 'معدلات التدفق واستهلاك الدورة قيم افتراضية قابلة للتعديل، وليست معايير رسمية لمصر. عدّلها لتناسب منزلك، وستؤثر التعديلات على الحسابات الجديدة فقط.',
      },
      completeness: {
        title: 'متى يُحتسب اليوم؟',
        body: 'لا يُحتسب السجل إلا إذا أجبت عن الأنشطة الستة كلها. «لا استخدام» إجابة صحيحة، أما ترك النشاط فارغًا فلا يعني صفرًا. السجلات غير المكتملة (المسودات) لا تدخل في أي متوسط أو مجموع أو توقع.',
      },
      projection: {
        title: 'متى نعرض توقعًا شهريًا؟',
        body: 'نعرض التوقع الشهري عندما يكون لديك ٧ أيام مكتملة على الأقل في الشهر. هذه قاعدة وضعناها لتجنّب أرقام مضلّلة، وليست حدًّا علميًا. إذا اكتملت كل أيام الشهر نعرض المجموع التقديري بدل التوقع.',
        week: 'السجل الأسبوعي يغطي ٧ أيام، لكن قيمته متوسط موزّع على أيامه، وليس سبعة أيام ملاحظة بشكل منفصل.',
      },
    },
    cta: 'جرّب الحاسبة',
  },

};
