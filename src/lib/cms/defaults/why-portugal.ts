import { makeBlocks, type DefaultPage } from './make';

export const WHY_PORTUGAL: DefaultPage = {
  slug: 'why-portugal',
  path: '/why-portugal',
  title: 'Why Portugal',
  purpose: 'Life and work in Portugal, for candidates comparing it with the Gulf, the UK or Canada.',
  seo: {
    title: 'Why work in Portugal · Salary, rights and life for Indian workers',
    description:
      'What working in Portugal really means: contracts, 14 salary payments a year, paid leave, healthcare, the cost of living, and the Indian community already there.',
  },
  blocks: makeBlocks('why', [
    [
      'hero',
      {
        eyebrow: 'Why Portugal',
        title: 'A European job, with European rights.',
        subtitle:
          'Portugal is one of the safest countries in Europe, with a growing economy, a large and welcoming Indian community, and employers who need skilled people now.',
        primaryCta: { label: 'See jobs in Portugal', href: '/jobs' },
        secondaryCta: { label: 'Visa and relocation', href: '/visa-and-relocation' },
        highlights: [],
        mediaType: 'image',
        mediaSrc: '/lisbon-rooftops-1200.jpg',
        mediaPoster: '',
        mediaAlt: 'Lisbon rooftops and the river Tagus',
        stats: [],
      },
    ],
    [
      'features',
      {
        eyebrow: 'Your rights at work',
        title: 'What every worker in Portugal is entitled to',
        intro: 'These come from Portuguese labour law, not from a favour by the employer. They apply to you from your first day.',
        columns: '3',
        items: [
          { icon: 'rupee', title: '14 salary payments a year', body: 'Twelve monthly salaries plus a holiday payment and a Christmas payment, by law.' },
          { icon: 'clock', title: '40-hour week', body: 'A normal working week is 40 hours. Overtime is limited and paid at a higher rate.' },
          { icon: 'star', title: '22 days paid holiday', body: 'At least 22 working days of paid annual leave, plus public holidays.' },
          { icon: 'heart', title: 'Public healthcare', body: 'Once registered, you use the national health service (SNS) like any resident.' },
          { icon: 'shield', title: 'Social security', body: 'Contributions build your entitlement to sick pay, parental leave, unemployment support and a pension.' },
          { icon: 'document', title: 'A written contract', body: 'Your terms are written down in a contract you read before you sign, in a language you understand.' },
        ],
      },
    ],
    [
      'split',
      {
        eyebrow: 'Life in Portugal',
        title: 'Safe, sunny, and already home to thousands of Indians',
        body:
          'Portugal has a mild climate, a relaxed pace of life and consistently ranks among the safest countries in the world. Lisbon has Indian grocery shops, restaurants, temples and gurdwaras, and a community from Kerala, Punjab, Gujarat and Goa that has been there for decades.\n\nRent is the largest cost, especially in Lisbon. That is why jobs through us include housing and meals, so more of your salary is yours to keep.',
        bullets: [
          'Direct flights and one-stop connections to Delhi, Mumbai and Kochi',
          'English widely spoken in cities and in hospitality',
          'A residence permit lets you travel across the Schengen area',
          'Family reunification is possible once you hold a residence permit',
        ],
        cta: { label: 'Visa and residence explained', href: '/visa-and-relocation' },
        image: '/kitchen-work-1400.jpg',
        imageAlt: 'A professional kitchen in Portugal',
        imageSide: 'left',
      },
    ],
    [
      'faq',
      {
        eyebrow: 'Common questions',
        title: 'Portugal compared',
        intro: '',
        items: [
          {
            question: 'How does Portugal compare with the Gulf?',
            answer:
              'Gulf salaries can look higher on paper, but in Portugal you have a European contract, 14 payments a year, healthcare, social security, the right to change employer under the law, and a residence permit that can lead to long-term residence and bringing your family.',
          },
          {
            question: 'Will I earn enough to send money home?',
            answer:
              'It depends on the job and on how you live. Housing and meals are included with jobs through us, which leaves much more to save. Every posting shows the salary range, so you can compare before you apply.',
          },
          {
            question: 'Can I bring my family later?',
            answer:
              'Holders of a Portuguese residence permit can apply for family reunification. The rules and timings are set by the government and do change, so your recruiter will give you current advice when you are ready.',
          },
        ],
      },
    ],
    [
      'cta',
      {
        title: 'See what is open in Lisbon, Porto and the Algarve.',
        body: '',
        primary: { label: 'Browse jobs', href: '/jobs' },
        secondary: { label: '', href: '' },
      },
    ],
  ]),
};
