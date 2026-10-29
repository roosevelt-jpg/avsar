import {
  DEFAULT_COHORT,
  DEFAULT_COMPANY,
  DEFAULT_HIRING,
  DEFAULT_PRICING,
  type CohortSettings,
  type CompanySettings,
  type HiringSettings,
  type PricingSettings,
} from '@/lib/company/config';
import { DEFAULT_EMAILS, type EmailSettings } from '@/lib/email/templates';
import { isLocale, localePath, type Locale } from '@/lib/i18n/path';

/**
 * Site settings: the public, editable configuration of the site.
 *
 * Defaults live here and are what the site uses until an admin saves a value,
 * so a fresh deployment is complete rather than blank. Stored values are merged
 * over the defaults key by key, so adding a setting in code never needs a data
 * migration.
 *
 * NEVER put a secret in settings. The table is readable by anyone.
 *
 * The company, pricing, hiring and cohort sections hold the legal entity and
 * the price, which have to match the payment provider's merchant record, so
 * the API lets only `company.manage` (super admins) change them.
 */

export type NavItem = {
  label: string;
  /** Kept so a saved Hindi or Arabic label from the console still wins. */
  labelHi?: string;
  labelAr?: string;
  /** Other languages, keyed by locale. Missing keys fall back to English. */
  labels?: Partial<Record<Locale, string>>;
  href: string;
};

/**
 * Pages built in code rather than from blocks, so their search and share text
 * is edited here. CMS pages have the same fields in the page editor.
 */
export const STATIC_SEO_PAGES = [
  { key: 'employers', label: 'Employers', path: '/employers' },
  { key: 'pricing', label: 'Pricing', path: '/pricing' },
  { key: 'signup', label: 'Register', path: '/signup' },
  { key: 'signin', label: 'Sign in', path: '/signin' },
  { key: 'assessment', label: 'Assessment', path: '/assessment' },
  { key: 'go', label: 'VSL funnel', path: '/go' },
] as const;
export type StaticSeoPage = (typeof STATIC_SEO_PAGES)[number]['key'];
export type PageSeoSettings = { title: string; description: string; ogTitle: string; ogImage: string };

export type SiteSettings = {
  general: {
    siteName: string;
    tagline: string;
    supportPhone: string;
    whatsapp: string;
    supportEmail: string;
    officeAddress: string;
    officeHours: string;
    /** https URL of a short recording for the family page and the pay panel. Empty until a real person records it. */
    familyVoiceUrl: string;
    socials: { instagram: string; facebook: string; linkedin: string; youtube: string };
  };
  announcement: { enabled: boolean; text: string; linkLabel: string; href: string };
  navigation: { items: NavItem[]; headerCta: { label: string; href: string; labels?: Partial<Record<Locale, string>> } };
  footer: { blurb: string };
  applications: {
    /** When true, a candidate must have paid for the assessment before applying. Off by default: applying should be free and fast. */
    requirePaidAssessment: boolean;
    /** Show the one-step "create account and apply" form on job pages. */
    allowQuickApply: boolean;
    /**
     * The explainer film offered beside the apply form and on the sign-up
     * page, where people decide. A YouTube link or an uploaded film; empty
     * hides the button.
     */
    filmUrl: string;
    filmLabel: string;
  };
  seo: { defaultTitle: string; defaultDescription: string; ogImage: string; pages: Record<StaticSeoPage, PageSeoSettings> };
  company: CompanySettings;
  pricing: PricingSettings;
  hiring: HiringSettings;
  cohort: CohortSettings;
  emails: EmailSettings;
  /**
   * Conversion copy: trust lines, package deliverables, post-assessment offer,
   * sticky CTA and pricing features. Price and odds stay under company/hiring;
   * this section is the wording beside them.
   */
  conversion: ConversionSettings;
  /** Copy on /employers. The placement fee stays under Company & pricing. */
  employerLanding: EmployerLanding;
  /**
   * Paid-traffic VSL funnel at /[locale]/go: video, headline and CTAs that
   * send the visitor to sign-up. Video falls back to Applications film, then
   * /video/intro.mp4, so the page never ships blank.
   */
  vsl: VslSettings;
};

