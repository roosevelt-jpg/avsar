import { makeBlocks, type DefaultPage } from './make';

export const HOME: DefaultPage = {
  slug: 'home',
  path: '',
  title: 'Home',
  purpose: 'The landing page. First impression for a candidate arriving from WhatsApp, Instagram or search.',
  seo: {
    title: 'Jobs in Portugal for Indian talent · Apply free from your phone',
    description:
      'Real jobs with Portuguese employers. Free to apply, no placement fees for candidates, UPI accepted, visa and relocation support from application to arrival.',
  },
  blocks: makeBlocks('home', [
    [
      'hero',
      {
        eyebrow: 'India → Portugal · Hiring now',
        title: 'Real jobs in Portugal. Apply from India in five minutes.',
        subtitle:
          'Chefs, cleaners, drivers, electricians, welders and more. Take our skills and English test on your phone, and Portuguese employers searching for workers can find you. A team handles your visa and relocation with you, step by step.',
        primaryCta: { label: 'Create my free profile', href: '/signup' },
        secondaryCta: { label: 'See open jobs', href: '/jobs' },
        filmUrl: '/video/intro.mp4',
        filmLabel: 'Watch how it works · under a minute',
        highlights: ['Free test, free database', 'Housing, meals and visa costs covered when selected', 'No placement fee for candidates'],
        intentsLabel: 'What brings you here?',
        intents: [
          { icon: 'briefcase', label: 'Find a job in Portugal', href: '/jobs', image: '/illustrations/find-job.jpg' },
          { icon: 'graduation', label: 'Take the free skills test', href: '/signup', image: '/illustrations/skills-test.jpg' },
          { icon: 'plane', label: 'Understand the visa', href: '/visa-and-relocation', image: '/illustrations/visa.jpg' },
          { icon: 'users', label: 'Hire workers from India', href: '/employers', image: '/illustrations/hire.jpg' },
        ],
        bubbles: [
          'India → Portugal',
          'Chefs & kitchen teams',
          'Electricians & welders',
          'Lisbon · Porto · Algarve',
          'Free skills test',
          'Interview on Zoom',
          'Offer letter & contract',
          'Visa file prepared with you',
          'Flight paid when selected',
          'Housing & meals included',
          'Cleaners & drivers',
          'WhatsApp in Hindi or English',
        ],
        liveProof: true,
        routeMap: true,
        layout: 'stacked',
        mediaType: 'video',
        mediaSrc: '/video/hero-loop.mp4',
        mediaPoster: '/video/hero-poster.jpg',
        mediaAlt: 'Kitchen team at work in a Portuguese hotel',
        stats: [
          { value: '5 min', label: 'to apply from your phone' },
          { value: '{{response_days}} days', label: 'to a clear answer, yes or no' },
          { value: '₹0', label: 'placement fee for candidates' },
        ],
      },
    ],
    [
      'trust_bar',
      {
        items: [
          { icon: 'shield', title: 'Verified employers', body: 'Every job is confirmed with the Portuguese employer before it goes live.' },
          { icon: 'rupee', title: 'Free to apply', body: 'The test, the rewritten CV and applying are free. The only payments are the skills report and the visa-requirements list, on this site only. Never cash, never WhatsApp.' },
          { icon: 'document', title: 'Legal contracts', body: 'A Portuguese employment contract, with salary paid 14 times a year.' },
          { icon: 'plane', title: 'Visa and arrival', body: 'We build your visa file with you and meet you when you land.' },
        ],
      },
    ],
    [
      'featured_jobs',
      {
        eyebrow: 'Open now',
        title: 'Jobs you can apply for today',
        intro: 'Each posting shows the salary, the city, the housing and meals included and what the employer is looking for. No surprises later.',
        limit: 6,
        cta: { label: 'See all jobs', href: '/jobs' },
      },
    ],
    [
      'steps',
      {
        eyebrow: 'How it works',
        title: 'From your phone in India to your first day in Portugal',
        intro: 'Six steps, and you always know which one you are on. Your dashboard shows it, and we message you when it moves.',
        items: [
          { title: 'Create your profile', body: 'Name, phone, email and a password. Two minutes. You can come back and change the account and the CV. No documents needed yet.', meta: '2 minutes', image: '/photos/steps/profile.jpg' },
          { title: 'Fill in your CV and take the test', body: 'We rewrite your CV from what you wrote. Then you sit the skills and English questions, up to 90 minutes, and you see your score. Both are free. A score above {{shortlist_score}} out of 10 qualifies you for the shortlist. The skills report PDF ({{skills_fee}}) and the visa-requirements list ({{visa_fee}}) are the only things you pay for. Both together are {{bundle_fee}} instead of {{fee_inr}}.', meta: 'Free', image: '/photos/steps/test.jpg' },
          { title: 'Apply to jobs', body: 'Pick a job and press apply. Free. Your score goes with the application. Interviews, on Zoom with our team and then the employer, are free too.', meta: 'Free', image: '/photos/steps/apply.jpg' },
          { title: 'Talk to us, then the employer', body: 'A recruiter calls you first. Shortlisted candidates interview with the employer on Zoom. Free, and only after that is there an offer to consider.', meta: 'Free', image: '/photos/steps/interview.jpg' },
          { title: 'After a successful offer', body: 'A contract, housing, the flight and legal support come after a successful offer, not before. We pay the visa costs and your flight. The employer pays the placement fee. You never do.', meta: 'After an offer', image: '/photos/steps/visa.jpg' },
          { title: 'Fly and start work', body: 'Housing and meals are included. We help with your tax number, bank account and registration in the first weeks.', meta: 'Welcome', image: '/photos/steps/arrival.jpg' },
        ],
        layout: 'timeline',
      },
    ],
    [
      'job_categories',
      {
        eyebrow: 'Roles',
        title: 'The work we recruit for',
        intro: 'Hospitality, cleaning, trades, logistics and IT. Tap a role to see every open job in it.',
      },
    ],
    [
      'split',
      {
        eyebrow: 'If you are selected',
        title: 'What a job through us includes',
        body:
          'Every offer is a real Portuguese employment contract with the same rights as a Portuguese worker: minimum wage or above, paid leave, social security and public healthcare.\n\nWe stay with you after the offer, not just until it.\n\nYou only pay for two documents, and both are separate from the job. The skills report ({{skills_fee}}) and the visa-requirements list ({{visa_fee}}) are {{bundle_fee}} together instead of {{fee_inr}}. The rewritten CV and your score are free. Each paid file carries our mark. The visa list is not a visa decision, and paying does not change the shortlist.',
        bullets: [
          'Employment contract, typically for {{contract_years}} years with renewal',
          'Salary paid 14 times a year, as Portuguese law requires',
          'Housing and meals included',
          'Flight, visa fee, police certificate, immigration fees and taxes paid by us',
          'Your visa file prepared with you by independent immigration lawyers, and legal support through the residence permit',
          'Help getting your tax number (NIF), bank account and health registration',
        ],
        cta: { label: 'Visa and relocation, step by step', href: '/visa-and-relocation' },
        image: '/photos/selected/contract.jpg',
        imageAlt: 'What a job through us includes',
        imageSide: 'right',
        gallery: [
          { src: '/photos/selected/contract.jpg', alt: 'An employment contract ready to read' },
          { src: '/photos/selected/housing.jpg', alt: 'Housing and a meal included with the job' },
          { src: '/photos/selected/flight.jpg', alt: 'The flight when a candidate is selected' },
          { src: '/photos/selected/visa.jpg', alt: 'A passport and the visa file' },
        ],
      },
    ],
    [
      'live_funnel',
      {
        eyebrow: 'Honest odds',
        title: 'Where people actually get to',
        intro: 'Counted live from our database, not typed in. Most people who take the test are not hired, and we would rather you knew that before you start.',
        completedLabel: 'finish the free test',
        qualifiedLabel: 'score above {{shortlist_score}} out of 10',
        shortlistedLabel: 'are put forward to an employer',
        hiredLabel: 'are hired',
        minSample: 50,
        pendingText: '{{finished}} people have finished the test so far. We will publish these rates here once {{min_sample}} have, because a rate from a handful of people misleads. Until then: historically about {{shortlist_hired}} of every {{shortlist_size}} shortlisted candidates have been hired.',
        note: 'The test is free, so taking it costs you nothing but time. Past results are not a promise.',
        cta: { label: 'How we select', href: '/selection-rules' },
      },
    ],
    [
      'features',
      {
        eyebrow: 'Made for you',
        title: 'Built for candidates applying from India',
        intro: '',
        columns: '3',
        style: 'tiles',
        typing: true,
        items: [
          { icon: 'phone', title: 'Works on any phone', body: 'Light pages that load on mobile data. Apply, upload and track from the same phone.', image: '/illustrations/skills-test.jpg' },
          { icon: 'chat', title: 'A real person on WhatsApp', body: 'Questions answered by our team on {{whatsapp}}, in English or Hindi.', image: '/illustrations/chat.jpg' },
          { icon: 'clock', title: 'Track every step', body: 'Your dashboard shows each application, what stage it is at and what happens next.', image: '/illustrations/track-steps.jpg' },
          { icon: 'rupee', title: 'You only pay for two reports', body: 'The account, the rewritten CV, the test, the score and applying are free. The skills report ({{skills_fee}}) and the visa-requirements list ({{visa_fee}}) are optional. Both together are {{bundle_fee}} instead of {{fee_inr}}, paid on this website, with a receipt.', link: { label: 'What you can buy', href: '/pricing' }, image: '/illustrations/payment.jpg' },
          { icon: 'globe', title: 'In your language', body: 'The site works in English, Hindi, Malayalam, Tamil, Urdu and the other major languages of India. Switch language from the menu at the top.', image: '/illustrations/language.jpg' },
          { icon: 'check', title: 'Honest odds', body: 'A score above {{shortlist_score}} out of 10 qualifies you for the shortlist. The live figures above show how many people get there and how many are hired.', link: { label: 'How we select', href: '/selection-rules' }, image: '/illustrations/honest-odds.jpg' },
        ],
      },
    ],
    [
      'candidate_stories',
      {
        eyebrow: 'From people who made the move',
        title: 'In their own words',
        intro:
          'Only stories written by candidates we placed and approved by our team appear here. Nothing is invented.',
        limit: 3,
      },
    ],
    [
      'faq',
      {
        eyebrow: 'Questions',
        title: 'Before you apply',
        intro: '',
        items: [
          { question: 'Is it free to apply?', answer: 'Yes. Creating a profile and applying to jobs is free. There is no placement fee for candidates: the employer pays us when they hire.' },
          { question: 'Do I have to pay anything?', answer: 'The account, the rewritten CV, the skills test, your score and applying are free. You can buy a skills report PDF ({{skills_fee}}) and a list of what is missing for the visa ({{visa_fee}}). Both together are {{bundle_fee}} instead of {{fee_inr}}. Neither changes the shortlist. The employer pays the placement fee.' },
          { question: 'Do I need to speak Portuguese?', answer: 'No. Most of the jobs we recruit for need basic English. Many employers offer Portuguese lessons once you arrive.' },
          { question: 'How long does it take?', answer: 'You hear back within {{response_days}} days of applying. From offer to arrival usually takes three to six months, mostly waiting for the visa.' },
          { question: 'Someone on WhatsApp asked me for money for a job here. Is that you?', answer: 'No. We never ask for money by WhatsApp, bank transfer or cash. Read [how to stay safe](/stay-safe) and report it to us.' },
        ],
      },
    ],
    [
      'cta',
      {
        title: 'Your next job could be in Lisbon, Porto or the Algarve.',
        body: 'Create your profile in two minutes and take the free skills test. You join our recruitment database, and you can apply to any open job for free.',
        primary: { label: 'Create my free profile', href: '/signup' },
        secondary: { label: 'Talk to us on WhatsApp', href: 'https://wa.me/{{whatsapp_digits}}' },
      },
    ],
  ]),
};
