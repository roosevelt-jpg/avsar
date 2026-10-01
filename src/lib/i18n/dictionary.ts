/**
 * S&A Recruitment copy dictionary.
 *
 * The landing-page strings are reproduced verbatim from the `T` object in
 * `Avsar Platform A.dc.html`, as the handoff requires. The handoff also asks
 * for Hindi to be extended beyond the landing page, so sign-up, assessment,
 * dashboard and FAQ copy is translated here.
 *
 * Tamil, Telugu, Malayalam and Punjabi are listed as later candidates in the
 * handoff. Adding one means adding a key to `locales` and a block below.
 */

export const locales = ['en', 'hi'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Label shown in the EN/हिं pill toggle. */
export const localeLabels: Record<Locale, string> = { en: 'EN', hi: 'हिं' };

type Pair = readonly [title: string, body: string];

export type Dictionary = {
  /* Header + navigation */
  navHow: string;
  navSectors: string;
  navPricing: string;
  navEmployers: string;
  signIn: string;

  /* Hero */
  eyebrow: string;
  heroTitle: string;
  heroSub: string;
  askWork: string;
  cta: string;
  fine: string;
  heroMeta: string;

  /* Section headings */
  includesTitle: string;
  howTitle: string;
  placeTitle: string;
  sectorsTitle: string;
  placeEyebrow: string;
  placeFine: string;
  selectionRules: string;
  noPlacementFee: string;
  placementFee: string;
  placementFeeShort: string;
  /* The rate and its base, always in one string. See SELECTION_FUNNEL. */
  rateLine: string;
  funnelTitle: string;
  funnelLead: string;
  funnelStages: readonly Pair[];
  funnelNote: string;
  ctaTitle: string;

  includes: readonly Pair[];
  steps: readonly Pair[];
  place: readonly string[];
  sectors: readonly string[];

  /* Footer */
  footerTerms: string;
  footerRefund: string;
  footerDelivery: string;
  footerPrivacy: string;
  footerContact: string;
  footerLegal: string;

  /* Sign-up */
  signup: {
    help: string;
    stepAccount: string;
    stepProfile: string;
    stepPayment: string;
    title0: string;
    title1: string;
    title2: string;
    fullName: string;
    fullNameHint: string;
    mobile: string;
    email: string;
    passportQ: string;
    passportYes: string;
    passportNo: string;
    mainSector: string;
    years: string;
    yearOptions: readonly string[];
    englishSelf: string;
    englishOptions: readonly string[];
    cityState: string;
    consent: string;
    consentRules: string;
    consentRefund: string;
    back: string;
    continue: string;
    pay: string;
    successTitle: string;
    successBody: string;
    successCta: string;
    summaryTitle: string;
    summaryItem: string;
    summaryIncludes: readonly string[];
    summaryEarly: string;
    summaryGst: string;
    summaryTotal: string;
    summaryNote: string;
    errRequired: string;
    errMobile: string;
    errEmail: string;
    errConsent: string;
    errPassword: string;
    errAccountExists: string;
    errPhoneTaken: string;
    errGeneric: string;
    passwordLabel: string;
    passwordHint: string;
    payFailed: string;
  };

  /* Assessment */
  assess: {
    header: string;
    sectionCounter: string;
    sections: readonly Pair[];
    questionCounter: string;
    previous: string;
    next: string;
    finish: string;
    autosave: string;
    saving: string;
    saved: string;
  };

  /* Dashboard */
  dash: {
    navOverview: string;
    verifyTitle: string;
    verifyBody: string;
    verifyCta: string;
    verifySent: string;
    verifyRateLimited: string;
    verifyFailed: string;
    navReport: string;
    navProfile: string;
    greeting: string;
    title: string;
    pending: string;
    pendingNote: string;
    download: string;
    overall: string;
    overallNote: string;
    englishLabel: string;
    englishNote: string;
    skillsLabel: string;
    skillsNote: string;
    expLabel: string;
    expNote: string;
    cohortStatus: string;
    breakdown: string;
    timeline: readonly string[];
    visible: string;
    visibleNote: string;
  };

  /* How it works: the six steps */
  process: {
    title: string;
    lead: string;
    steps: readonly Pair[];
    responseNote: string;
  };

  /* What a selected candidate receives */
  offer: {
    title: string;
    lead: string;
    items: readonly Pair[];
  };

  /* Documents */
  documents: {
    title: string;
    lead: string;
    required: string;
    optional: string;
    items: readonly Pair[];
    optionalNote: string;
  };

  /* Sign-in */
  auth: {
    title: string;
    lead: string;
    emailLabel: string;
    sendCode: string;
    codeSent: string;
    codeLabel: string;
    verify: string;
    resend: string;
    signOut: string;
    notRegistered: string;
    registerCta: string;
    errEmail: string;
    errCode: string;
    errGeneric: string;
    phoneSoon: string;
    passwordLabel: string;
    signInWithPassword: string;
    useCodeInstead: string;
    usePasswordInstead: string;
    errCredentials: string;
    errRateLimited: string;
    staffNote: string;
  };

  /* Profile */
  profile: {
    navProfile: string;
    title: string;
    lead: string;
    cvTitle: string;
    cvLead: string;
    cvChoose: string;
    cvReplace: string;
    cvUploading: string;
    cvDone: string;
    cvError: string;
    cvHint: string;
    orManual: string;
    aboutTitle: string;
    headline: string;
    headlinePlaceholder: string;
    summary: string;
    linkedin: string;
    experienceTitle: string;
    addExperience: string;
    employer: string;
    jobTitle: string;
    jobLocation: string;
    from: string;
    to: string;
    current: string;
    duties: string;
    educationTitle: string;
    addEducation: string;
    institution: string;
    qualification: string;
    field: string;
    startYear: string;
    endYear: string;
    skillsTitle: string;
    skillsHint: string;
    languagesTitle: string;
    language: string;
    level: string;
    addLanguage: string;
    readyTitle: string;
    availability: string;
    availabilityOptions: readonly string[];
    relocation: string;
    relocationYes: string;
    relocationNo: string;
    remove: string;
    save: string;
    saving: string;
    saved: string;
    saveError: string;
  };

  /* Candidate journey status */
  status: {
    title: string;
    registered: string;
    profile: string;
    assessment: string;
    report: string;
    selection: string;
    done: string;
    current: string;
    todo: string;
    sectionsProgress: string;
    continueAssessment: string;
    startAssessment: string;
    completeProfile: string;
  };

  /* Pricing + FAQ */
  pricing: {
    title: string;
    lead: string;
    startCta: string;
    candidates: string;
    candidatesPeriod: string;
    candidatesNote: string;
    candidatesFeatures: readonly string[];
    employers: string;
    employersPeriod: string;
    employersNote: string;
    employersFeatures: readonly string[];
    partner: string;
    partnerPrice: string;
    partnerNote: string;
    partnerFeatures: readonly string[];
    bookCall: string;
    contactSales: string;
    questions: string;
    faq: readonly Pair[];
  };
};

const en: Dictionary = {
  navHow: 'How it works',
  navSectors: 'Sectors',
  navPricing: 'Pricing',
  navEmployers: 'For employers',
  signIn: 'Sign in',

  eyebrow: 'India → Portugal · Applications open',
  heroTitle: 'Work in Portugal. We handle everything after you are selected.',
  heroSub:
    'A professional assessment of your skills, experience and English. Selected candidates receive a contract with a Portuguese employer, accommodation, meals and legal support through the whole visa process.',
  askWork: 'What position are you applying for?',
  cta: 'Start your application',
  fine: 'You pay the assessment fee once, after you have seen what the assessment involves. Selection is not guaranteed, and we tell you either way within {days} days.',
  heroMeta: '{inr} · 60–90 min · online',

  includesTitle: 'What your fee includes',
  howTitle: 'How it works',
  placeTitle: 'What a selected candidate receives',
  sectorsTitle: 'Positions we are hiring for',
  placeEyebrow: 'FOR THE SELECTED CANDIDATE',
  placeFine: 'Selection is not guaranteed. You receive an answer within {days} days of completing your application.',
  selectionRules: 'Selection rules',
  noPlacementFee:
    'You never pay us for the job itself. The assessment fee is the only thing you pay. The employer pays our placement fee, not you.',
  placementFee:
    'If you are placed, there is a placement fee of €{eur}. You pay it only once your job is confirmed and your contract is signed, never before. The {inr} assessment fee is separate and is what you pay now.',
  placementFeeShort: 'Placement fee €{eur}, payable only after your job is confirmed.',
  rateLine:
    '{rate}% of the candidates we put in front of an employer are hired. Getting to that stage is the hard part, and this is what it looks like.',
  funnelTitle: 'Where people actually get to',
  funnelLead: 'Out of every 100 people who complete the assessment:',
  funnelStages: [
    ['{complete} complete the assessment', 'Everyone who pays and finishes.'],
    ['{call} reach an assessment call', 'A recruiter calls you about the work. Roughly one in four.'],
    ['{presented} are presented to an employer', 'Your profile and report go to a company with a live vacancy.'],
    ['{hired} are hired', 'That is {applicantRate} in 100 of everyone who applies.'],
  ],
  funnelNote:
    'We publish this because the number that matters to you is the last one, not the first. If those odds are not worth {fee} to you, do not apply: the assessment and the report are what the fee buys, and a placement is not guaranteed.',
  ctaTitle: 'Applications are open.',

  includes: [
    ['Professional assessment', 'Online assessment of 60–90 minutes covering your skills, work experience and English.'],
    ['Skills report', 'A scored breakdown of your strengths and gaps. It is yours to keep and share.'],
    ['An answer, either way', 'We tell you within {days} days whether you are moving forward. You are not left waiting.'],
  ],
  steps: [
    ['Register and pay', 'Create your account and pay the ₹1,999 assessment fee by UPI or card.'],
    ['Take the assessment', 'Complete it online from your phone or computer, at a time that suits you.'],
    ['Get your report', 'Your skills report and profile are ready within 7 days.'],
    ['Selection', 'The top candidate in each cohort is offered a full placement in Portugal.'],
  ],
  place: [
    '{years}-year employment contract with a Portuguese employer',
    'Monthly salary',
    'Accommodation',
    'Meals',
    'Legal support through the entire visa process',
    'Residence permit and paperwork after arrival',
  ],
  sectors: [
    'Chef',
    'Food and beverage service',
    'Cleaner',
    'Property management',
    'Driver',
    'Logistics',
    'Construction worker',
    'Electrician',
    'Plumber',
    'Welder',
    'Data analyst',
    'QA tester',
  ],

  footerTerms: 'Terms',
  footerRefund: 'Refunds',
  footerDelivery: 'Service delivery',
  footerPrivacy: 'Privacy',
  footerContact: 'Contact',
  footerLegal: '© 2026 S&A Recruitment, a Smith & Adams company · Lisbon · New Delhi',

  signup: {
    help: 'Need help? WhatsApp +91 80 0000 0000',
    stepAccount: 'Account',
    stepProfile: 'Profile',
    stepPayment: 'Payment',
    title0: 'Create your account',
    title1: 'Your work profile',
    title2: 'Pay the assessment fee',
    fullName: 'Full name',
    fullNameHint: 'as on passport',
    mobile: 'Mobile number',
    email: 'Email',
    passportQ: 'Do you have a valid passport?',
    passportYes: 'Yes',
    passportNo: 'Not yet',
    mainSector: 'Main sector',
    years: 'Years of experience in this sector',
    yearOptions: ['Less than 1 year', '1–3 years', '3–5 years', '5+ years'],
    englishSelf: 'How would you rate your spoken English?',
    englishOptions: ['Basic', 'Conversational', 'Fluent'],
    cityState: 'City and state',
    consent:
      'I understand the fee pays for my assessment, skills report and talent-pool profile. Selection for the Portugal placement is limited to about 1 candidate per cohort and is not guaranteed. I have read the',
    consentRules: 'selection rules',
    consentRefund: 'refund policy',
    back: 'Back',
    continue: 'Continue',
    pay: 'Pay ₹1,999',
    successTitle: "You're registered for Cohort 01",
    successBody:
      'Payment received. Receipt {receipt} was sent to your email and WhatsApp. You can start the assessment now or come back within 14 days.',
    successCta: 'Start assessment',
    summaryTitle: 'ORDER SUMMARY',
    summaryItem: 'Cohort 01 assessment',
    summaryIncludes: [
      'Skills, experience and English assessment',
      'Personal skills report',
      'Verified talent-pool profile, 12 months',
    ],
    summaryEarly: 'Early registration',
    summaryGst: 'GST 18%',
    summaryTotal: 'Total',
    summaryNote:
      'Price rises to ₹2,499 when early registration closes. Full refund if you cancel before starting the assessment.',
    errRequired: 'This field is required.',
    errMobile: 'Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9.',
    errEmail: 'Enter a valid email address.',
    errConsent: 'Please confirm you have read the selection rules.',
    errPassword: 'Use at least 8 characters.',
    /* Names the way out. "Email already in use" leaves them on a form that
       will keep refusing them. */
    errAccountExists: 'You already have an account with this address. Sign in instead.',
    errPhoneTaken: 'This mobile number is already registered in this cohort.',
    errGeneric: 'Something went wrong. Please try again.',
    passwordLabel: 'Create a password',
    passwordHint: 'At least 8 characters. You will use it to sign back in.',
    payFailed: 'We could not start the payment. Please try again.',
  },

  assess: {
    header: 'Assessment · Cohort 01',
    sectionCounter: 'Section {n} of {total}',
    sections: [
      ['Skills', '20 questions'],
      ['Experience', '8 questions'],
      ['English', 'Reading, grammar, speaking'],
      ['Profile', '5 questions'],
    ],
    questionCounter: 'Question {n} of {total}',
    previous: 'Previous',
    next: 'Next',
    finish: 'Finish section',
    autosave: 'Your answers save automatically. If your connection drops, you can continue from this question.',
    saving: 'Saving…',
    saved: 'Saved',
  },

  dash: {
    navOverview: 'Overview',
    verifyTitle: 'Confirm your email address',
    verifyBody:
      'Your report is sent to {email}, so we need to know it reaches you. Open the email we sent and follow the link. Everything else here works in the meantime.',
    verifyCta: 'Send the link again',
    verifySent: 'Sent. Check {email}, including the spam folder.',
    verifyRateLimited: 'Too many requests. Try again in an hour.',
    verifyFailed: 'We could not send it. Please try again shortly.',
    navReport: 'Report',
    navProfile: 'Profile',
    greeting: 'Namaste, {name}',
    title: 'Your report is ready',
    pending: 'Your report is not ready yet',
    pendingNote:
      'Once you complete the assessment, your skills report and talent-pool profile are ready within 7 days. We will message you when it is.',
    download: 'Download report (PDF)',
    overall: 'Overall score',
    overallNote: 'Top {percentile}% of Cohort 01',
    englishLabel: 'English (CEFR)',
    englishNote: 'Independent user',
    skillsLabel: '{sector} skills',
    skillsNote: 'Strong',
    expLabel: 'Experience',
    expNote: '{years} years, verified',
    cohortStatus: 'Cohort status',
    breakdown: 'Report breakdown',
    timeline: [
      'Registered and paid',
      'Assessment completed',
      'Skills report ready',
      'Cohort 01 review',
      'Selection announced',
    ],
    visible: 'Visible to employers',
    visibleNote: 'Vetted employers in Portugal and Europe can find your profile.',
  },

  process: {
    title: 'How it works',
    lead: 'Six steps, and you know where you stand at every one of them.',
    steps: [
      ['Register', 'Create your account with your name, mobile and email. It takes two minutes.'],
      ['Upload your CV and documents', 'A CV and a photo are all we need to start. Adding your passport and supporting documents lets us tell you sooner whether your file is ready for a visa.'],
      ['Take the first assessment', 'An online assessment of your skills, work experience and English. Sixty to ninety minutes, from your phone or a computer, whenever suits you.'],
      ['Pay the assessment fee', 'Pay once, after you have seen what the assessment involves.'],
      ['Assessment call', 'If you are shortlisted, one of our recruiters calls you. This is a real conversation about the work, not a formality.'],
      ['Confirmation letter', 'If you are selected, you receive a confirmation letter to sign, and we begin the visa process with you.'],
    ],
    responseNote: 'You get an answer within {days} days of completing your application. Not a queue with no end: an answer.',
  },

  offer: {
    title: 'What a selected candidate receives',
    lead: 'Everything needed to arrive and start work, arranged before you travel.',
    items: [
      ['Employment contract', 'A {years}-year contract with a Portuguese employer, signed before you leave.'],
      ['Accommodation', 'Housing arranged and ready on arrival.'],
      ['Meals', 'Provided as part of the placement.'],
      ['Legal support', 'The visa, the residence permit and the paperwork after arrival, handled with you throughout.'],
    ],
  },

  documents: {
    title: 'What to send',
    lead: 'A CV and a photo are all we need to start. Everything else helps us move faster and none of it is required.',
    required: 'Required',
    optional: 'Helps us move faster',
    items: [
      ['CV', 'In any format. If you do not have one, fill in your profile instead and we will build it with you.'],
      ['Photograph', 'A clear, recent photograph of your face.'],
      ['Passport', 'The photo page. If you have not applied yet, say so and we will tell you when to start.'],
      ['Qualifications', 'Certificates, trade cards, training records.'],
      ['Work references', 'Employment letters, contracts or payslips.'],
      ['Police clearance', 'Needed later for the visa. Useful to have early.'],
    ],
    optionalNote: 'Sending documents is optional and does not affect your assessment score. It affects how quickly we can tell you whether your file is ready to start a visa application.',
  },

  auth: {
    title: 'Sign in',
    lead: 'Enter the email address you registered with. We will send you a 6-digit code.',
    emailLabel: 'Email',
    sendCode: 'Send code',
    codeSent: 'We sent a 6-digit code to {email}. It expires in 10 minutes.',
    codeLabel: '6-digit code',
    verify: 'Sign in',
    resend: 'Send another code',
    signOut: 'Sign out',
    notRegistered: 'Not registered yet?',
    registerCta: 'Start the assessment',
    errEmail: 'Enter a valid email address.',
    errCode: 'That code is not right, or it has expired.',
    errGeneric: 'Something went wrong. Please try again.',
    phoneSoon: 'Signing in by WhatsApp or SMS is coming. For now, use the email address you registered with.',
    passwordLabel: 'Password',
    signInWithPassword: 'Sign in',
    useCodeInstead: 'Email me a code instead',
    usePasswordInstead: 'Use a password instead',
    errCredentials: 'Those details are not right.',
    errRateLimited: 'Too many code requests. Please wait a few minutes and try again.',
    staffNote: 'Candidates: use a code. Employers and staff: use your password.',
  },

  profile: {
    navProfile: 'Profile',
    title: 'Your profile',
    lead: 'Upload your CV and we will read it for you, or fill it in yourself. Either way, this is what employers see.',
    cvTitle: 'Your CV',
    cvLead: 'PDF works best. We read it to fill in your experience, and a person checks it before anything is decided.',
    cvChoose: 'Choose a file',
    cvReplace: 'Replace CV',
    cvUploading: 'Uploading…',
    cvDone: 'Uploaded',
    cvError: 'That upload did not work. Please try again.',
    cvHint: 'PDF, up to 10 MB',
    orManual: 'Or fill it in yourself',
    aboutTitle: 'About you',
    headline: 'Headline',
    headlinePlaceholder: 'Housekeeping supervisor, 6 years',
    summary: 'Short summary',
    linkedin: 'LinkedIn (optional)',
    experienceTitle: 'Work experience',
    addExperience: 'Add a job',
    employer: 'Employer',
    jobTitle: 'Job title',
    jobLocation: 'City and country',
    from: 'From',
    to: 'To',
    current: 'I work here now',
    duties: 'What you did',
    educationTitle: 'Education and training',
    addEducation: 'Add education',
    institution: 'School or institute',
    qualification: 'Qualification',
    field: 'Subject',
    startYear: 'Start year',
    endYear: 'End year',
    skillsTitle: 'Skills',
    skillsHint: 'Separate with commas',
    languagesTitle: 'Languages',
    language: 'Language',
    level: 'Level',
    addLanguage: 'Add a language',
    readyTitle: 'Availability',
    availability: 'How soon could you start abroad?',
    availabilityOptions: ['Within 1 month', '1 to 3 months', '3 to 6 months', 'More than 6 months'],
    relocation: 'Are you ready to relocate to Portugal?',
    relocationYes: 'Yes',
    relocationNo: 'Not yet',
    remove: 'Remove',
    save: 'Save profile',
    saving: 'Saving…',
    saved: 'Saved',
    saveError: 'We could not save that. Please try again.',
  },

  status: {
    title: 'Where you are',
    registered: 'Registered and paid',
    profile: 'Profile and CV',
    assessment: 'Assessment',
    report: 'Skills report',
    selection: 'Cohort selection',
    done: 'Done',
    current: 'Now',
    todo: 'Next',
    sectionsProgress: '{done} of {total} sections',
    continueAssessment: 'Continue assessment',
    startAssessment: 'Start assessment',
    completeProfile: 'Complete your profile',
  },

  pricing: {
    title: 'Pricing',
    lead: 'One fee for candidates. Employers pay only when they hire.',
    startCta: 'Start assessment',
    candidates: 'CANDIDATES',
    candidatesPeriod: 'one-time',
    candidatesNote: 'Early registration. ₹2,499 after. About €20–€25.',
    candidatesFeatures: [
      'Full assessment',
      'Skills report',
      'Talent-pool profile, 12 months',
      'Considered for the Cohort 01 placement',
    ],
    employers: 'EMPLOYERS · PER HIRE',
    employersPeriod: 'per placement',
    employersNote: 'Search is free. Pay when the candidate starts.',
    employersFeatures: ['Talent-pool search', 'Skills reports', 'Visa and relocation handled', '90-day replacement'],
    partner: 'EMPLOYERS · PARTNER',
    partnerPrice: 'Custom',
    partnerNote: 'For 10+ hires a year across sites.',
    partnerFeatures: [
      'Everything in per hire',
      'Dedicated recruiter',
      'Pre-arrival training',
      'Housing coordination',
    ],
    bookCall: 'Book a call',
    contactSales: 'Contact sales',
    questions: 'Questions',
    faq: [
      [
        'What does the assessment fee pay for?',
        'Your full assessment of skills, work experience and English, your personal skills report, and a decision within {days} days. You pay once, after you have seen what the assessment involves.',
      ],
      [
        'What happens after I pay?',
        'You complete the assessment. If you are shortlisted, one of our recruiters calls you for a real conversation about the work. If you are selected, you receive a confirmation letter to sign and we begin the visa process with you.',
      ],
      [
        'How long until I hear back?',
        'Within {days} days of completing your application. Whether the answer is yes or no, you get one. You are not left in a queue.',
      ],
      [
        'Is selection guaranteed?',
        'No. The fee pays for the assessment and the report, not for a placement. If you are not selected, you keep the report and we tell you why.',
      ],
      [
        'Do I have to send my documents?',
        'No. A CV and a photograph are all we need to start. Sending your passport and supporting documents does not change your assessment score; it lets us tell you sooner whether your file is ready to begin a visa application.',
      ],
      [
        'What does the placement include?',
        'A {years}-year employment contract with a Portuguese employer, a monthly salary, accommodation, meals, and legal support through the visa process and the paperwork after you arrive.',
      ],
      [
        'Can I get a refund?',
        'You get a full refund if you cancel before starting the assessment. After you start, the fee is not refundable, because the assessment and the report are being delivered.',
      ],
      [
        'Is S&A Recruitment a licensed recruitment agency?',
        'Registration details for India and Portugal will be listed here before applications open.',
      ],
    ],
  },
};

const hi: Dictionary = {
  navHow: 'यह कैसे काम करता है',
  navSectors: 'क्षेत्र',
  navPricing: 'मूल्य',
  navEmployers: 'नियोक्ताओं के लिए',
  signIn: 'साइन इन',

  eyebrow: 'भारत → पुर्तगाल · आवेदन खुले हैं',
  heroTitle: 'पुर्तगाल में काम करें। चुने जाने के बाद सब कुछ हम संभालते हैं।',
  heroSub:
    'आपके कौशल, अनुभव और अंग्रेज़ी का पेशेवर मूल्यांकन। चुने गए उम्मीदवारों को पुर्तगाली नियोक्ता के साथ अनुबंध, आवास, भोजन और पूरी वीज़ा प्रक्रिया में क़ानूनी सहायता मिलती है।',
  askWork: 'आप किस पद के लिए आवेदन कर रहे हैं?',
  cta: 'अपना आवेदन शुरू करें',
  fine: 'मूल्यांकन शुल्क एक बार देना होता है, और वह भी मूल्यांकन देखने के बाद। चयन की गारंटी नहीं है, और {days} दिनों के भीतर हम आपको दोनों हालात में बताते हैं।',
  heroMeta: '{inr} · 60–90 मिनट · ऑनलाइन',

  includesTitle: 'आपकी फ़ीस में क्या शामिल है',
  howTitle: 'यह कैसे काम करता है',
  placeTitle: 'चुने गए उम्मीदवार को क्या मिलता है',
  sectorsTitle: 'जिन पदों के लिए हम भर्ती कर रहे हैं',
  placeEyebrow: 'चुने गए उम्मीदवार के लिए',
  placeFine: 'चयन की गारंटी नहीं है। आवेदन पूरा करने के {days} दिनों के भीतर आपको उत्तर मिलता है।',
  selectionRules: 'चयन नियम',
  noPlacementFee:
    'नौकरी के लिए आप हमें कभी भुगतान नहीं करते। आप केवल मूल्यांकन शुल्क देते हैं। हमारी प्लेसमेंट फ़ीस नियोक्ता देता है, आप नहीं।',
  placementFee:
    'यदि आपका चयन होता है, तो €{eur} की प्लेसमेंट फ़ीस है। यह आप तभी देते हैं जब आपकी नौकरी पक्की हो जाए और अनुबंध पर हस्ताक्षर हो जाएँ, उससे पहले कभी नहीं। {inr} की आकलन फ़ीस अलग है और वही आप अभी दे रहे हैं।',
  placementFeeShort: 'प्लेसमेंट फ़ीस €{eur}, नौकरी पक्की होने के बाद ही देय।',
  rateLine:
    'जिन उम्मीदवारों को हम नियोक्ता के सामने रखते हैं, उनमें से {rate}% को नौकरी मिलती है। मुश्किल हिस्सा उस चरण तक पहुँचना है, और वह ऐसा दिखता है।',
  funnelTitle: 'लोग असल में कहाँ तक पहुँचते हैं',
  funnelLead: 'मूल्यांकन पूरा करने वाले हर 100 लोगों में से:',
  funnelStages: [
    ['{complete} मूल्यांकन पूरा करते हैं', 'हर वह व्यक्ति जो भुगतान करके पूरा करता है।'],
    ['{call} को मूल्यांकन कॉल मिलती है', 'रिक्रूटर आपसे काम के बारे में बात करता है। लगभग चार में से एक।'],
    ['{presented} नियोक्ता के सामने रखे जाते हैं', 'आपकी प्रोफ़ाइल और रिपोर्ट किसी खुली रिक्ति वाली कंपनी को जाती है।'],
    ['{hired} को नौकरी मिलती है', 'यानी आवेदन करने वाले हर 100 में से {applicantRate}।'],
  ],
  funnelNote:
    'हम यह इसलिए बताते हैं क्योंकि आपके लिए अहम आख़िरी संख्या है, पहली नहीं। अगर ये संभावनाएँ आपके लिए {fee} के लायक़ नहीं हैं, तो आवेदन न करें: फ़ीस से मूल्यांकन और रिपोर्ट मिलती है, प्लेसमेंट की गारंटी नहीं।',
  ctaTitle: 'आवेदन खुले हैं।',

  includes: [
    ['पेशेवर मूल्यांकन', '60–90 मिनट का ऑनलाइन मूल्यांकन, जिसमें आपके कौशल, कार्य अनुभव और अंग्रेज़ी की जाँच होती है।'],
    ['स्किल्स रिपोर्ट', 'आपकी ताक़त और कमियों का अंकों सहित विवरण। यह आपकी है, आप इसे रख और साझा कर सकते हैं।'],
    ['उत्तर, दोनों हालात में', '{days} दिनों के भीतर हम बताते हैं कि आप आगे बढ़ रहे हैं या नहीं। आपको इंतज़ार में नहीं छोड़ा जाता।'],
  ],
  steps: [
    ['रजिस्टर करें और भुगतान करें', 'अपना खाता बनाएँ और UPI या कार्ड से ₹1,999 मूल्यांकन शुल्क चुकाएँ।'],
    ['मूल्यांकन दें', 'इसे अपने फ़ोन या कंप्यूटर से, अपनी सुविधा के समय ऑनलाइन पूरा करें।'],
    ['अपनी रिपोर्ट पाएँ', 'आपकी स्किल्स रिपोर्ट और प्रोफ़ाइल 7 दिनों के भीतर तैयार हो जाती है।'],
    ['चयन', 'हर कोहॉर्ट के सर्वश्रेष्ठ उम्मीदवार को पुर्तगाल में पूरा प्लेसमेंट दिया जाता है।'],
  ],
  place: [
    'पुर्तगाली नियोक्ता के साथ {years} साल का रोज़गार अनुबंध',
    'मासिक वेतन',
    'आवास',
    'भोजन',
    'पूरी वीज़ा प्रक्रिया में क़ानूनी सहायता',
    'आगमन के बाद निवास परमिट और काग़ज़ात',
  ],
  sectors: [
    'शेफ़',
    'फ़ूड एंड बेवरेज सेवा',
    'सफ़ाईकर्मी',
    'प्रॉपर्टी मैनेजमेंट',
    'ड्राइवर',
    'लॉजिस्टिक्स',
    'निर्माण कर्मी',
    'इलेक्ट्रिशियन',
    'प्लंबर',
    'वेल्डर',
    'डेटा एनालिस्ट',
    'QA टेस्टर',
  ],

  footerTerms: 'नियम',
  footerRefund: 'रिफ़ंड',
  footerDelivery: 'सेवा वितरण',
  footerPrivacy: 'गोपनीयता',
  footerContact: 'संपर्क',
  footerLegal: '© 2026 S&A Recruitment, a Smith & Adams company · लिस्बन · नई दिल्ली',

  signup: {
    help: 'मदद चाहिए? WhatsApp +91 80 0000 0000',
    stepAccount: 'खाता',
    stepProfile: 'प्रोफ़ाइल',
    stepPayment: 'भुगतान',
    title0: 'अपना खाता बनाएँ',
    title1: 'आपका कार्य प्रोफ़ाइल',
    title2: 'मूल्यांकन शुल्क का भुगतान करें',
    fullName: 'पूरा नाम',
    fullNameHint: 'पासपोर्ट के अनुसार',
    mobile: 'मोबाइल नंबर',
    email: 'ईमेल',
    passportQ: 'क्या आपके पास वैध पासपोर्ट है?',
    passportYes: 'हाँ',
    passportNo: 'अभी नहीं',
    mainSector: 'मुख्य क्षेत्र',
    years: 'इस क्षेत्र में अनुभव के वर्ष',
    yearOptions: ['1 साल से कम', '1–3 साल', '3–5 साल', '5+ साल'],
    englishSelf: 'आप अपनी बोली जाने वाली अंग्रेज़ी को कैसे आँकेंगे?',
    englishOptions: ['बुनियादी', 'बातचीत योग्य', 'प्रवाही'],
    cityState: 'शहर और राज्य',
    consent:
      'मैं समझता/समझती हूँ कि यह शुल्क मेरे मूल्यांकन, स्किल्स रिपोर्ट और टैलेंट पूल प्रोफ़ाइल के लिए है। पुर्तगाल प्लेसमेंट के लिए चयन हर कोहॉर्ट में लगभग 1 उम्मीदवार तक सीमित है और इसकी गारंटी नहीं है। मैंने',
    consentRules: 'चयन नियम',
    consentRefund: 'रिफ़ंड नीति',
    back: 'पीछे',
    continue: 'आगे बढ़ें',
    pay: '₹1,999 का भुगतान करें',
    successTitle: 'आप कोहॉर्ट 01 के लिए रजिस्टर हो गए हैं',
    successBody:
      'भुगतान मिल गया। रसीद {receipt} आपके ईमेल और WhatsApp पर भेज दी गई है। आप अभी मूल्यांकन शुरू कर सकते हैं या 14 दिनों के भीतर वापस आ सकते हैं।',
    successCta: 'मूल्यांकन शुरू करें',
    summaryTitle: 'ऑर्डर सारांश',
    summaryItem: 'कोहॉर्ट 01 मूल्यांकन',
    summaryIncludes: [
      'कौशल, अनुभव और अंग्रेज़ी का मूल्यांकन',
      'व्यक्तिगत स्किल्स रिपोर्ट',
      'सत्यापित टैलेंट पूल प्रोफ़ाइल, 12 महीने',
    ],
    summaryEarly: 'जल्दी रजिस्ट्रेशन',
    summaryGst: 'जीएसटी 18%',
    summaryTotal: 'कुल',
    summaryNote:
      'जल्दी रजिस्ट्रेशन बंद होने पर कीमत ₹2,499 हो जाएगी। मूल्यांकन शुरू करने से पहले रद्द करने पर पूरा रिफ़ंड मिलता है।',
    errRequired: 'यह फ़ील्ड आवश्यक है।',
    errMobile: '6, 7, 8 या 9 से शुरू होने वाला 10 अंकों का भारतीय मोबाइल नंबर डालें।',
    errEmail: 'मान्य ईमेल पता डालें।',
    errConsent: 'कृपया पुष्टि करें कि आपने चयन नियम पढ़ लिए हैं।',
    errPassword: 'कम से कम 8 अक्षर इस्तेमाल करें।',
    errAccountExists: 'इस पते से आपका खाता पहले से है। कृपया साइन इन करें।',
    errPhoneTaken: 'यह मोबाइल नंबर इस कोहोर्ट में पहले से पंजीकृत है।',
    errGeneric: 'कुछ गड़बड़ हो गई। कृपया दोबारा कोशिश करें।',
    passwordLabel: 'पासवर्ड बनाएं',
    passwordHint: 'कम से कम 8 अक्षर। दोबारा साइन इन करने के लिए इसी का उपयोग करेंगे।',
    payFailed: 'हम भुगतान शुरू नहीं कर सके। कृपया दोबारा कोशिश करें।',
  },

  assess: {
    header: 'मूल्यांकन · कोहॉर्ट 01',
    sectionCounter: 'खंड {n} / {total}',
    sections: [
      ['कौशल', '20 प्रश्न'],
      ['अनुभव', '8 प्रश्न'],
      ['अंग्रेज़ी', 'पठन, व्याकरण, बोलना'],
      ['प्रोफ़ाइल', '5 प्रश्न'],
    ],
    questionCounter: 'प्रश्न {n} / {total}',
    previous: 'पिछला',
    next: 'अगला',
    finish: 'खंड पूरा करें',
    autosave: 'आपके उत्तर स्वतः सहेजे जाते हैं। कनेक्शन टूटने पर आप इसी प्रश्न से जारी रख सकते हैं।',
    saving: 'सहेजा जा रहा है…',
    saved: 'सहेजा गया',
  },

  dash: {
    navOverview: 'अवलोकन',
    verifyTitle: 'अपना ईमेल पता सत्यापित करें',
    verifyBody:
      'आपकी रिपोर्ट {email} पर भेजी जाती है, इसलिए हमें यह पक्का करना है कि वह आप तक पहुँचती है। हमने जो ईमेल भेजा है उसमें दिए लिंक को खोलें। तब तक बाकी सब यहाँ काम करता रहेगा।',
    verifyCta: 'लिंक दोबारा भेजें',
    verifySent: 'भेज दिया गया। {email} देखें, स्पैम फ़ोल्डर भी।',
    verifyRateLimited: 'बहुत अधिक अनुरोध। एक घंटे बाद दोबारा कोशिश करें।',
    verifyFailed: 'हम इसे भेज नहीं सके। कृपया थोड़ी देर बाद कोशिश करें।',
    navReport: 'रिपोर्ट',
    navProfile: 'प्रोफ़ाइल',
    greeting: 'नमस्ते, {name}',
    title: 'आपकी रिपोर्ट तैयार है',
    pending: 'आपकी रिपोर्ट अभी तैयार नहीं है',
    pendingNote:
      'मूल्यांकन पूरा करने के बाद, आपकी स्किल्स रिपोर्ट और टैलेंट पूल प्रोफ़ाइल 7 दिनों के भीतर तैयार हो जाती है। तैयार होने पर हम आपको संदेश भेजेंगे।',
    download: 'रिपोर्ट डाउनलोड करें (PDF)',
    overall: 'कुल स्कोर',
    overallNote: 'कोहॉर्ट 01 के शीर्ष {percentile}%',
    englishLabel: 'अंग्रेज़ी (CEFR)',
    englishNote: 'स्वतंत्र प्रयोगकर्ता',
    skillsLabel: '{sector} कौशल',
    skillsNote: 'मज़बूत',
    expLabel: 'अनुभव',
    expNote: '{years} साल, सत्यापित',
    cohortStatus: 'कोहॉर्ट स्थिति',
    breakdown: 'रिपोर्ट विवरण',
    timeline: [
      'रजिस्टर और भुगतान हुआ',
      'मूल्यांकन पूरा हुआ',
      'स्किल्स रिपोर्ट तैयार',
      'कोहॉर्ट 01 समीक्षा',
      'चयन की घोषणा',
    ],
    visible: 'नियोक्ताओं को दिखाई दे',
    visibleNote: 'पुर्तगाल और यूरोप के जाँचे-परखे नियोक्ता आपकी प्रोफ़ाइल देख सकते हैं।',
  },

  process: {
    title: 'यह कैसे काम करता है',
    lead: 'छह चरण, और हर चरण पर आपको पता रहता है कि आप कहाँ हैं।',
    steps: [
      ['रजिस्टर करें', 'अपने नाम, मोबाइल और ईमेल से खाता बनाएँ। दो मिनट लगते हैं।'],
      ['CV और दस्तावेज़ अपलोड करें', 'शुरू करने के लिए एक CV और एक फ़ोटो काफ़ी है। पासपोर्ट और अन्य दस्तावेज़ जोड़ने से हम जल्दी बता पाते हैं कि आपकी फ़ाइल वीज़ा के लिए तैयार है या नहीं।'],
      ['पहला मूल्यांकन दें', 'आपके कौशल, अनुभव और अंग्रेज़ी का ऑनलाइन मूल्यांकन। 60 से 90 मिनट, फ़ोन या कंप्यूटर से, आपकी सुविधा के समय।'],
      ['मूल्यांकन शुल्क भरें', 'एक बार भुगतान, और वह भी मूल्यांकन देखने के बाद।'],
      ['मूल्यांकन कॉल', 'शॉर्टलिस्ट होने पर हमारा रिक्रूटर आपको कॉल करता है। यह औपचारिकता नहीं, काम के बारे में असली बातचीत है।'],
      ['पुष्टि पत्र', 'चुने जाने पर आपको हस्ताक्षर के लिए पुष्टि पत्र मिलता है, और हम आपके साथ वीज़ा प्रक्रिया शुरू करते हैं।'],
    ],
    responseNote: 'आवेदन पूरा करने के {days} दिनों के भीतर आपको उत्तर मिलता है। अंतहीन क़तार नहीं: उत्तर।',
  },

  offer: {
    title: 'चुने गए उम्मीदवार को क्या मिलता है',
    lead: 'पहुँचने और काम शुरू करने के लिए सब कुछ, यात्रा से पहले ही तय।',
    items: [
      ['रोज़गार अनुबंध', 'पुर्तगाली नियोक्ता के साथ {years} साल का अनुबंध, आपके जाने से पहले हस्ताक्षरित।'],
      ['आवास', 'पहुँचने पर तैयार आवास।'],
      ['भोजन', 'प्लेसमेंट का हिस्सा।'],
      ['क़ानूनी सहायता', 'वीज़ा, निवास परमिट और पहुँचने के बाद के काग़ज़ात, पूरे रास्ते आपके साथ।'],
    ],
  },

  documents: {
    title: 'क्या भेजें',
    lead: 'शुरू करने के लिए एक CV और एक फ़ोटो काफ़ी है। बाक़ी सब हमें तेज़ी से आगे बढ़ने में मदद करता है और कुछ भी अनिवार्य नहीं है।',
    required: 'आवश्यक',
    optional: 'तेज़ी लाने में मदद करता है',
    items: [
      ['CV', 'किसी भी रूप में। अगर आपके पास नहीं है, तो प्रोफ़ाइल भरें और हम आपके साथ मिलकर बनाएँगे।'],
      ['फ़ोटो', 'आपके चेहरे की साफ़, हाल की तस्वीर।'],
      ['पासपोर्ट', 'फ़ोटो वाला पृष्ठ। अगर अभी आवेदन नहीं किया, तो बताएँ और हम कहेंगे कब शुरू करना है।'],
      ['योग्यताएँ', 'प्रमाणपत्र, ट्रेड कार्ड, प्रशिक्षण रिकॉर्ड।'],
      ['कार्य संदर्भ', 'रोज़गार पत्र, अनुबंध या वेतन पर्चियाँ।'],
      ['पुलिस क्लीयरेंस', 'वीज़ा के लिए बाद में ज़रूरी। पहले से होना उपयोगी है।'],
    ],
    optionalNote: 'दस्तावेज़ भेजना वैकल्पिक है और इससे आपका मूल्यांकन स्कोर नहीं बदलता। इससे यह बदलता है कि हम कितनी जल्दी बता पाते हैं कि आपकी फ़ाइल वीज़ा आवेदन के लिए तैयार है।',
  },

  auth: {
    title: 'साइन इन',
    lead: 'वही ईमेल पता डालें जिससे आपने रजिस्टर किया था। हम आपको 6 अंकों का कोड भेजेंगे।',
    emailLabel: 'ईमेल',
    sendCode: 'कोड भेजें',
    codeSent: 'हमने {email} पर 6 अंकों का कोड भेजा है। यह 10 मिनट में समाप्त हो जाएगा।',
    codeLabel: '6 अंकों का कोड',
    verify: 'साइन इन करें',
    resend: 'दूसरा कोड भेजें',
    signOut: 'साइन आउट',
    notRegistered: 'अभी तक रजिस्टर नहीं किया?',
    registerCta: 'मूल्यांकन शुरू करें',
    errEmail: 'मान्य ईमेल पता डालें।',
    errCode: 'यह कोड सही नहीं है, या इसकी अवधि समाप्त हो गई है।',
    errGeneric: 'कुछ गड़बड़ हो गई। कृपया दोबारा कोशिश करें।',
    phoneSoon: 'WhatsApp या SMS से साइन इन जल्द आ रहा है। फ़िलहाल वही ईमेल पता इस्तेमाल करें जिससे रजिस्टर किया था।',
    passwordLabel: 'पासवर्ड',
    signInWithPassword: 'साइन इन करें',
    useCodeInstead: 'इसके बजाय मुझे कोड भेजें',
    usePasswordInstead: 'इसके बजाय पासवर्ड इस्तेमाल करें',
    errCredentials: 'ये विवरण सही नहीं हैं।',
    errRateLimited: 'बहुत ज़्यादा बार कोड माँगा गया। कृपया कुछ मिनट रुककर दोबारा कोशिश करें।',
    staffNote: 'उम्मीदवार: कोड इस्तेमाल करें। नियोक्ता और स्टाफ़: अपना पासवर्ड इस्तेमाल करें।',
  },

  profile: {
    navProfile: 'प्रोफ़ाइल',
    title: 'आपकी प्रोफ़ाइल',
    lead: 'अपना CV अपलोड करें और हम उसे पढ़कर भर देंगे, या आप खुद भर सकते हैं। दोनों हालात में नियोक्ता यही देखते हैं।',
    cvTitle: 'आपका CV',
    cvLead: 'PDF सबसे अच्छा काम करता है। हम उसे पढ़कर आपका अनुभव भरते हैं, और कोई फ़ैसला होने से पहले एक व्यक्ति उसे जाँचता है।',
    cvChoose: 'फ़ाइल चुनें',
    cvReplace: 'CV बदलें',
    cvUploading: 'अपलोड हो रहा है…',
    cvDone: 'अपलोड हो गया',
    cvError: 'अपलोड नहीं हो पाया। कृपया दोबारा कोशिश करें।',
    cvHint: 'PDF, अधिकतम 10 MB',
    orManual: 'या खुद भरें',
    aboutTitle: 'आपके बारे में',
    headline: 'शीर्षक',
    headlinePlaceholder: 'हाउसकीपिंग सुपरवाइज़र, 6 साल',
    summary: 'संक्षिप्त विवरण',
    linkedin: 'LinkedIn (वैकल्पिक)',
    experienceTitle: 'कार्य अनुभव',
    addExperience: 'नौकरी जोड़ें',
    employer: 'नियोक्ता',
    jobTitle: 'पद',
    jobLocation: 'शहर और देश',
    from: 'से',
    to: 'तक',
    current: 'मैं अभी यहीं काम करता/करती हूँ',
    duties: 'आपने क्या किया',
    educationTitle: 'शिक्षा और प्रशिक्षण',
    addEducation: 'शिक्षा जोड़ें',
    institution: 'स्कूल या संस्थान',
    qualification: 'योग्यता',
    field: 'विषय',
    startYear: 'शुरू का साल',
    endYear: 'आख़िरी साल',
    skillsTitle: 'कौशल',
    skillsHint: 'अल्पविराम से अलग करें',
    languagesTitle: 'भाषाएँ',
    language: 'भाषा',
    level: 'स्तर',
    addLanguage: 'भाषा जोड़ें',
    readyTitle: 'उपलब्धता',
    availability: 'आप विदेश में कितनी जल्दी शुरू कर सकते हैं?',
    availabilityOptions: ['1 महीने के भीतर', '1 से 3 महीने', '3 से 6 महीने', '6 महीने से ज़्यादा'],
    relocation: 'क्या आप पुर्तगाल जाने के लिए तैयार हैं?',
    relocationYes: 'हाँ',
    relocationNo: 'अभी नहीं',
    remove: 'हटाएँ',
    save: 'प्रोफ़ाइल सहेजें',
    saving: 'सहेजा जा रहा है…',
    saved: 'सहेजा गया',
    saveError: 'हम इसे सहेज नहीं सके। कृपया दोबारा कोशिश करें।',
  },

  status: {
    title: 'आप कहाँ हैं',
    registered: 'रजिस्टर और भुगतान हुआ',
    profile: 'प्रोफ़ाइल और CV',
    assessment: 'मूल्यांकन',
    report: 'स्किल्स रिपोर्ट',
    selection: 'कोहॉर्ट चयन',
    done: 'पूरा',
    current: 'अभी',
    todo: 'आगे',
    sectionsProgress: '{total} में से {done} खंड',
    continueAssessment: 'मूल्यांकन जारी रखें',
    startAssessment: 'मूल्यांकन शुरू करें',
    completeProfile: 'अपनी प्रोफ़ाइल पूरी करें',
  },

  pricing: {
    title: 'मूल्य',
    lead: 'उम्मीदवारों के लिए एक शुल्क। नियोक्ता केवल नियुक्ति पर भुगतान करते हैं।',
    startCta: 'मूल्यांकन शुरू करें',
    candidates: 'उम्मीदवार',
    candidatesPeriod: 'एक बार',
    candidatesNote: 'जल्दी रजिस्ट्रेशन। बाद में ₹2,499। लगभग €20–€25।',
    candidatesFeatures: [
      'पूरा मूल्यांकन',
      'स्किल्स रिपोर्ट',
      'टैलेंट पूल प्रोफ़ाइल, 12 महीने',
      'कोहॉर्ट 01 प्लेसमेंट के लिए विचार',
    ],
    employers: 'नियोक्ता · प्रति नियुक्ति',
    employersPeriod: 'प्रति प्लेसमेंट',
    employersNote: 'खोज मुफ़्त है। उम्मीदवार के काम शुरू करने पर भुगतान करें।',
    employersFeatures: ['टैलेंट पूल खोज', 'स्किल्स रिपोर्ट', 'वीज़ा और रिलोकेशन संभाला जाता है', '90 दिन का प्रतिस्थापन'],
    partner: 'नियोक्ता · पार्टनर',
    partnerPrice: 'कस्टम',
    partnerNote: 'साल में 10+ नियुक्तियों के लिए, कई साइटों पर।',
    partnerFeatures: [
      'प्रति नियुक्ति की हर सुविधा',
      'समर्पित रिक्रूटर',
      'आगमन से पहले प्रशिक्षण',
      'आवास समन्वय',
    ],
    bookCall: 'कॉल बुक करें',
    contactSales: 'सेल्स से संपर्क करें',
    questions: 'सवाल',
    faq: [
      [
        'मूल्यांकन शुल्क किस चीज़ के लिए है?',
        'आपके कौशल, कार्य अनुभव और अंग्रेज़ी का पूरा मूल्यांकन, आपकी व्यक्तिगत स्किल्स रिपोर्ट, और {days} दिनों के भीतर निर्णय। भुगतान एक बार, और वह भी मूल्यांकन देखने के बाद।',
      ],
      [
        'भुगतान के बाद क्या होता है?',
        'आप मूल्यांकन पूरा करते हैं। शॉर्टलिस्ट होने पर हमारा रिक्रूटर आपको काम के बारे में असली बातचीत के लिए कॉल करता है। चुने जाने पर आपको हस्ताक्षर के लिए पुष्टि पत्र मिलता है और हम आपके साथ वीज़ा प्रक्रिया शुरू करते हैं।',
      ],
      [
        'उत्तर कब तक मिलेगा?',
        'आवेदन पूरा करने के {days} दिनों के भीतर। उत्तर हाँ हो या ना, आपको मिलता है। आपको क़तार में नहीं छोड़ा जाता।',
      ],
      [
        'क्या चयन की गारंटी है?',
        'नहीं। फ़ीस मूल्यांकन और रिपोर्ट के लिए है, प्लेसमेंट के लिए नहीं। न चुने जाने पर भी रिपोर्ट आपकी रहती है और हम आपको कारण बताते हैं।',
      ],
      [
        'क्या दस्तावेज़ भेजना ज़रूरी है?',
        'नहीं। शुरू करने के लिए एक CV और एक फ़ोटो काफ़ी है। पासपोर्ट और अन्य दस्तावेज़ भेजने से आपका मूल्यांकन स्कोर नहीं बदलता; इससे हम जल्दी बता पाते हैं कि आपकी फ़ाइल वीज़ा आवेदन शुरू करने के लिए तैयार है या नहीं।',
      ],
      [
        'प्लेसमेंट में क्या शामिल है?',
        'पुर्तगाली नियोक्ता के साथ {years} साल का रोज़गार अनुबंध, मासिक वेतन, आवास, भोजन, और वीज़ा प्रक्रिया तथा पहुँचने के बाद के काग़ज़ात में क़ानूनी सहायता।',
      ],
      [
        'क्या मुझे रिफ़ंड मिल सकता है?',
        'मूल्यांकन शुरू करने से पहले रद्द करने पर पूरा रिफ़ंड मिलता है। शुरू करने के बाद फ़ीस वापस नहीं होती, क्योंकि मूल्यांकन और रिपोर्ट दी जा रही होती है।',
      ],
      [
        'क्या S&A Recruitment एक लाइसेंस प्राप्त भर्ती एजेंसी है?',
        'आवेदन खुलने से पहले भारत और पुर्तगाल के रजिस्ट्रेशन विवरण यहाँ सूचीबद्ध किए जाएँगे।',
      ],
    ],
  },
};

export const dictionaries: Record<Locale, Dictionary> = { en, hi };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Sector labels in English, used as the canonical value stored in the database. */
export const canonicalSectors = en.sectors;

/** Fills `{token}` placeholders. Keeps interpolation out of the components. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