export type VslSettings = {
  eyebrow: string;
  headline: string;
  subhead: string;
  /** YouTube or uploaded MP4. Empty uses Applications film, then intro.mp4. */
  videoUrl: string;
  videoPoster: string;
  videoTitle: string;
  highlights: string[];
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  stickyCtaLabel: string;
};

export type ConversionDeliverable = { title: string; timing: string };

export type ConversionSettings = {
  trustLines: string[];
  deliverables: ConversionDeliverable[];
  offerHeading: string;
  offerBody: string;
  offerPrimaryLabel: string;
  offerSecondaryLabel: string;
  stickyCtaLabel: string;
  pricingLead: string;
  pricingFeatures: string[];
  pricingTitle: string;
  pricingQuestions: string;
  pricingStartCta: string;
  candidateEyebrow: string;
  candidatePeriod: string;
  employerEyebrow: string;
  employerPeriod: string;
  employerNote: string;
  employerFeatures: string[];
  partnerEyebrow: string;
  partnerPrice: string;
  partnerNote: string;
  partnerFeatures: string[];
  bookCall: string;
  contactSales: string;
  reportsHeading: string;
  storiesEyebrow: string;
  storiesTitle: string;
  storiesIntro: string;
  pricingFaq: { question: string; answer: string }[];
  /** Soft package line on role-matched job alerts for unpaid candidates. */
  mentionPackageInJobAlerts: boolean;
};

/** The /employers page. The fee in contactNote is {{fee}}, filled from Company & pricing. */
export type EmployerLanding = {
  wordmarkSuffix: string;
  navTalent: string;
  navHow: string;
  navPricing: string;
  navCandidates: string;
  ctaLabel: string;
  headline: string;
  intro: string;
  stepsTitle: string;
  steps: { title: string; body: string }[];
  contactTitle: string;
  contactNote: string;
};

export const SETTINGS_KEYS = [
  'general',
  'announcement',
  'navigation',
  'footer',
  'applications',
  'seo',
  'company',
  'pricing',
  'hiring',
  'cohort',
  'emails',
  'conversion',
  'employerLanding',
  'vsl',
] as const;

/** Sections that change the legal entity, the price or the selection rule. */
export const COMPANY_KEYS = ['company', 'pricing', 'hiring', 'cohort'] as const;
export type SettingsKey = (typeof SETTINGS_KEYS)[number];

