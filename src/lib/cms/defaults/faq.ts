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
          { question: 'Is applying free?', answer: 'Yes, always. So are the rewritten CV, the skills test, your score and joining our recruitment database.' },
          { question: 'Do I pay a placement fee if I am hired?', answer: 'No. The employer pays our fee. If anyone asks you to pay for a job offer, a visa "slot" or "processing", it is not us. [Report it](/stay-safe).' },
          { question: 'What can I pay for?', answer: 'Two documents, and only if you want them. The skills report PDF is {{skills_fee}}. The visa-requirements list, document by document, is {{visa_fee}}. Both together are {{bundle_fee}} instead of {{fee_inr}}. The account, the rewritten CV, the test, the score and applying are free. Buying either does not change the shortlist, and neither is a job or a visa.' },
          { question: 'How can I pay?', answer: 'On this website only, with a receipt by email. When UPI is available (EximPe or another Indian rail), you can pay by UPI, RuPay or net banking. Card is also offered. Never cash, never WhatsApp, never an agent. If you only see card and it is declined, turn on international online payments in your bank app and try again.' },
          { question: 'Can I get a refund?', answer: 'Yes, in full within 14 days if you have not yet downloaded the document you paid for. Downloading the free CV does not affect the refund. See the [refund policy](/refund-policy).' },
          { question: 'Who pays for the flight, visa and police certificate?', answer: 'We do, once you are selected: your flight, the visa fee, the police clearance certificate, immigration fees and taxes, and legal advice. Before selection, getting a passport is your own cost.' },
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
          { question: 'What is in the assessment?', answer: 'Questions about the work itself, your experience, and your English, in sections you can pause between. It takes up to 90 minutes in total on your phone, and it is free.' },
          { question: 'How do I get on the shortlist?', answer: 'Score above {{shortlist_score}} out of 10 in the assessment and meet the essential requirements of the role. Buying a report plays no part.' },
          { question: 'Is a job guaranteed?', answer: 'No. Hiring depends on the vacancies open, the interview and the required checks, and visa decisions are made only by the authorities. Historically, about {{shortlist_hired}} of every {{shortlist_size}} shortlisted candidates have been hired. That is out of those shortlisted, not everyone who applies, and past results are not a promise. See the [selection rules](/selection-rules).' },
          { question: 'How are interviews done?', answer: 'On Zoom. We tell you the time in Indian time and how to prepare.' },
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
          { question: 'Who handles my visa?', answer: 'The independent immigration lawyers we work with prepare your visa file with you: checklist, document checks, appointment booking and tracking. Once you are selected, we pay the fees. See [visa and relocation](/visa-and-relocation).' },
          { question: 'Is housing included?', answer: 'Yes. Jobs through us include housing and meals. Each job posting confirms the details.' },
          { question: 'How long is the contract?', answer: '{{contract_years}} years, with a Portuguese employment contract and the same rights as a Portuguese worker.' },
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
