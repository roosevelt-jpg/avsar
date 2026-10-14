import { makeBlocks, type DefaultPage } from './make';

export const STAY_SAFE: DefaultPage = {
  slug: 'stay-safe',
  path: '/stay-safe',
  title: 'Stay safe from recruitment fraud',
  purpose: 'Fraud awareness. Linked from the announcement bar; builds trust with cautious candidates and families.',
  seo: {
    title: 'Stay safe from fake overseas job offers',
    description: 'How to recognise fake recruiters and job offers for Portugal, what we will never ask you for, and how to report fraud.',
  },
  blocks: makeBlocks('safe', [
    [
      'hero',
      {
        eyebrow: 'Your safety',
        title: 'Fake job offers are common. Here is how to spot them.',
        subtitle:
          'People use the names of real recruiters to take money from job seekers. These are the rules we always follow, so you can tell us apart from anyone pretending to be us.',
        primaryCta: { label: 'Report a suspicious offer', href: 'mailto:{{support_email}}?subject=Suspicious%20offer' },
        secondaryCta: { label: 'See real open jobs', href: '/jobs' },
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
        title: 'We will never ask you for money outside this website',
        body:
          'Not on WhatsApp, not by bank transfer to a personal account, not in cash, and not through an "agent". The only payment we take is the optional assessment fee of {{fee_inr}}, on this website, with a receipt.',
      },
    ],
    [
      'features',
      {
        eyebrow: 'What we never do',
        title: 'If someone does any of these, it is not us',
        intro: '',
        columns: '2',
        items: [
          { icon: 'rupee', title: 'Charge a placement or "job confirmation" fee', body: 'The employer pays our fee. You never pay to be hired.' },
          { icon: 'document', title: 'Sell visa "slots" or guaranteed visas', body: 'Nobody can guarantee a visa. Only the embassy decides.' },
          { icon: 'chat', title: 'Offer a job without an application', body: 'Every candidate applies on this website and is assessed. There are no shortcuts.' },
          { icon: 'shield', title: 'Ask for your passport to be sent to us', body: 'You keep your passport. You only hand it in at the official visa centre.' },
          { icon: 'phone', title: 'Contact you from unknown numbers asking for urgent payment', body: 'Our official number is {{support_phone}}. Check it here every time.' },
          { icon: 'globe', title: 'Use any website other than this one', body: 'Job postings, applications and payments happen only here.' },
        ],
      },
    ],
    [
      'rich_text',
      {
        eyebrow: 'Check any recruiter',
        title: 'Before you trust any overseas job offer',
        body:
          '- **Check the agent is registered.** Recruiting agents for jobs abroad must be registered with the Government of India. Ask for the registration number and check it on the official eMigrate portal, emigrate.gov.in.\n- **Read the contract before paying anything.** A real employer gives you a written contract with salary, hours and the employer’s name.\n- **Never pay into a personal bank account or UPI ID.** Real companies take payment through their own website or a licensed payment gateway, and give you a receipt.\n- **Be careful with "too good" offers.** Very high salaries for little experience, no interview, or pressure to pay today are warning signs.\n- **Talk to your family.** Fraudsters rush people. Take your time.',
        width: 'narrow',
      },
    ],
    [
      'cta',
      {
        title: 'Received a suspicious message using our name?',
        body: 'Tell us. Reports can be anonymous. It helps us warn other candidates and act against the people responsible.',
        primary: { label: 'Report by email', href: 'mailto:{{support_email}}?subject=Fraud%20report' },
        secondary: { label: 'Report on WhatsApp', href: 'https://wa.me/{{whatsapp_digits}}' },
        tone: 'accent',
      },
    ],
  ]),
};