export const DEFAULT_SETTINGS: SiteSettings = {
  general: {
    siteName: DEFAULT_COMPANY.tradingAs,
    tagline: 'Connecting Talent, Spot On',
    supportPhone: DEFAULT_COMPANY.phone,
    whatsapp: DEFAULT_COMPANY.phone,
    supportEmail: DEFAULT_COMPANY.supportEmail,
    officeAddress: DEFAULT_COMPANY.offices.map((office) => `${office.city}: ${office.address}`).join('\n'),
    officeHours: 'Monday to Friday, 10:00 to 17:00 Lisbon time and 10:00 to 17:00 Dubai time',
    familyVoiceUrl: '',
    socials: { instagram: 'https://www.instagram.com/smithandadamsgroup/', facebook: '', linkedin: 'https://www.linkedin.com/company/91010816/', youtube: '' },
  },
  announcement: {
    enabled: true,
    text: 'We never ask for money on WhatsApp or by bank transfer. Every payment happens on this website.',
    linkLabel: 'How to stay safe',
    href: '/stay-safe',
  },
  navigation: {
    items: [
      {
        label: 'Jobs',
        labelHi: 'नौकरियाँ',
        labelAr: 'الوظائف',
        labels: { bn: 'চাকরি', mr: 'नोकऱ्या', te: 'ఉద్యోగాలు', ta: 'வேலைகள்', ur: 'نوکریاں', gu: 'નોકરીઓ', kn: 'ಉದ್ಯೋಗಗಳು', or: 'ଚାକିରି', ml: 'ജോലികൾ', pa: 'ਨੌਕਰੀਆਂ', as: 'চাকৰি' },
        href: '/jobs',
      },
      {
        label: 'How it works',
        labelHi: 'यह कैसे काम करता है',
        labelAr: 'كيف يعمل',
        labels: { bn: 'কীভাবে কাজ করে', mr: 'हे कसे काम करते', te: 'ఇది ఎలా పని చేస్తుంది', ta: 'எப்படி வேலை செய்கிறது', ur: 'یہ کیسے کام کرتا ہے', gu: 'આ કેવી રીતે કામ કરે છે', kn: 'ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ', or: 'ଏହା କିପରି କାମ କରେ', ml: 'എങ്ങനെ പ്രവർത്തിക്കുന്നു', pa: 'ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ', as: 'এইটো কেনেকৈ কাম কৰে' },
        href: '/how-it-works',
      },
      {
        label: 'Why Portugal',
        labelHi: 'पुर्तगाल क्यों',
        labelAr: 'لماذا البرتغال',
        labels: { bn: 'পর্তুগাল কেন', mr: 'पोर्तुगाल का', te: 'పోర్చుగల్ ఎందుకు', ta: 'ஏன் போர்ச்சுகல்', ur: 'پرتگال کیوں', gu: 'પોર્ટુગલ શા માટે', kn: 'ಪೋರ್ಚುಗಲ್ ಏಕೆ', or: 'ପର୍ତ୍ତୁଗାଲ କାହିଁକି', ml: 'എന്തുകൊണ്ട് പോർച്ചുഗൽ', pa: 'ਪੁਰਤਗਾਲ ਕਿਉਂ', as: 'পৰ্তুগাল কিয়' },
        href: '/why-portugal',
      },
      {
        label: 'Visa & relocation',
        labelHi: 'वीज़ा और स्थानांतरण',
        labelAr: 'التأشيرة والانتقال',
        labels: { bn: 'ভিসা ও স্থানান্তর', mr: 'व्हिसा आणि स्थलांतर', te: 'వీసా మరియు తరలింపు', ta: 'விசா மற்றும் இடமாற்றம்', ur: 'ویزا اور منتقلی', gu: 'વિઝા અને સ્થળાંતર', kn: 'ವೀಸಾ ಮತ್ತು ಸ್ಥಳಾಂತರ', or: 'ଭିସା ଏବଂ ସ୍ଥାନାନ୍ତର', ml: 'വിസയും മാറ്റിപ്പാർപ്പും', pa: 'ਵੀਜ਼ਾ ਅਤੇ ਤਬਾਦਲਾ', as: 'ভিছা আৰু স্থানান্তৰ' },
        href: '/visa-and-relocation',
      },
      {
        label: 'FAQ',
        labelHi: 'सवाल-जवाब',
        labelAr: 'الأسئلة الشائعة',
        labels: { bn: 'প্রশ্নোত্তর', mr: 'प्रश्न', te: 'ప్రశ్నలు', ta: 'கேள்விகள்', ur: 'سوالات', gu: 'પ્રશ્નો', kn: 'ಪ್ರಶ್ನೆಗಳು', or: 'ପ୍ରଶ୍ନ', ml: 'ചോദ്യങ്ങൾ', pa: 'ਸਵਾਲ', as: 'প্ৰশ্ন' },
        href: '/faq',
      },
      {
        label: 'Employers',
        labelHi: 'नियोक्ता',
        labelAr: 'أصحاب العمل',
        labels: { bn: 'নিয়োগকর্তা', mr: 'नियोक्ते', te: 'యజమానులు', ta: 'முதலாளிகள்', ur: 'آجر', gu: 'નોકરીદાતાઓ', kn: 'ಉದ್ಯೋಗದಾತರು', or: 'ନିଯୁକ୍ତିଦାତା', ml: 'തൊഴിലുടമകൾ', pa: 'ਮਾਲਕ', as: 'নিয়োগকর্তা' },
        href: '/employers',
      },
    ],
    headerCta: {
      /* The same action as the hero's button, so the header and the page
         never ask for two different first steps. */
      label: 'Create my free profile',
      href: '/signup',
      labels: {
        hi: 'मेरी मुफ़्त प्रोफ़ाइल बनाएँ',
        bn: 'আমার বিনামূল্যে প্রোফাইল তৈরি করুন',
        mr: 'माझी मोफत प्रोफाइल तयार करा',
        te: 'నా ఉచిత ప్రొఫైల్ సృష్టించండి',
        ta: 'என் இலவச சுயவிவரத்தை உருவாக்கு',
        ur: 'میری مفت پروفائل بنائیں',
        gu: 'મારી મફત પ્રોફાઇલ બનાવો',
        kn: 'ನನ್ನ ಉಚಿತ ಪ್ರೊಫೈಲ್ ರಚಿಸಿ',
        or: 'ମୋର ମାଗଣା ପ୍ରୋଫାଇଲ୍ ତିଆରି କରନ୍ତୁ',
        ml: 'എന്റെ സൗജന്യ പ്രൊഫൈൽ ഉണ്ടാക്കുക',
        pa: 'ਮੇਰੀ ਮੁਫ਼ਤ ਪ੍ਰੋਫਾਈਲ ਬਣਾਓ',
        as: 'মোৰ বিনামূলীয়া প্ৰফাইল তৈয়াৰ কৰক',
        ar: 'أنشئ ملفي المجاني',
      },
    },
  },
  footer: {
    blurb: 'Recruitment from India to Portugal, with real employers, legal contracts and support from your first application to your first month at work.',
  },
  applications: { requirePaidAssessment: false, allowQuickApply: true, filmUrl: '/video/intro.mp4', filmLabel: 'Watch how it works · under a minute' },
  seo: {
    defaultTitle: `${DEFAULT_COMPANY.tradingAs} · Jobs in Portugal for Indian talent`,
    defaultDescription:
      'Apply for real jobs in Portugal from India. Free to apply, no placement fees for candidates, UPI accepted, visa and relocation support included.',
    ogImage: '/brand/og.png',
    pages: {
      employers: {
        title: 'Hire skilled workers from India',
        description: 'Assessed candidates from India for hospitality, construction, cleaning and logistics roles in Portugal. Candidates never pay for a job; the employer pays the placement fee.',
        ogTitle: '',
        ogImage: '',
      },
      pricing: {
        title: 'Pricing',
        description: 'Joining our candidate database is free. The skills report and the visa-requirements list are optional. Employers pay the placement fee.',
        ogTitle: '',
        ogImage: '',
      },
      signup: {
        title: 'Register for jobs in Portugal',
        description: 'Create your free profile and take the assessment. It puts you in our candidate database for jobs in Portugal.',
        ogTitle: '',
        ogImage: '',
      },
      signin: { title: 'Sign in', description: 'Sign in to see your applications, your report and your next steps.', ogTitle: '', ogImage: '' },
      assessment: {
        title: 'Skills and English assessment',
        description: 'The free skills and English assessment that puts you in our candidate database. You can take it on your phone.',
        ogTitle: '',
        ogImage: '',
      },
      go: {
        title: 'Watch: jobs in Portugal for Indian talent',
        description:
          'Watch how the free skills test works, then create your profile. Real Portuguese employers, no placement fee for candidates.',
        ogTitle: 'Watch: India to Portugal jobs',
        ogImage: '',
      },
    },
  },
  company: DEFAULT_COMPANY,
  pricing: DEFAULT_PRICING,
  hiring: DEFAULT_HIRING,
  cohort: DEFAULT_COHORT,
  emails: DEFAULT_EMAILS,
  vsl: {
    eyebrow: 'India → Portugal · Free to start',
    headline: 'Real jobs in Portugal. Watch how it works, then apply from your phone.',
    subhead:
      'Five minutes to create a free profile and take the skills test. Portuguese employers searching for chefs, cleaners, drivers, electricians and more can find you. No placement fee for candidates.',
    videoUrl: '',
    videoPoster: '/video/hero-poster.jpg',
    videoTitle: 'How Avsar places Indian talent with Portuguese employers',
    highlights: [
      'Free skills and English test on your phone',
      'Housing, meals and visa costs covered when selected',
      'You never pay to be hired. The only optional prices are the two reports, on this site',
      'WhatsApp support in Hindi or English',
    ],
    primaryCtaLabel: 'Create my free profile',
    secondaryCtaLabel: 'Or browse open jobs',
    stickyCtaLabel: 'Start free — take the assessment',
  },
  conversion: {
    trustLines: [
      'You never pay to be hired. The employer pays our fee.',
      'The only money we take is for the skills report and the visa-requirements list, on this website, with a receipt.',
      'Buying either report does not change your shortlist chances and does not guarantee a job or a visa.',
      'Pay by UPI on this site. Never cash, never WhatsApp, never an agent.',
    ],
    deliverables: [
      {
        title: 'Skills report PDF',
        timing:
          'Leads with the field you scored highest in, so that is what an employer reads first. Your score on the dashboard is free. The PDF is the paid document.',
      },
      {
        title: 'Visa requirements, document by document',
        timing:
          'What a Portuguese work visa needs from you, and what is still missing. Usually within {{legal_review_days}} working days of a complete upload. Not a visa decision.',
      },
      {
        title: 'Rewritten CV',
        timing: 'Free, from the experience you entered, before you see a price. You can download it and use it anywhere.',
      },
      {
        title: 'Both reports together',
        timing: 'Offered at the skills-report step, for less than the two prices added up.',
      },
    ],
    offerHeading: 'You only pay for the two reports',
    offerBody:
      'Your account, rewritten CV, test and score are free, and you are in the database. The skills report and the visa-requirements list are optional. Buying either does not move you up a shortlist.',
    offerPrimaryLabel: 'See the two prices',
    offerSecondaryLabel: 'Browse jobs first',
    stickyCtaLabel: 'See the two reports',
    pricingLead:
      'Joining the database is free. You pay only for a skills report and a list of what is missing for the visa, or for both together at the lower price. Neither gives priority, and neither is a job or a visa.',
    pricingFeatures: [
      'Skills report PDF, leading with your strongest field',
      'Visa requirements, document by document',
      'Both reports together, at the lower price',
      'Rewritten CV, free, before any price',
      'Score, account, test and applying stay free',
      'No shortlist priority from buying',
    ],
    pricingTitle: 'Report prices',
    pricingQuestions: 'Questions',
    pricingStartCta: 'Create a free account',
    candidateEyebrow: 'Candidates',
    candidatePeriod: 'both together',
    employerEyebrow: 'Employers · per hire',
    employerPeriod: 'per placement',
    employerNote: 'Search is free. Pay when the candidate starts.',
    employerFeatures: ['Talent-pool search', 'Skills reports', 'Visa and relocation handled', '90-day replacement'],
    partnerEyebrow: 'Employers · partner',
    partnerPrice: 'Custom',
    partnerNote: 'For 10+ hires a year across sites.',
    partnerFeatures: ['Everything in per hire', 'Dedicated recruiter', 'Pre-arrival training', 'Housing coordination'],
    bookCall: 'Book a call',
    contactSales: 'Contact sales',
    reportsHeading: 'What the two reports include',
    storiesEyebrow: 'From people who made the move',
    storiesTitle: 'In their own words',
    storiesIntro: 'Only stories written by candidates we placed and approved by our team. Nothing is invented.',
    pricingFaq: [
      {
        question: 'What can I pay for?',
        answer:
          'A skills report PDF ({skills}) and a list of what is missing for the visa ({visa}). Both together are {bundle}, instead of {separate}. The account, the rewritten CV, the test, your score and applying are free. Buying either report gives no priority and does not guarantee an interview, a job or a visa.',
      },
      {
        question: 'Do I pay a placement fee if I am hired?',
        answer: 'No. The employer pays our fee. If anyone asks you to pay for a job offer, a visa slot or processing, it is not us.',
      },
      {
        question: 'When do I pay?',
        answer:
          'Only if you choose to, after you have read your rewritten CV and seen your score. You pay on this website for the skills report, the visa-requirements list, or both together.',
      },
      {
        question: 'Can I get a refund?',
        answer:
          'Yes. Within 14 days you can have back the amount you paid, if you have not downloaded that paid document. Downloading the free CV does not affect the refund.',
      },
    ],
    mentionPackageInJobAlerts: true,
  },
  employerLanding: {
    wordmarkSuffix: 'for employers',
    navTalent: 'Talent pool',
    navHow: 'How it works',
    navPricing: 'Pricing',
    navCandidates: 'For candidates',
    ctaLabel: 'Book a call',
    headline: 'Hire pre-assessed workers from India for your team in Portugal.',
    intro:
      'Search a pool of candidates scored on skills, experience and English. We handle visas, relocation, housing and onboarding.',
    stepsTitle: 'From search to first shift',
    steps: [
      { title: 'Search and shortlist', body: 'Describe the role in plain words. Filter by sector, English level and experience.' },
      { title: 'Interview', body: 'Video interviews with shortlisted candidates, with their full skills report attached.' },
      { title: 'We relocate them', body: 'Work visa, travel, housing and arrival support, handled by our team in Lisbon.' },
    ],
    contactTitle: 'Tell us what roles you need to fill.',
    contactNote: '{{fee}} per placement. Search is free.',
  },
};

