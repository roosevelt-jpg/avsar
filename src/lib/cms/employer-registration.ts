/**
 * Settings for /employers/register — the multi-step employer enquiry mockup.
 * Kept beside the employer landing so Conversion settings stay readable.
 */

export type EmployerRegSlide = { src: string; alt: string };
export type EmployerRegHighlight = { icon: string; label: string };
export type EmployerRegStep = { icon: string; title: string; body: string };

export type EmployerRegistrationSettings = {
  headerLinks: { label: string; href: string }[];
  headerCtaLabel: string;
  headerCtaHref: string;
  eyebrow: string;
  headline: string;
  intro: string;
  slides: EmployerRegSlide[];
  highlights: EmployerRegHighlight[];
  howTitle: string;
  howSteps: EmployerRegStep[];
  /** Empty quote hides the card — never invent a testimonial. */
  quote: string;
  quoteAttribution: string;
  quoteImage: string;
  quoteImageAlt: string;
  formTitle: string;
  formIntro: string;
  step1Label: string;
  step2Label: string;
  step3Label: string;
  companySectionTitle: string;
  contactSectionTitle: string;
  companyNameLabel: string;
  companyNamePlaceholder: string;
  industryLabel: string;
  countryLabel: string;
  cityLabel: string;
  cityPlaceholder: string;
  websiteLabel: string;
  websitePlaceholder: string;
  companySizeLabel: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  jobTitleLabel: string;
  jobTitlePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  industryOptions: string[];
  countryOptions: string[];
  companySizeOptions: string[];
  roleTitleLabel: string;
  roleTitlePlaceholder: string;
  openingsLabel: string;
  openingsPlaceholder: string;
  roleCityLabel: string;
  roleCityPlaceholder: string;
  employmentLabel: string;
  timelineLabel: string;
  notesLabel: string;
  notesPlaceholder: string;
  employmentOptions: string[];
  timelineOptions: string[];
  continueToHiring: string;
  continueToReview: string;
  backLabel: string;
  submitLabel: string;
  bookConsultationLabel: string;
  bookConsultationHref: string;
  privacyNote: string;
  successTitle: string;
  successBody: string;
  hiringSectionTitle: string;
  reviewSectionTitle: string;
};

export const DEFAULT_EMPLOYER_REGISTRATION: EmployerRegistrationSettings = {
  headerLinks: [
    { label: 'Home', href: '/' },
    { label: 'Jobs', href: '/jobs' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Why Portugal', href: '/why-portugal' },
    { label: 'Visa & Relocation', href: '/visa-and-relocation' },
    { label: 'For Employers', href: '/employers' },
  ],
  headerCtaLabel: 'Hire Talent',
  headerCtaHref: '/employers/register',
  eyebrow: 'EMPLOYER REGISTRATION',
  headline: 'Submit Your Hiring Requirements',
  intro:
    'Tell us the roles you need, and we’ll deliver a pre-screened shortlist of qualified candidates from India, with full recruitment and relocation support to Portugal.',
  slides: [
    { src: '/photos/brand/employer-handshake.jpg', alt: 'Handshake after agreeing a hiring brief' },
    { src: '/kitchen-work-1400.jpg', alt: 'Kitchen team preparing food in a working restaurant kitchen' },
    { src: '/photos/brand/hero-construction.jpg', alt: 'Construction crew on a Portuguese site' },
    { src: '/photos/brand/dash-banner.jpg', alt: 'Porto Ribeira waterfront on the Douro' },
  ],
  highlights: [
    { icon: 'users', label: 'Pre-Screened Talent' },
    { icon: 'shield', label: 'Visa & Compliance Support' },
    { icon: 'bolt', label: 'Fast & Reliable Hiring' },
  ],
  howTitle: 'How It Works for Employers',
  howSteps: [
    { icon: 'document', title: 'Submit Your Requirements', body: 'Share your hiring needs, roles, and timelines.' },
    { icon: 'users', title: 'Get a Curated Shortlist', body: 'Receive pre-screened and verified candidates.' },
    { icon: 'calendar', title: 'Interview & Select', body: 'Meet shortlisted candidates and make your choice.' },
    { icon: 'plane', title: 'We Handle the Rest', body: 'Visa, documentation, travel and onboarding support.' },
  ],
  // Shell copy from the employer-registration mockup (editable in Settings).
  quote: 'S&A Recruitment helped us hire skilled and reliable staff from India quickly and professionally.',
  quoteAttribution: 'Operations Director, Hospitality Group, Portugal',
  quoteImage: '/lisbon-rooftops-1200.jpg',
  quoteImageAlt: 'Lisbon rooftops looking toward the Tagus and the 25 de Abril Bridge',
  formTitle: 'Hire Talent – Employer Enquiry',
  formIntro: 'Complete the form below and our team will contact you within 1 business day.',
  step1Label: 'Company Details',
  step2Label: 'Hiring Requirements',
  step3Label: 'Review & Submit',
  companySectionTitle: 'Company Information',
  contactSectionTitle: 'Your Contact Details',
  companyNameLabel: 'Company Name',
  companyNamePlaceholder: 'e.g. Atlantic Hospitality Lda',
  industryLabel: 'Industry',
  countryLabel: 'Country',
  cityLabel: 'City',
  cityPlaceholder: 'e.g. Lisbon, Porto, Braga',
  websiteLabel: 'Company Website (Optional)',
  websitePlaceholder: 'https://',
  companySizeLabel: 'Company Size',
  fullNameLabel: 'Full Name',
  fullNamePlaceholder: 'e.g. João Mendes',
  jobTitleLabel: 'Job Title',
  jobTitlePlaceholder: 'e.g. HR Manager',
  emailLabel: 'Email Address',
  emailPlaceholder: 'e.g. joao@company.pt',
  phoneLabel: 'Phone Number',
  phonePlaceholder: '912 345 678',
  industryOptions: [
    'Hospitality & Tourism',
    'Construction & Trades',
    'Logistics & Warehouse',
    'Healthcare & Caregiving',
    'Manufacturing & Production',
    'IT & Technology',
    'Other',
  ],
  countryOptions: ['Portugal', 'United Arab Emirates', 'India', 'Other'],
  companySizeOptions: ['1–10', '11–50', '51–200', '201–500', '500+'],
  roleTitleLabel: 'Role you need',
  roleTitlePlaceholder: 'e.g. Restaurant service staff',
  openingsLabel: 'How many people',
  openingsPlaceholder: 'e.g. 5',
  roleCityLabel: 'Where in Portugal',
  roleCityPlaceholder: 'e.g. Lisbon, Porto',
  employmentLabel: 'Employment type',
  timelineLabel: 'When do you need them',
  notesLabel: 'Anything else we should know',
  notesPlaceholder: 'Housing, language, start date, shift pattern…',
  employmentOptions: ['Full-time', 'Contract', 'Seasonal'],
  timelineOptions: ['As soon as possible', 'Within 30 days', 'Within 60 days', 'Within 90 days', 'Flexible'],
  continueToHiring: 'Continue to Hiring Requirements',
  continueToReview: 'Continue to Review',
  backLabel: 'Back',
  submitLabel: 'Submit enquiry',
  bookConsultationLabel: 'Or Book a Consultation',
  bookConsultationHref: '/employers#contact',
  privacyNote: 'Your information is secure and will only be used for recruitment purposes.',
  successTitle: 'Thank you. We have your enquiry.',
  successBody: 'A recruiter will contact you within one business day to go through the roles.',
  hiringSectionTitle: 'Hiring Requirements',
  reviewSectionTitle: 'Review & Submit',
};
