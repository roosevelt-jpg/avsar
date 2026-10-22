/**
 * Interface labels on the public site that are not page content, translated
 * through the same copy files as the pages (siteText). Listed here so the
 * translation coverage test can check every one of them.
 */
export const FOOTER_LABELS = {
  explore: 'Explore',
  getStarted: 'Get started',
  createProfile: 'Create a free profile',
  signIn: 'Sign in',
  pricing: 'Report prices',
  hire: 'Hire from India',
  helpSafety: 'Help and safety',
  staySafe: 'Stay safe from fraud',
  forYourFamily: 'For your family',
  company: 'Company',
  about: 'About us',
  contact: 'Contact',
  whatsapp: 'Talk to us on WhatsApp',
  subscribeTitle: 'New jobs by email',
  subscribeNote: 'We write when new jobs open. No spam, and you can unsubscribe at any time.',
  subscribePlaceholder: 'Your email',
  subscribeButton: 'Subscribe',
  subscribeDone: 'Thank you. You are on the list.',
  subscribeError: 'That did not work. Check the address and try again.',
} as const;

/**
 * The WhatsApp window. The English sentence is the lookup key, so a Hindi
 * page shows the Hindi line and the draft message on WhatsApp is Hindi too.
 */
export const WHATSAPP_LABELS = {
  title: '{{company}} on WhatsApp',
  intro: 'Ask here. Answers use our company notes only. If the notes do not cover it, this window says so. A person still replies on WhatsApp during office hours.',
  ask: 'Your question',
  send: 'Send',
  fromNotes: 'From the notes',
  close: 'Close',
  allDesks: 'All desks',
  continue: 'Continue on WhatsApp',
  jobsTitle: 'Jobs',
  jobsBody: 'Open roles, the free test, and how to apply from your phone.',
  jobsText: 'Hello, I have a question about jobs in Portugal.',
  visaTitle: 'Visa and relocation',
  visaBody: 'Documents, the visa file, and what happens after an offer.',
  visaText: 'Hello, I have a question about the visa and relocation.',
  payTitle: 'Payments',
  payBody: 'The skills report and the visa-requirements list. Payment happens on this website only, never in this chat.',
  payText: 'Hello, I have a question about the two reports. I know payment is only on the website.',
} as const;
