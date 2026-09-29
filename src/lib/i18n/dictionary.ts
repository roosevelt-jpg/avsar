/**
 * Avsar copy dictionary.
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
  ctaTitle: string;

  includes: readonly Pair[];
  steps: readonly Pair[];
  place: readonly string[];
  sectors: readonly string[];

  /* Footer */
  footerRefund: string;
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
    staffNote: string;
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

  eyebrow: 'Cohort 01 · India → Portugal · Applications open',
  heroTitle: 'Prove your skills. Get seen by employers in Europe.',
  heroSub:
    'A professional assessment of your skills, experience and English. You get a detailed skills report and a verified profile in our talent pool. The top candidate in each cohort is selected for a fully supported job in Portugal.',
  askWork: 'What kind of work do you do?',
  cta: 'Start assessment · ₹1,999',
  fine: 'Includes your skills report and a verified talent-pool profile. Selection for Portugal is an extra opportunity for top performers and is not guaranteed.',
  heroMeta: '₹1,999 · 60–90 min · online',

  includesTitle: 'What your fee includes',
  howTitle: 'How it works',
  placeTitle: 'The Portugal placement',
  sectorsTitle: 'Sectors we hire for',
  placeEyebrow: 'FOR THE SELECTED CANDIDATE',
  placeFine: 'About 1 candidate is selected per cohort of ~20,000.',
  selectionRules: 'Selection rules',
  ctaTitle: 'Cohort 01 closes on 30 November.',

  includes: [
    ['Professional assessment', 'Online test of 60–90 minutes covering your skills, work experience and English.'],
    ['Skills report', 'A scored breakdown of your strengths and gaps. It is yours to keep and share.'],
    ['Talent-pool profile', 'A verified profile that vetted employers in Portugal and Europe can find.'],
  ],
  steps: [
    ['Register and pay', 'Create your account and pay the ₹1,999 assessment fee by UPI or card.'],
    ['Take the assessment', 'Complete it online from your phone or computer, at a time that suits you.'],
    ['Get your report', 'Your skills report and profile are ready within 7 days.'],
    ['Selection', 'The top candidate in each cohort is offered a full placement in Portugal.'],
  ],
  place: [
    'Job contract with a partner employer',
    'Monthly salary',
    'Housing',
    'Meals',
    'Visa and immigration support',
    'Arrival and integration support',
  ],
  sectors: ['Hospitality', 'Property management', 'Cleaning', 'Drivers', 'Maintenance', 'Construction'],

  footerRefund: 'Refund policy',
  footerPrivacy: 'Privacy',
  footerContact: 'Contact',
  footerLegal: '© 2026 Avsar · Lisbon · New Delhi',

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
    staffNote: 'Candidates: use a code. Employers and staff: use your password.',
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
        'What does the ₹1,999 fee pay for?',
        'Your full assessment (skills, experience and English), your personal skills report, and a verified profile in the talent pool for 12 months. These are delivered to every candidate who completes the assessment.',
      ],
      [
        'How many candidates are selected for Portugal?',
        'About 1 candidate per cohort of roughly 20,000. Selection goes to the highest overall score after interview and document checks. Most candidates will not be selected, so please only register if the report and profile are useful to you on their own.',
      ],
      [
        'What does the Portugal placement include?',
        'A job contract with one of our companies or partners, a monthly salary, housing, meals, visa and immigration support, and help settling in after arrival.',
      ],
      [
        'Can employers contact me if I am not selected?',
        'Yes. If your profile is visible, vetted employers can find you and invite you to interview. You can hide your profile at any time from your dashboard.',
      ],
      [
        'Can I get a refund?',
        'You get a full refund if you cancel before starting the assessment. After you start, the fee is not refundable because the assessment and report are being delivered.',
      ],
      ['Is Avsar a licensed recruitment agency?', 'Registration details for India and Portugal will be listed here.'],
    ],
  },
};