/**
 * Merge stored rows over defaults, one level deep per key, and one level more
 * for the objects inside company, pricing and emails, so a currency or a
 * template added in code is filled in for a database saved before it existed.
 */
export function mergeSettings(rows: { key: string; value: unknown }[]): SiteSettings {
  const out = structuredClone(DEFAULT_SETTINGS) as SiteSettings;
  for (const row of rows) {
    if (!(SETTINGS_KEYS as readonly string[]).includes(row.key)) continue;
    const key = row.key as SettingsKey;
    if (row.value && typeof row.value === 'object') {
      (out as Record<string, unknown>)[key] = { ...(out[key] as object), ...(row.value as object) };
    }
  }
  const stored = Object.fromEntries(rows.map((row) => [row.key, row.value])) as Partial<Record<string, Record<string, unknown>>>;
  const nested = (key: string, field: string) => (stored[key]?.[field] as object | undefined) ?? {};
  out.pricing.feeMinor = { ...DEFAULT_PRICING.feeMinor, ...nested('pricing', 'feeMinor') };
  out.pricing.skillsReportFeeMinor = { ...DEFAULT_PRICING.skillsReportFeeMinor, ...nested('pricing', 'skillsReportFeeMinor') };
  out.pricing.visaRequirementsFeeMinor = { ...DEFAULT_PRICING.visaRequirementsFeeMinor, ...nested('pricing', 'visaRequirementsFeeMinor') };
  out.pricing.bundleFeeMinor = { ...DEFAULT_PRICING.bundleFeeMinor, ...nested('pricing', 'bundleFeeMinor') };
  out.pricing.indicativeRates = { ...DEFAULT_PRICING.indicativeRates, ...nested('pricing', 'indicativeRates') };
  out.company.partner = { ...DEFAULT_COMPANY.partner, ...nested('company', 'partner') };
  const storedPages = nested('seo', 'pages') as Partial<Record<StaticSeoPage, Partial<PageSeoSettings>>>;
  for (const { key } of STATIC_SEO_PAGES) {
    out.seo.pages[key] = { ...DEFAULT_SETTINGS.seo.pages[key], ...(storedPages[key] ?? {}) };
  }
  for (const id of Object.keys(DEFAULT_EMAILS) as (keyof EmailSettings)[]) {
    out.emails[id] = { ...DEFAULT_EMAILS[id], ...nested('emails', id) };
  }
  /* Arrays in conversion replace wholesale when saved; if an older row has
     none, keep the defaults so a fresh deploy is never blank. */
  const storedConversion = stored.conversion as Partial<ConversionSettings> | undefined;
  if (storedConversion) {
    out.conversion = {
      ...DEFAULT_SETTINGS.conversion,
      ...storedConversion,
      trustLines:
        Array.isArray(storedConversion.trustLines) && storedConversion.trustLines.length > 0
          ? storedConversion.trustLines.map(String).slice(0, 5)
          : DEFAULT_SETTINGS.conversion.trustLines,
      deliverables:
        Array.isArray(storedConversion.deliverables) && storedConversion.deliverables.length > 0
          ? storedConversion.deliverables
              .filter((d): d is ConversionDeliverable => Boolean(d && typeof d === 'object'))
              .map((d) => ({ title: String(d.title ?? ''), timing: String(d.timing ?? '') }))
              .slice(0, 6)
          : DEFAULT_SETTINGS.conversion.deliverables,
      pricingFeatures:
        Array.isArray(storedConversion.pricingFeatures) && storedConversion.pricingFeatures.length > 0
          ? storedConversion.pricingFeatures.map(String).slice(0, 10)
          : DEFAULT_SETTINGS.conversion.pricingFeatures,
      employerFeatures:
        Array.isArray(storedConversion.employerFeatures) && storedConversion.employerFeatures.length > 0
          ? storedConversion.employerFeatures.map(String).slice(0, 8)
          : DEFAULT_SETTINGS.conversion.employerFeatures,
      partnerFeatures:
        Array.isArray(storedConversion.partnerFeatures) && storedConversion.partnerFeatures.length > 0
          ? storedConversion.partnerFeatures.map(String).slice(0, 8)
          : DEFAULT_SETTINGS.conversion.partnerFeatures,
      pricingFaq:
        Array.isArray(storedConversion.pricingFaq) && storedConversion.pricingFaq.length > 0
          ? storedConversion.pricingFaq
              .filter((item): item is { question: string; answer: string } => Boolean(item && typeof item === 'object'))
              .map((item) => ({ question: String(item.question ?? ''), answer: String(item.answer ?? '') }))
              .filter((item) => item.question && item.answer)
              .slice(0, 8)
          : DEFAULT_SETTINGS.conversion.pricingFaq,
    };
  }
  const storedLanding = stored.employerLanding as Partial<EmployerLanding> | undefined;
  if (storedLanding) {
    out.employerLanding = {
      ...DEFAULT_SETTINGS.employerLanding,
      ...storedLanding,
      steps:
        Array.isArray(storedLanding.steps) && storedLanding.steps.length > 0
          ? storedLanding.steps
              .filter((step): step is { title: string; body: string } => Boolean(step && typeof step === 'object'))
              .map((step) => ({ title: String(step.title ?? ''), body: String(step.body ?? '') }))
              .filter((step) => step.title && step.body)
              .slice(0, 6)
          : DEFAULT_SETTINGS.employerLanding.steps,
    };
  }
  const storedVsl = stored.vsl as Partial<VslSettings> | undefined;
  if (storedVsl) {
    out.vsl = {
      ...DEFAULT_SETTINGS.vsl,
      ...storedVsl,
      highlights:
        Array.isArray(storedVsl.highlights) && storedVsl.highlights.length > 0
          ? storedVsl.highlights.map(String).slice(0, 6)
          : DEFAULT_SETTINGS.vsl.highlights,
    };
  }
  return out;
}

