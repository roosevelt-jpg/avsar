import { makeBlocks, type DefaultPage } from './make';

export const FAQ: DefaultPage = {
  slug: 'faq',
  path: '/faq',
  title: 'FAQ',
  purpose: 'Every common question in one place. Link to it from WhatsApp replies.',
  seo: {
    title: 'Frequently asked questions · Jobs in Portugal from India',
    description: 'Answers about applying, fees, the assessment, interviews, visas, salaries and safety.',
  },
  blocks: makeBlocks('faq', [
    [
      'hero',
      {
        eyebrow: 'FAQ',
        title: 'Questions, answered plainly.',
        subtitle: 'If your question is not here, message us on WhatsApp at {{whatsapp}} or email {{support_email}}.',
        primaryCta: { label: 'See open jobs', href: '/jobs' },
        secondaryCta: { label: '', href: '' },
        highlights: [],
        mediaType: 'none',
        mediaSrc: '',
        mediaPoster: '',
        mediaAlt: '',
        stats: [],
      },
    ],
    [
      'faq',
      {
        eyebrow: 'Applying',
        title: 'Applying',
        intro: '',
        items: [
          { question: 'Who can apply?', answer: 'Anyone with experience in one of the roles we recruit for and a valid passport, or who can get one. Each job lists the experience and English level the employer needs.' },
          { question: 'Do I need a CV?', answer: 'Not to apply. You can add your CV from your dashboard at any time, and it helps the employer understand your experience.' },
          { question: 'Can I apply to more than one job?', answer: 'Yes. Apply to every job that fits you. Your dashboard tracks each one separately.' },
          { question: 'How do I know what is happening with my application?', answer: 'Sign in and open **My applications**. Each one shows its stage, what it means and what happens next. We also email you when it moves.' },
        ],
      },
    ],
    [
      'faq',
      {
        eyebrow: 'Money',
        title: 'Fees and payments',
        intro: '',
        items: [
          { question: 'Is applying free?', answer: 'Yes, always.' },
          { question: 'Do I pay a placement fee if I am hired?', answer: 'No. The employer pays our fee. If anyone asks you to pay for a job offer, a visa "slot" or "processing", it is not us. [Report it](/stay-safe).' },
          { question: 'What is the assessment fee?', answer: 'The skills and English assessment report costs {{fee_inr}}. It is optional. You can take the assessment and see your score for free, and pay only if you want the full report and career pack.' },
          { question: 'How can I pay?', answer: 'UPI (Google Pay, PhonePe, Paytm, BHIM), RuPay and other Indian debit and credit cards, and Indian net banking, all on this website through a licensed payment provider. You get a receipt by email.' },
          { question: 'Can I get a refund?', answer: 'A full refund if you cancel before you start the assessment. See the [refund policy](/refund-policy).' },
        ],
      },
    ],
    [
      'faq',
      {
        eyebrow: 'Selection',
        title: 'Assessment, interviews and offers',
        intro: '',
        items: [
          { question: 'What is in the assessment?', answer: 'Questions about the work itself, your experience, and your English, in sections you can pause between. It takes about 90 minutes in total on your phone.' },
          { question: 'Is a job guaranteed?', answer: 'No. Employers choose who they hire. About {{hire_rate}} in every 100 applicants receive an offer. We publish this so you can decide with honest information.' },
          { question: 'How are interviews done?', answer: 'By video call, usually on WhatsApp, Google Meet or Zoom. We tell you the time in Indian time and how to prepare.' },
          { question: 'How long until I hear back?', answer: 'Within {{response_days}} days of applying you get an answer, yes or no.' },
        ],
      },
    ],
    [
      'faq',
      {
        eyebrow: 'Moving',
        title: 'Visa, travel and life in Portugal',
        intro: '',
        items: [
          { question: 'Who handles my visa?', answer: 'You apply, and we prepare the file with you: checklist, document checks, appointment booking and tracking. See [visa and relocation](/visa-and-relocation).' },
          { question: 'Is housing included?', answer: 'Each job says so: provided by the employer, arranged with our help, or not included.' },
          { question: 'Do I need to speak Portuguese?', answer: 'Not for most of our jobs. Basic English is usually enough to start, and learning Portuguese helps you grow.' },
        ],
      },
    ],
    [
      'contact_cards',
      { eyebrow: 'Still unsure?', title: 'Talk to a person', intro: 'Our team answers in the language of this page.' },
    ],
  ]),
};
