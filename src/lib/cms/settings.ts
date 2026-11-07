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
import {
  DEFAULT_EMPLOYER_REGISTRATION,
  type EmployerRegistrationSettings,
} from '@/lib/cms/employer-registration';

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
  { key: 'employerRegister', label: 'Employer registration', path: '/employers/register' },
  { key: 'pricing', label: 'Pricing', path: '/pricing' },
  { key: 'signup', label: 'Register', path: '/signup' },
  { key: 'signin', label: 'Sign in', path: '/signin' },
  { key: 'assessment', label: 'Assessment', path: '/assessment' },
  { key: 'go', label: 'VSL funnel', path: '/go' },
] as const;
export type StaticSeoPage = (typeof STATIC_SEO_PAGES)[number]['key'];
export type PageSeoSettings = {
  title: string;
  description: string;
  ogTitle: string;
  /** Empty uses the search description when the page is shared. */
  ogDescription: string;
  ogImage: string;
};

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
    socials: { instagram: string; facebook: string; linkedin: string; youtube: string; tiktok: string };
  };
  announcement: { enabled: boolean; text: string; linkLabel: string; href: string };
  navigation: { items: NavItem[]; headerCta: { label: string; href: string; labels?: Partial<Record<Locale, string>> } };
  /**
   * Public footer shell. Columns and legal links are edited here so marketing
   * can change destinations without a deploy; each href should be a CMS page
   * or a live route that already exists.
   */
  footer: FooterSettings;
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
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    /** WhatsApp / social card title when a page leaves Share title empty. */
    defaultOgTitle: string;
    /** WhatsApp / social card description when a page leaves Share description empty. */
    defaultOgDescription: string;
    ogImage: string;
    pages: Record<StaticSeoPage, PageSeoSettings>;
  };
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
  /** Multi-step enquiry at /employers/register. */
  employerRegistration: EmployerRegistrationSettings;
  /**
   * Chrome on /jobs: search placeholders, filter headings, card buttons and
   * the live-stat labels. Counts are filled from the database at render time.
   */
  jobsBoard: JobsBoardSettings;
  /**
   * Paid-traffic VSL funnel at /[locale]/go: video, headline and CTAs that
   * send the visitor to sign-up. Video falls back to Applications film, then
   * /video/intro.mp4, so the page never ships blank.
   */
  vsl: VslSettings;
};

export type FooterLink = { label: string; href: string };

export type FooterTrustBadge = { label: string; icon: string };

export type FooterSettings = {
  blurb: string;
  /** Quiet disclaimer under the blurb (visa / outcomes wording). */
  disclaimer: string;
  /** Optional photograph behind the lower band. Empty = solid navy (HTML-44). */
  backgroundImage: string;
  backgroundImageAlt: string;
  quickLinksTitle: string;
  quickLinks: FooterLink[];
  companyTitle: string;
  companyLinks: FooterLink[];
  legalLinks: FooterLink[];
  trustBadges: FooterTrustBadge[];
  subscribeTitle: string;
  subscribeNote: string;
  subscribePlaceholder: string;
  followTitle: string;
  copyright: string;
};

