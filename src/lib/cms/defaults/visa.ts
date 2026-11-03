import { BRAND_SLIDES, INTRO_FILM, slidesWithCaptions } from '@/lib/cms/brand-media';
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
        title: 'Your visa and relocation journey to Portugal',
        accentWord: 'Portugal',
        subtitle:
          'Once you accept an offer, the independent immigration lawyers we work with prepare your file with you: a checklist, a check of every document, your appointment, and tracking until you land. Once you are selected, the visa costs are on us.',
        primaryCta: { label: 'See open jobs', href: '/jobs' },
        secondaryCta: { label: 'Ask about your case', href: 'https://wa.me/{{whatsapp_digits}}' },
        badgeLabel: 'After a successful offer',
        badgeHref: '/visa-and-relocation',
        filmUrl: INTRO_FILM.url,
        filmLabel: INTRO_FILM.label,
        highlights: [
          'Visa fee, police certificate and flight covered once selected',
          'Documents checked by lawyers before submission',
          'Housing, meals and help on arrival',
        ],
        mediaType: 'image',
        mediaSrc: '/photos/selected/visa.jpg',
        mediaPoster: INTRO_FILM.poster,
        mediaAlt: 'Visa and travel documents',
        slides: slidesWithCaptions(BRAND_SLIDES.visa),
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
        layout: 'timeline',
        sideImage: '',
        sideImageAlt: '',
        items: [
          {
            title: 'Signed contract or job offer',
            body: 'Your Portuguese employer issues the employment contract or a binding promise of employment. This is the basis of the work visa.',
            meta: 'Week 1',
            image: '/photos/selected/contract.jpg',
          },
          {
            title: 'Gather your documents',
            body: 'Passport valid well beyond your stay, photographs, police clearance certificate from Passport Seva, travel insurance, proof of accommodation and the employer documents. We send you the exact list and check each one.',
            meta: 'Weeks 1 to 4',
            image: '/photos/documents.jpg',
          },
          {
            title: 'Visa centre appointment',
            body: 'You submit your application and give biometrics at the visa application centre for Portugal in India. We book the slot with you and tell you what to bring.',
            meta: 'Weeks 4 to 6',
            image: '/photos/selected/visa.jpg',
          },
          {
            title: 'Decision and visa',
            body: 'The embassy decides. Processing times vary; we track it and keep your dashboard updated. The visa lets you enter Portugal to start work.',
            meta: 'Usually 1 to 3 months',
            image: '/photos/steps/visa.jpg',
          },
          {
            title: 'Travel and arrival',
            body: 'We confirm your travel date with the employer, share arrival instructions and make sure someone expects you.',
            meta: 'Arrival',
            image: '/photos/selected/flight.jpg',
          },
          {
            title: 'Residence permit',
            body: 'After arrival you attend an appointment with AIMA, the Portuguese immigration agency, to receive your residence permit. We help you prepare and attend.',
            meta: 'First months',
            image: '/photos/steps/arrival.jpg',
          },
        ],
      },
    ],
    [
      'video',
      {
        eyebrow: 'Watch',
        title: 'How the move works, in under a minute',
        intro: 'The same film as on signup. Admins can replace the file or paste a YouTube link in the CMS.',
        src: INTRO_FILM.url,
        poster: INTRO_FILM.poster,
        caption: INTRO_FILM.label,
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
          { icon: 'home', title: 'Housing and meals', body: 'Included with the job. The posting gives the details.' },
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
          {
            question: 'Who pays for the visa?',
            answer:
              'Once you are selected, we pay the visa fee, the police clearance certificate, immigration fees and taxes, and your flight. Before selection, getting a passport is your own cost.',
          },
          {
            question: 'Can my family come with me?',
            answer:
              'Family reunification is possible once you hold a residence permit. Timing and documents depend on your case; your recruiter and the lawyers explain what applies to you.',
          },
          {
            question: 'How long does the visa take?',
            answer:
              'Often one to three months after biometrics, sometimes longer. We track the file and update your dashboard. We do not invent a guaranteed date.',
          },
        ],
      },
    ],
    [
      'cta',
      {
        title: 'Start with a free profile',
        body: 'Visa work begins after a successful offer. Applying and the skills test are free.',
        primary: { label: 'Create free profile', href: '/signup' },
        secondary: { label: 'See open jobs', href: '/jobs' },
      },
    ],
  ]),
};