/**
 * Film for the /go funnel: Settings › VSL video, else Applications film,
 * else the shipped intro clip so ads never land on a blank player.
 */
export function resolveVslVideo(settings: SiteSettings): { src: string; poster: string; title: string } {
  const src =
    settings.vsl.videoUrl.trim() ||
    settings.applications.filmUrl.trim() ||
    '/video/intro.mp4';
  const poster = settings.vsl.videoPoster.trim() || '/video/hero-poster.jpg';
  const title = settings.vsl.videoTitle.trim() || 'How it works';
  return { src, poster, title };
}

/** Label for the current locale, falling back to English. */
export function navLabel(item: NavItem, locale: Locale): string {
  const translated = item.labels?.[locale];
  if (translated) return translated;
  if (locale === 'hi' && item.labelHi) return item.labelHi;
  if (locale === 'ar' && item.labelAr) return item.labelAr;
  return item.label;
}

/** Header button, with the same fallback as navigation labels. */
export function ctaLabel(cta: { label: string; labels?: Partial<Record<Locale, string>> }, locale: Locale): string {
  return cta.labels?.[locale] || cta.label;
}

/**
 * Public URL for a candidate path in this language.
 *
 * English has no prefix. Paths outside the candidate site (employers, admin,
 * api, assets) and absolute URLs are returned untouched, as is a path that
 * already names its language.
 */
export function localHref(locale: Locale, href: string): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  if (/^\/(employers|admin|api|auth|dev|brand|video|positions|walkthrough)(\/|$|\?|#)/.test(href)) return href;
  const segment = href.split(/[/?#]/)[1] ?? '';
  if (isLocale(segment)) return href;
  return localePath(locale, href);
}

/** wa.me link from a phone number in any format. */
export function whatsappHref(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : '';
}