/** Labels on the jobs board. {count} is replaced with a live figure. */
export type JobsBoardSettings = {
  /** Hero shell on /jobs (mockup). */
  heroEyebrow: string;
  heroHeadline: string;
  heroAccentWord: string;
  heroIntro: string;
  heroImage: string;
  heroImageAlt: string;
  searchKeywordPlaceholder: string;
  searchLocationLabel: string;
  searchCategoryLabel: string;
  searchButton: string;
  filterTitle: string;
  clearAll: string;
  categoryHeading: string;
  experienceHeading: string;
  employmentHeading: string;
  salaryHeading: string;
  salaryMinLabel: string;
  salaryMaxLabel: string;
  experienceEntry: string;
  experienceMid: string;
  experienceSenior: string;
  resultsHeading: string;
  sortLabel: string;
  sortNewest: string;
  sortSalary: string;
  verifiedBadge: string;
  viewDetails: string;
  applyNow: string;
  /** Shell figures on the hero ribbon (editable in Settings). */
  statsVacanciesValue: string;
  statsVacancies: string;
  statsEmployersValue: string;
  statsEmployers: string;
  statsPlacedValue: string;
  statsPlaced: string;
  emptyTitle: string;
  emptyBody: string;
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

/** One photograph in the /employers hero slideshow. */
export type EmployerLandingSlide = { src: string; alt: string };

/** A reason card under "Why partner with us". */
export type EmployerLandingReason = { icon: string; title: string; body: string };

/** An industry chip on the navy industries band. */
export type EmployerLandingIndustry = { icon: string; label: string };

/**
 * The /employers page. Everything on that landing is edited here; the
 * placement fee in contactNote is {{fee}}, filled from Company & pricing.
 * Stat figures are shell copy from Settings (mockup ribbon), not live DB counts.
 */
export type EmployerLanding = {
  wordmarkSuffix: string;
  /** Navy header links on /employers (mockup order). */
  headerLinks: { label: string; href: string }[];
  navTalent: string;
  navHow: string;
  navPricing: string;
  navCandidates: string;
  /** Compact CTA in the navy header. */
  headerCtaLabel: string;
  /** Hero / closing primary button. */
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  eyebrow: string;
  headline: string;
  /** Word drawn in gold italic inside the headline when it matches. */
  accentWord: string;
  intro: string;
  badgeLabel: string;
  badgeSubtext: string;
  badgeHref: string;
  slides: EmployerLandingSlide[];
  statsCandidatesValue: string;
  statsCandidates: string;
  statsIndustriesValue: string;
  statsIndustries: string;
  statsPlacedValue: string;
  statsPlaced: string;
  hiringTimeValue: string;
  hiringTimeLabel: string;
  reasonsTitle: string;
  reasons: EmployerLandingReason[];
  industriesTitle: string;
  industriesImage: string;
  industriesImageAlt: string;
  industries: EmployerLandingIndustry[];
  stepsTitle: string;
  steps: { title: string; body: string }[];
  closingTitle: string;
  closingBody: string;
  contactTitle: string;
  contactNote: string;
  searchHeading: string;
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
  'employerRegistration',
  'jobsBoard',
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
    socials: {
      instagram: 'https://www.instagram.com/smithandadamsgroup/',
      facebook: '',
      linkedin: 'https://www.linkedin.com/company/91010816/',
      youtube: '',
      tiktok: '',
    },
  },
  announcement: {
    enabled: true,
    text: 'We never ask for money on WhatsApp or by bank transfer. Every payment happens on this website.',
    linkLabel: 'How to stay safe',
    href: '/stay-safe',
  },
  navigation: {
    /* Order mirrors the HTML-44 public header: Jobs → Industries → How it works → … */
    items: [
      {
        label: 'Jobs',
        labelHi: 'नौकरियाँ',
        labelAr: 'الوظائف',
        labels: { bn: 'চাকরি', mr: 'नोकऱ्या', te: 'ఉద్యోగాలు', ta: 'வேலைகள்', ur: 'نوکریاں', gu: 'નોકરીઓ', kn: 'ಉದ್ಯೋಗಗಳು', or: 'ଚାକିରି', ml: 'ജോലികൾ', pa: 'ਨੌਕਰੀਆਂ', as: 'চাকৰি' },
        href: '/jobs',
      },
      {
        label: 'Industries',
        labelHi: 'उद्योग',
        labelAr: 'القطاعات',
        labels: {},
        href: '/industries',
      },
      {
        label: 'How it works',
        labelHi: 'यह कैसे काम करता है',
        labelAr: 'كيف يعمل',
        labels: { bn: 'কীভাবে কাজ করে', mr: 'हे कसे काम करते', te: 'ఇది ఎలా పని చేస్తుంది', ta: 'எப்படி வேலை செய்கிறது', ur: 'یہ کیسے کام کرتا ہے', gu: 'આ કેવી રીતે કામ કરે છે', kn: 'ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ', or: 'ଏହା କିପରି କାମ କରେ', ml: 'എങ്ങനെ പ്രവർത്തിക്കുന്നു', pa: 'ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ', as: 'এইটো কেনেকৈ কাম কৰে' },
        href: '/how-it-works',
      },
      {
        label: 'Assessments',
        labelHi: 'मूल्यांकन',
        labelAr: 'التقييمات',
        labels: {},
        href: '/assessment',
      },
      {
        label: 'Relocation',
        labelHi: 'स्थानांतरण',
        labelAr: 'الانتقال',
        labels: { bn: 'ভিসা ও স্থানান্তর', mr: 'व्हिसा आणि स्थलांतर', te: 'వీసా మరియు తరలింపు', ta: 'விசா மற்றும் இடமாற்றம்', ur: 'ویزا اور منتقلی', gu: 'વિઝા અને સ્થળાંતર', kn: 'ವೀಸಾ ಮತ್ತು ಸ್ಥಳಾಂತರ', or: 'ଭିସା ଏବଂ ସ୍ଥାନାନ୍ତର', ml: 'വിസയും മാറ്റിപ്പാർപ്പും', pa: 'ਵੀਜ਼ਾ ਅਤੇ ਤਬਾਦਲਾ', as: 'ভিছা আৰু স্থানান্তৰ' },
        href: '/visa-and-relocation',
      },
      {
        label: 'About',
        labelHi: 'हमारे बारे में',
        labelAr: 'من نحن',
        labels: {},
        href: '/about',
      },
      {
        label: 'Contact',
        labelHi: 'संपर्क',
        labelAr: 'اتصل بنا',
        labels: {},
        href: '/contact',
      },
      {
        label: 'FAQs',
        labelHi: 'प्रश्न',
        labelAr: 'الأسئلة',
        labels: {},
        href: '/faq',
      },
      {
        label: 'Employers',
        labelHi: 'नियोक्ता',
        labelAr: 'أصحاب العمل',
        labels: { bn: 'নিয়োগকর্তাদের জন্য', mr: 'नियोक्त्यांसाठी', te: 'యజమానుల కోసం', ta: 'முதலாளிகளுக்கு', ur: 'آجروں کے لیے', gu: 'નોકરીદાતાઓ માટે', kn: 'ಉದ್ಯೋಗದಾತರಿಗಾಗಿ', or: 'ନିଯୁକ୍ତିଦାତାଙ୍କ ପାଇଁ', ml: 'തൊഴിലുടമകൾക്ക്', pa: 'ਮਾਲਕਾਂ ਲਈ', as: 'নিয়োগকৰ্তাসকলৰ বাবে' },
        href: '/employers',
      },
    ],
    headerCta: {
      /* Matches HTML-44 “Post a Vacancy” primary action for anonymous visitors. */
      label: 'Post a Vacancy',
      href: '/employers/register',
      labels: {
        hi: 'मुफ़्त प्रोफ़ाइल बनाएँ',
        bn: 'বিনামূল্যে প্রোফাইল তৈরি করুন',
        mr: 'मोफत प्रोफाइल तयार करा',
        te: 'ఉచిత ప్రొఫైల్ సృష్టించండి',
        ta: 'இலவச சுயவிவரம் உருவாக்கு',
        ur: 'مفت پروفائل بنائیں',
        gu: 'મફત પ્રોફાઇલ બનાવો',
        kn: 'ಉಚಿತ ಪ್ರೊಫೈಲ್ ರಚಿಸಿ',
        or: 'ମାଗଣା ପ୍ରୋଫାଇଲ୍ ତିଆରି କରନ୍ତୁ',
        ml: 'സൗജന്യ പ്രൊഫൈൽ ഉണ്ടാക്കുക',
        pa: 'ਮੁਫ਼ਤ ਪ੍ਰੋਫਾਈਲ ਬਣਾਓ',
        as: 'বিনামূলীয়া প্ৰফাইল তৈয়াৰ কৰক',
        ar: 'أنشئ ملفاً مجانياً',
      },
    },
  },
  footer: {
    /* Columns and copy mirror the HTML-44 public footer shell. */
    blurb: 'Connecting skilled professionals in India with employers in Portugal.',
    disclaimer: 'Recruitment outcomes and visa approvals depend on applicable requirements.',
    backgroundImage: '',
    backgroundImageAlt: '',
    quickLinksTitle: 'Explore',
    quickLinks: [
      { label: 'Jobs', href: '/jobs' },
      { label: 'Industries', href: '/industries' },
      { label: 'How it works', href: '/how-it-works' },
      { label: 'Assessments', href: '/assessment' },
      { label: 'Relocation', href: '/visa-and-relocation' },
    ],
    companyTitle: 'Company',
    companyLinks: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'FAQs', href: '/faq' },
      { label: 'Employers', href: '/employers' },
      { label: 'Create candidate profile', href: '/signup' },
    ],
    legalLinks: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Cookies', href: '/cookie-policy' },
    ],
    trustBadges: [],
    subscribeTitle: 'Stay informed',
    subscribeNote: 'Get recruitment news and platform updates.',
    subscribePlaceholder: 'Email address',
    followTitle: 'Follow Us',
    copyright: '© {{year}} {{brand}} (Smith & Adams).',
  },
  applications: { requirePaidAssessment: false, allowQuickApply: true, filmUrl: '/video/intro.mp4', filmLabel: 'Watch how it works · under a minute' },
  seo: {
    defaultTitle: `${DEFAULT_COMPANY.tradingAs} · Jobs in Portugal for Indian talent`,
    defaultDescription:
      'Apply for real jobs in Portugal from India. Free to apply, no placement fees for candidates, UPI accepted, visa and relocation support included.',
    defaultOgTitle: 'Jobs in Portugal for Indian talent · Apply free from your phone',
    defaultOgDescription:
      'Real jobs with Portuguese employers. Free to apply, no placement fees for candidates, UPI accepted, visa and relocation support.',
    ogImage: '/brand/og.png',
    pages: {
      employers: {
        title: 'Hire skilled workers from India',
        description: 'Assessed candidates from India for hospitality, construction, cleaning and logistics roles in Portugal. Candidates never pay for a job; the employer pays the placement fee.',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
      },
      employerRegister: {
        title: 'Employer registration · Submit hiring requirements',
        description:
          'Tell us the roles you need. We deliver a pre-screened shortlist from India with recruitment and relocation support to Portugal.',
        ogTitle: '',
        ogDescription: '',
        ogImage: '/photos/brand/employer-register-hero.jpg',
      },
      pricing: {
        title: 'Pricing',
        description: 'Joining our candidate database is free. The skills report and the visa-requirements list are optional. Employers pay the placement fee.',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
      },
      signup: {
        title: 'Register for jobs in Portugal',
        description: 'Create your free profile and take the assessment. It puts you in our candidate database for jobs in Portugal.',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
      },
      signin: {
        title: 'Sign in',
        description: 'Sign in to see your applications, your report and your next steps.',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
      },
      assessment: {
        title: 'Skills and English assessment',
        description: 'The free skills and English assessment that puts you in our candidate database. You can take it on your phone.',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
      },
      go: {
        title: 'Watch: jobs in Portugal for Indian talent',
        description:
          'Watch how the free skills test works, then create your profile. Real Portuguese employers, no placement fee for candidates.',
        ogTitle: 'Watch: India to Portugal jobs',
        ogDescription: '',
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
    headerLinks: [
      { label: 'Home', href: '/' },
      { label: 'Jobs', href: '/jobs' },
      { label: 'How it Works', href: '/how-it-works' },
      { label: 'Why Portugal', href: '/why-portugal' },
      { label: 'Visa & Relocation', href: '/visa-and-relocation' },
      { label: 'For Employers', href: '/employers' },
    ],
    navTalent: 'Talent pool',
    navHow: 'How it works',
    navPricing: 'Pricing',
    navCandidates: 'For candidates',
    headerCtaLabel: 'Hire Talent',
    ctaLabel: 'Hire Talent Today',
    ctaHref: '/employers/register',
    secondaryCtaLabel: 'Book a Consultation',
    secondaryCtaHref: '#contact',
    eyebrow: 'FOR EMPLOYERS',
    headline: 'Hire Verified Talent from India for Your Business in Portugal',
    accentWord: 'Portugal',
    intro:
      'A trusted recruitment partner for Portuguese companies, connecting you with skilled, pre-screened and job-ready professionals.',
    badgeLabel: 'Portugal Talent Programme',
    badgeSubtext: 'Skilled • Verified • Compliant',
    badgeHref: '/employers/register',
    slides: [
      { src: '/photos/brand/employer-meeting.jpg', alt: 'Hiring managers reviewing candidates together' },
    ],
    /* Values stay empty unless real — the page hides empty stats. No mockup 1,200+ / 98%. */
    statsCandidatesValue: '',
    statsCandidates: 'Pre-screened candidates',
    statsIndustriesValue: '',
    statsIndustries: 'Key industries',
    statsPlacedValue: '',
    statsPlaced: 'Placement success',
    hiringTimeValue: '',
    hiringTimeLabel: 'Typical hiring window',
    reasonsTitle: 'Why Partner With Us?',
    reasons: [
      { icon: 'users', title: 'Pre-Screened Talent', body: 'Skills, experience and documentation verified.' },
      { icon: 'shield', title: 'Compliance & Visas', body: 'Full relocation and legal support.' },
      { icon: 'bolt', title: 'Faster Hiring', body: 'Shortlists in days, not months.' },
      { icon: 'headset', title: 'Dedicated Support', body: 'A dedicated team from hiring to onboarding.' },
    ],
    industriesTitle: 'Access Skilled Talent Across Key Industries',
    industriesImage: '/photos/brand/journey-tram.jpg',
    industriesImageAlt: 'A yellow Lisbon tram on a historic street',
    industries: [
      { icon: 'bed', label: 'Hospitality & Tourism' },
      { icon: 'hardhat', label: 'Construction & Trades' },
      { icon: 'truck', label: 'Logistics & Warehouse' },
      { icon: 'heart', label: 'Healthcare & Caregiving' },
      { icon: 'gear', label: 'Manufacturing & Production' },
      { icon: 'more', label: 'More Industries' },
    ],
    stepsTitle: 'From search to first shift',
    steps: [
      { title: 'Search and shortlist', body: 'Describe the role in plain words. Filter by sector, English level and experience.' },
      { title: 'Interview', body: 'Video interviews with shortlisted candidates, with their full skills report attached.' },
      { title: 'We relocate them', body: 'Work visa, travel, housing and arrival support, handled by our team in Lisbon.' },
    ],
    closingTitle: 'Let’s Build Your Team in Portugal',
    closingBody: 'Share your hiring needs and get a tailored talent shortlist for your business.',
    contactTitle: 'Tell us what roles you need to fill.',
    contactNote: '{{fee}} per placement. Search is free.',
    searchHeading: 'Search the talent pool',
  },
  employerRegistration: DEFAULT_EMPLOYER_REGISTRATION,
  jobsBoard: {
    heroEyebrow: 'JOB OPPORTUNITIES',
    heroHeadline: 'Explore Verified Jobs in Portugal',
    heroAccentWord: 'Portugal',
    heroIntro:
      'Discover real, company-verified opportunities for skilled professionals from India. Apply, get matched, and start your journey to work and live in Portugal.',
    heroImage: '/photos/brand/jobs-hero-1.jpg',
    heroImageAlt: 'A chef and a construction worker smiling with Lisbon rooftops behind them',
    searchKeywordPlaceholder: 'Job title, skill or keyword',
    searchLocationLabel: 'Portugal',
    searchCategoryLabel: 'Job category',
    searchButton: 'Search Jobs',
    filterTitle: 'Filter Opportunities',
    clearAll: 'Clear All',
    categoryHeading: 'Job Category',
    experienceHeading: 'Experience Level',
    employmentHeading: 'Employment Type',
    salaryHeading: 'Salary Range (Monthly)',
    salaryMinLabel: 'Min',
    salaryMaxLabel: 'Max',
    experienceEntry: 'Entry Level',
    experienceMid: 'Mid Level',
    experienceSenior: 'Senior Level',
    resultsHeading: '{count} Job Opportunities',
    sortLabel: 'Sort by',
    sortNewest: 'Newest',
    sortSalary: 'Salary',
    verifiedBadge: 'Verified',
    viewDetails: 'View Details',
    applyNow: 'Apply Now',
    /* Board page fills vacancies from the live published count; other values stay empty unless real. */
    statsVacanciesValue: '',
    statsVacancies: 'Open roles',
    statsEmployersValue: '',
    statsEmployers: 'Verified employers',
    statsPlacedValue: '',
    statsPlaced: 'Hired',
    emptyTitle: 'No jobs match this search right now.',
    emptyBody: 'Try another filter, or create your profile and we will tell you when one opens.',
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
    const slides =
      Array.isArray(storedLanding.slides) && storedLanding.slides.length > 0
        ? storedLanding.slides
            .filter((slide): slide is EmployerLandingSlide => Boolean(slide && typeof slide === 'object'))
            .map((slide) => ({ src: String(slide.src ?? ''), alt: String(slide.alt ?? '') }))
            .filter((slide) => slide.src)
            .slice(0, 8)
        : DEFAULT_SETTINGS.employerLanding.slides;
    const reasons =
      Array.isArray(storedLanding.reasons) && storedLanding.reasons.length > 0
        ? storedLanding.reasons
            .filter((reason): reason is EmployerLandingReason => Boolean(reason && typeof reason === 'object'))
            .map((reason) => ({
              icon: String(reason.icon ?? 'check'),
              title: String(reason.title ?? ''),
              body: String(reason.body ?? ''),
            }))
            .filter((reason) => reason.title)
            .slice(0, 6)
        : DEFAULT_SETTINGS.employerLanding.reasons;
    const industries =
      Array.isArray(storedLanding.industries) && storedLanding.industries.length > 0
        ? storedLanding.industries
            .filter((item): item is EmployerLandingIndustry => Boolean(item && typeof item === 'object'))
            .map((item) => ({ icon: String(item.icon ?? 'briefcase'), label: String(item.label ?? '') }))
            .filter((item) => item.label)
            .slice(0, 8)
        : DEFAULT_SETTINGS.employerLanding.industries;
    const headerLinks =
      Array.isArray(storedLanding.headerLinks) && storedLanding.headerLinks.length > 0
        ? storedLanding.headerLinks
            .filter((item): item is { label: string; href: string } => Boolean(item && typeof item === 'object'))
            .map((item) => ({ label: String(item.label ?? ''), href: String(item.href ?? '') }))
            .filter((item) => item.label && item.href)
            .slice(0, 10)
        : DEFAULT_SETTINGS.employerLanding.headerLinks;
    out.employerLanding = {
      ...DEFAULT_SETTINGS.employerLanding,
      ...storedLanding,
      slides,
      reasons,
      industries,
      headerLinks,
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
  const storedReg = stored.employerRegistration as Partial<EmployerRegistrationSettings> | undefined;
  if (storedReg) {
    const stringList = (value: unknown, fallback: string[], max: number) =>
      Array.isArray(value) && value.length > 0 ? value.map(String).filter(Boolean).slice(0, max) : fallback;
    out.employerRegistration = {
      ...DEFAULT_EMPLOYER_REGISTRATION,
      ...storedReg,
      headerLinks:
        Array.isArray(storedReg.headerLinks) && storedReg.headerLinks.length > 0
          ? storedReg.headerLinks
              .filter((item): item is { label: string; href: string } => Boolean(item && typeof item === 'object'))
              .map((item) => ({ label: String(item.label ?? ''), href: String(item.href ?? '') }))
              .filter((item) => item.label && item.href)
              .slice(0, 10)
          : DEFAULT_EMPLOYER_REGISTRATION.headerLinks,
      slides:
        Array.isArray(storedReg.slides) && storedReg.slides.length > 0
          ? storedReg.slides
              .filter((slide): slide is { src: string; alt: string } => Boolean(slide && typeof slide === 'object'))
              .map((slide) => ({ src: String(slide.src ?? ''), alt: String(slide.alt ?? '') }))
              .filter((slide) => slide.src)
              .slice(0, 8)
          : DEFAULT_EMPLOYER_REGISTRATION.slides,
      highlights:
        Array.isArray(storedReg.highlights) && storedReg.highlights.length > 0
          ? storedReg.highlights
              .filter((item): item is { icon: string; label: string } => Boolean(item && typeof item === 'object'))
              .map((item) => ({ icon: String(item.icon ?? 'check'), label: String(item.label ?? '') }))
              .filter((item) => item.label)
              .slice(0, 6)
          : DEFAULT_EMPLOYER_REGISTRATION.highlights,
      howSteps:
        Array.isArray(storedReg.howSteps) && storedReg.howSteps.length > 0
          ? storedReg.howSteps
              .filter((item): item is { icon: string; title: string; body: string } => Boolean(item && typeof item === 'object'))
              .map((item) => ({
                icon: String(item.icon ?? 'check'),
                title: String(item.title ?? ''),
                body: String(item.body ?? ''),
              }))
              .filter((item) => item.title)
              .slice(0, 6)
          : DEFAULT_EMPLOYER_REGISTRATION.howSteps,
      industryOptions: stringList(storedReg.industryOptions, DEFAULT_EMPLOYER_REGISTRATION.industryOptions, 20),
      countryOptions: stringList(storedReg.countryOptions, DEFAULT_EMPLOYER_REGISTRATION.countryOptions, 20),
      companySizeOptions: stringList(storedReg.companySizeOptions, DEFAULT_EMPLOYER_REGISTRATION.companySizeOptions, 12),
      employmentOptions: stringList(storedReg.employmentOptions, DEFAULT_EMPLOYER_REGISTRATION.employmentOptions, 12),
      timelineOptions: stringList(storedReg.timelineOptions, DEFAULT_EMPLOYER_REGISTRATION.timelineOptions, 12),
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
  const storedFooter = stored.footer as Partial<FooterSettings> | undefined;
  if (storedFooter) {
    const linkList = (value: unknown, fallback: FooterLink[], max: number): FooterLink[] =>
      Array.isArray(value) && value.length > 0
        ? value
            .filter((item): item is FooterLink => Boolean(item && typeof item === 'object'))
            .map((item) => ({ label: String(item.label ?? ''), href: String(item.href ?? '') }))
            .filter((item) => item.label && item.href)
            .slice(0, max)
        : fallback;
    out.footer = {
      ...DEFAULT_SETTINGS.footer,
      ...storedFooter,
      quickLinks: linkList(storedFooter.quickLinks, DEFAULT_SETTINGS.footer.quickLinks, 10),
      companyLinks: linkList(storedFooter.companyLinks, DEFAULT_SETTINGS.footer.companyLinks, 10),
      legalLinks: linkList(storedFooter.legalLinks, DEFAULT_SETTINGS.footer.legalLinks, 8),
      /* Empty array is intentional (HTML-44 has no badges). Only fall back when missing. */
      trustBadges: Array.isArray(storedFooter.trustBadges)
        ? storedFooter.trustBadges
            .filter((item): item is FooterTrustBadge => Boolean(item && typeof item === 'object'))
            .map((item) => ({ label: String(item.label ?? ''), icon: String(item.icon ?? 'shield') }))
            .filter((item) => item.label)
            .slice(0, 6)
        : DEFAULT_SETTINGS.footer.trustBadges,
      disclaimer:
        typeof storedFooter.disclaimer === 'string'
          ? storedFooter.disclaimer
          : DEFAULT_SETTINGS.footer.disclaimer,
    };
  }
  const storedGeneral = stored.general as Partial<SiteSettings['general']> | undefined;
  if (storedGeneral?.socials && typeof storedGeneral.socials === 'object') {
    out.general.socials = {
      ...DEFAULT_SETTINGS.general.socials,
      ...storedGeneral.socials,
      tiktok: String((storedGeneral.socials as { tiktok?: string }).tiktok ?? out.general.socials.tiktok ?? ''),
    };
  }

  /* Strip mockup leftovers (150+, 1,200+, 98%) from older Settings rows. */
  const scrubMock = (value: string) =>
    /1,?200|150\+|60\+|98%|20\+|30[–-]45/i.test(value.trim()) ? '' : value;
  out.jobsBoard.statsVacanciesValue = scrubMock(out.jobsBoard.statsVacanciesValue);
  out.jobsBoard.statsEmployersValue = scrubMock(out.jobsBoard.statsEmployersValue);
  out.jobsBoard.statsPlacedValue = scrubMock(out.jobsBoard.statsPlacedValue);
  out.jobsBoard.resultsHeading = out.jobsBoard.resultsHeading.replace('{count}+', '{count}');
  out.employerLanding.statsCandidatesValue = scrubMock(out.employerLanding.statsCandidatesValue);
  out.employerLanding.statsIndustriesValue = scrubMock(out.employerLanding.statsIndustriesValue);
  out.employerLanding.statsPlacedValue = scrubMock(out.employerLanding.statsPlacedValue);
  out.employerLanding.hiringTimeValue = scrubMock(out.employerLanding.hiringTimeValue);
  if (/^create my free profile$/i.test(out.navigation.headerCta.label.trim())) {
    out.navigation.headerCta = {
      ...out.navigation.headerCta,
      label: DEFAULT_SETTINGS.navigation.headerCta.label,
      labels: DEFAULT_SETTINGS.navigation.headerCta.labels,
    };
  }
  out.navigation.items = out.navigation.items
    .filter((item) => !/^\/faq\/?$/i.test(item.href))
    .map((item) =>
      item.href === '/employers' && /^employers$/i.test(item.label.trim())
        ? { ...item, label: 'For Employers', labelHi: 'नियोक्ताओं के लिए', labelAr: 'لأصحاب العمل' }
        : item,
    );

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
