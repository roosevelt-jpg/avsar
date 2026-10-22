import { makeBlocks, type DefaultPage } from './make';

/**
 * The page a candidate sends to the person who pays.
 *
 * In this move that person is often a parent or a spouse, and they decide on
 * WhatsApp before anyone opens an account. The page has no form. Prices come
 * from Settings, and it does not promise a job or a visa.
 */
export const FOR_YOUR_FAMILY: DefaultPage = {
  slug: 'for-your-family',
  path: '/for-your-family',
  title: 'For your family',
  purpose: 'A page to forward on WhatsApp to the person who pays. No account. Says what is free, the two prices, and what is not for sale.',
  seo: {
    title: 'For the person who pays',
    description: 'What is free, what the two reports cost, and what we never sell. Send this page before anyone pays.',
  },
  blocks: makeBlocks('family', [
    [
      'hero',
      {
        eyebrow: 'Before anyone pays',
        title: 'Read this before money leaves your family',
        subtitle:
          'Joining, the rewritten CV, the test and the score are free. The only charges are two reports, paid on this website. A job and a visa are not for sale.',
        primaryCta: { label: 'Create a free account', href: '/signup' },
        secondaryCta: { label: 'Send this page on WhatsApp', href: '#send' },
        highlights: [],
        mediaType: 'none',
        mediaSrc: '',
        mediaPoster: '',
        mediaAlt: '',
        stats: [],
      },
    ],
    [
      'notice',
      {
        tone: 'warning',
        title: 'The only money we take',
        body: 'The skills report is {{skills_fee}}. The visa-requirements list is {{visa_fee}}. Both together are {{bundle_fee}}. The employer pays the placement fee. We never ask for money on WhatsApp, by bank transfer, or in cash.',
      },
    ],
    [
      'features',
      {
        eyebrow: 'What this is',
        title: 'Four things to know',
        intro: '',
        columns: '2',
        items: [
          {
            icon: 'check',
            title: 'Most of the path is free',
            body: 'The account, the CV, the test, the score and applying cost nothing.',
          },
          {
            icon: 'document',
            title: 'Two reports, if you want them',
            body: 'A skills PDF and a list of visa documents. Buying them does not change who is shortlisted.',
          },
          {
            icon: 'rupee',
            title: 'The employer pays us',
            body: 'The placement fee is never charged to the candidate.',
          },
          {
            icon: 'shield',
            title: 'No job and no visa for sale',
            body: 'An offer comes only after interviews. A visa is decided by the authorities, not by us.',
          },
        ],
      },
    ],
    [
      'rich_text',
      {
        eyebrow: 'In one minute',
        title: 'The same words, written down',
        body: 'You pay only for these two papers, and only on this website. The job is not for sale. The visa is not for sale. If someone asks your family for more money on WhatsApp, it is not us.',
        width: 'narrow',
      },
    ],
  ]),
};
