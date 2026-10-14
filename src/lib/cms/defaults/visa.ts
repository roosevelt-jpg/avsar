import { makeBlocks, type DefaultPage } from './make';

export const VISA: DefaultPage = {
  slug: 'visa-and-relocation',
  path: '/visa-and-relocation',
  title: 'Visa and relocation',
  purpose: 'The visa process and arrival in Portugal. Reduces the biggest worry candidates have.',
  seo: {
    title: 'Portugal work visa from India · Documents, steps and timings',
    description:
      'How the Portuguese work visa works for Indian citizens: the documents, the visa centre appointment, timings, residence permit, and what we do for you at each step.',
  },
  blocks: makeBlocks('visa', [
    [
      'hero',
      {
        eyebrow: 'Visa and relocation',
        title: 'We prepare your visa file with you. Step by step.',
        subtitle:
          'Once you accept an offer, your recruiter gives you a checklist, checks every document, books your appointment and tracks your application until you land.',
        primaryCta: { label: 'See open jobs', href: '/jobs' },
        secondaryCta: { label: 'Ask about your case', href: 'https://wa.me/{{whatsapp_digits}}' },
        highlights: ['No visa processing fee charged by us', 'Your documents checked before submission', 'Help on arrival'],
        mediaType: 'image',
        mediaSrc: '/walkthrough/documents.jpg',
        mediaPoster: '',
        mediaAlt: 'Documents laid out on a table',
        stats: [],
      },
    ],
    [
      'notice',
      {
        tone: 'info',
        title: 'Rules change. Your recruiter confirms the current list.',
        body:
          'This page explains how the process generally works for Indian citizens taking a job in Portugal. Requirements and timings are set by the Portuguese authorities and can change. Before you submit anything, your recruiter confirms the current checklist for your case.',
      },
    ],
    [
      'steps',
      {
        eyebrow: 'The process',
        title: 'From signed contract to residence permit',
        intro: '',
        items: [
          { title: 'Signed contract or job offer', body: 'Your Portuguese employer issues the employment contract or a binding promise of employment. This is the basis of the work visa.', meta: 'Week 1', image: '' },
          { title: 'Gather your documents', body: 'Passport valid well beyond your stay, photographs, police clearance certificate from Passport Seva, travel insurance, proof of accommodation and the employer documents. We send you the exact list and check each one.', meta: 'Weeks 1 to 4', image: '' },
          { title: 'Visa centre appointment', body: 'You submit your application and give biometrics at the visa application centre for Portugal in India. We book the slot with you and tell you what to bring.', meta: 'Weeks 4 to 6', image: '' },
          { title: 'Decision and visa', body: 'The embassy decides. Processing times vary; we track it and keep your dashboard updated. The visa lets you enter Portugal to start work.', meta: 'Usually 1 to 3 months', image: '' },
          { title: 'Travel and arrival', body: 'We confirm your travel date with the employer, share arrival instructions and make sure someone expects you.', meta: 'Arrival', image: '' },
          { title: 'Residence permit', body: 'After arrival you attend an appointment with AIMA, the Portuguese immigration agency, to receive your residence permit. We help you prepare and attend.', meta: 'First months', image: '' },
        ],
      },
    ],
    [
      'features',
      {
        eyebrow: 'Settling in',
        title: 'Your first weeks in Portugal',
        intro: 'The paperwork every new resident needs, done with you rather than left to you.',
        columns: '4',
        items: [
          { icon: 'document', title: 'Tax number (NIF)', body: 'Needed for your contract, bank and rent.' },
          { icon: 'rupee', title: 'Bank account', body: 'So your salary arrives safely from the first month.' },
          { icon: 'shield', title: 'Social security (NISS)', body: 'Your entitlements, recorded from day one.' },
          { icon: 'heart', title: 'Health number (SNS)', body: 'Register at your local health centre.' },
          { icon: 'home', title: 'Accommodation', body: 'Provided by the employer or arranged with you, as the job states.' },
          { icon: 'phone', title: 'Phone and SIM', body: 'A Portuguese number for work and WhatsApp.' },
          { icon: 'graduation', title: 'Portuguese lessons', body: 'Free public courses and employer classes.' },
          { icon: 'users', title: 'Community', body: 'Introductions to the Indian community near you.' },
        ],
      },
    ],
    [
      'faq',
      {
        eyebrow: 'Visa questions',
        title: 'What candidates ask us most',
        intro: '',
        items: [
          { question: 'Do I pay you for the visa?', answer: 'No. We do not charge any visa processing or placement fee. You pay the official visa fee and the visa centre’s service charge directly to them, with an official receipt.' },
          { question: 'What if my visa is refused?', answer: 'Your recruiter reviews the reason with you and, where it is possible, prepares a new application. A refusal is why we check every document before you submit.' },
          { question: 'Do I need a police clearance certificate?', answer: 'Yes. Apply for one through Passport Seva early, because it can take a few weeks.' },
          { question: 'Can my family come with me?', answer: 'Not on the same visa. Once you hold a residence permit you can apply for family reunification. We will advise you on current rules when you are ready.' },
        ],
      },
    ],
    [
      'cta',
      {
        title: 'Questions about your own situation?',
        body: 'Message our team on WhatsApp. A recruiter replies within one working day.',
        primary: { label: 'WhatsApp us', href: 'https://wa.me/{{whatsapp_digits}}' },
        secondary: { label: 'Browse jobs', href: '/jobs' },
        tone: 'light',
      },
    ],
  ]),
};