const hi: Dictionary = {
  navHow: 'यह कैसे काम करता है',
  navSectors: 'क्षेत्र',
  navPricing: 'मूल्य',
  navEmployers: 'नियोक्ताओं के लिए',
  signIn: 'साइन इन',

  eyebrow: 'कोहॉर्ट 01 · भारत → पुर्तगाल · आवेदन खुले हैं',
  heroTitle: 'अपना हुनर साबित करें। यूरोप के नियोक्ताओं की नज़र में आएँ।',
  heroSub:
    'आपके कौशल, अनुभव और अंग्रेज़ी का पेशेवर मूल्यांकन। आपको एक विस्तृत स्किल्स रिपोर्ट और हमारे टैलेंट पूल में सत्यापित प्रोफ़ाइल मिलती है। हर कोहॉर्ट के सर्वश्रेष्ठ उम्मीदवार को पुर्तगाल में पूरी सहायता के साथ नौकरी के लिए चुना जाता है।',
  askWork: 'आप किस तरह का काम करते हैं?',
  cta: 'मूल्यांकन शुरू करें · ₹1,999',
  fine: 'इसमें आपकी स्किल्स रिपोर्ट और टैलेंट पूल में सत्यापित प्रोफ़ाइल शामिल है। पुर्तगाल के लिए चयन सर्वश्रेष्ठ उम्मीदवारों के लिए एक अतिरिक्त अवसर है और इसकी गारंटी नहीं है।',
  heroMeta: '₹1,999 · 60–90 मिनट · ऑनलाइन',

  includesTitle: 'आपकी फ़ीस में क्या शामिल है',
  howTitle: 'यह कैसे काम करता है',
  placeTitle: 'पुर्तगाल प्लेसमेंट',
  sectorsTitle: 'जिन क्षेत्रों में हम भर्ती करते हैं',
  placeEyebrow: 'चुने गए उम्मीदवार के लिए',
  placeFine: 'लगभग 20,000 उम्मीदवारों के हर कोहॉर्ट में से 1 उम्मीदवार चुना जाता है।',
  selectionRules: 'चयन नियम',
  ctaTitle: 'कोहॉर्ट 01 के आवेदन 30 नवंबर को बंद होंगे।',

  includes: [
    ['पेशेवर मूल्यांकन', '60–90 मिनट की ऑनलाइन परीक्षा, जिसमें आपके कौशल, कार्य अनुभव और अंग्रेज़ी की जाँच होती है।'],
    ['स्किल्स रिपोर्ट', 'आपकी ताक़त और कमियों का अंकों सहित विवरण। यह आपकी है, आप इसे रख और साझा कर सकते हैं।'],
    ['टैलेंट पूल प्रोफ़ाइल', 'एक सत्यापित प्रोफ़ाइल, जिसे पुर्तगाल और यूरोप के जाँचे-परखे नियोक्ता देख सकते हैं।'],
  ],
  steps: [
    ['रजिस्टर करें और भुगतान करें', 'अपना खाता बनाएँ और UPI या कार्ड से ₹1,999 मूल्यांकन शुल्क चुकाएँ।'],
    ['मूल्यांकन दें', 'इसे अपने फ़ोन या कंप्यूटर से, अपनी सुविधा के समय ऑनलाइन पूरा करें।'],
    ['अपनी रिपोर्ट पाएँ', 'आपकी स्किल्स रिपोर्ट और प्रोफ़ाइल 7 दिनों के भीतर तैयार हो जाती है।'],
    ['चयन', 'हर कोहॉर्ट के सर्वश्रेष्ठ उम्मीदवार को पुर्तगाल में पूरा प्लेसमेंट दिया जाता है।'],
  ],
  place: [
    'पार्टनर नियोक्ता के साथ नौकरी का अनुबंध',
    'मासिक वेतन',
    'आवास',
    'भोजन',
    'वीज़ा और इमिग्रेशन सहायता',
    'आगमन और एकीकरण सहायता',
  ],
  sectors: ['आतिथ्य', 'प्रॉपर्टी मैनेजमेंट', 'सफ़ाई', 'ड्राइवर', 'रखरखाव', 'निर्माण'],

  footerRefund: 'रिफ़ंड नीति',
  footerPrivacy: 'गोपनीयता',
  footerContact: 'संपर्क',
  footerLegal: '© 2026 Avsar · लिस्बन · नई दिल्ली',

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
    staffNote: 'उम्मीदवार: कोड इस्तेमाल करें। नियोक्ता और स्टाफ़: अपना पासवर्ड इस्तेमाल करें।',
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
        '₹1,999 की फ़ीस किस चीज़ के लिए है?',
        'आपका पूरा मूल्यांकन (कौशल, अनुभव और अंग्रेज़ी), आपकी व्यक्तिगत स्किल्स रिपोर्ट, और 12 महीने के लिए टैलेंट पूल में सत्यापित प्रोफ़ाइल। ये हर उस उम्मीदवार को मिलते हैं जो मूल्यांकन पूरा करता है।',
      ],
      [
        'पुर्तगाल के लिए कितने उम्मीदवार चुने जाते हैं?',
        'लगभग 20,000 के हर कोहॉर्ट में से लगभग 1 उम्मीदवार। चयन साक्षात्कार और दस्तावेज़ जाँच के बाद सबसे ऊँचे कुल स्कोर के आधार पर होता है। ज़्यादातर उम्मीदवार नहीं चुने जाएँगे, इसलिए कृपया तभी रजिस्टर करें जब रिपोर्ट और प्रोफ़ाइल अपने आप में आपके लिए उपयोगी हों।',
      ],
      [
        'पुर्तगाल प्लेसमेंट में क्या शामिल है?',
        'हमारी कंपनियों या पार्टनरों में से एक के साथ नौकरी का अनुबंध, मासिक वेतन, आवास, भोजन, वीज़ा और इमिग्रेशन सहायता, और पहुँचने के बाद बसने में मदद।',
      ],
      [
        'अगर मैं नहीं चुना जाता तो क्या नियोक्ता मुझसे संपर्क कर सकते हैं?',
        'हाँ। अगर आपकी प्रोफ़ाइल दिखाई दे रही है, तो जाँचे-परखे नियोक्ता आपको ढूँढ सकते हैं और साक्षात्कार के लिए बुला सकते हैं। आप अपने डैशबोर्ड से कभी भी प्रोफ़ाइल छिपा सकते हैं।',
      ],
      [
        'क्या मुझे रिफ़ंड मिल सकता है?',
        'मूल्यांकन शुरू करने से पहले रद्द करने पर आपको पूरा रिफ़ंड मिलता है। शुरू करने के बाद फ़ीस वापस नहीं होती, क्योंकि मूल्यांकन और रिपोर्ट दी जा रही होती है।',
      ],
      ['क्या Avsar एक लाइसेंस प्राप्त भर्ती एजेंसी है?', 'भारत और पुर्तगाल के लिए रजिस्ट्रेशन विवरण यहाँ सूचीबद्ध किए जाएँगे।'],
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
