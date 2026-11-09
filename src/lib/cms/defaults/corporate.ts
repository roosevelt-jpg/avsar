import {
  BRAND_SLIDES,
  INTRO_FILM,
  PHOTO_KITCHEN,
  PHOTO_LISBON,
  PHOTO_PORTO,
  PHOTO_SITE,
  PHOTO_TRAM,
  slidesWithCaptions,
} from '@/lib/cms/brand-media';
import { makeBlocks, type DefaultPage } from './make';

/**
 * Shared Corporate Info sub-nav. Same links on every corporate page so visitors
 * can move between profile, notes, history and the chart without hunting.
 */
export const CORPORATE_NAV_ITEMS = [
  { label: 'Company Profile', href: '/about' },
  { label: "Founder's Note", href: '/founders-note' },
  { label: "Director's Note", href: '/directors-note' },
  { label: 'Our History', href: '/history' },
  { label: 'Organisation Chart', href: '/organization-chart' },
] as const;

const corporateNav = {
  eyebrow: 'Corporate Info',
  items: CORPORATE_NAV_ITEMS.map((item) => ({ ...item })),
};

/** Placeholder portraits — swap for real headshots in the CMS. */
const PORTRAIT_FOUNDER = {
  src: '/photos/brand/employer-handshake.jpg',
  alt: 'Founder of S&A Recruitment',
} as const;
const PORTRAIT_DIRECTOR = {
  src: '/photos/brand/hero-hospitality.jpg',
  alt: 'Director of S&A Recruitment',
} as const;
const PORTRAIT_OPS = {
  src: '/photos/brand/hero-service-floor.jpg',
  alt: 'Operations lead',
} as const;
const PORTRAIT_INDIA = {
  src: '/photos/brand/hero-chef.jpg',
  alt: 'India desk',
} as const;
const PORTRAIT_PORTUGAL = {
  src: '/photos/brand/hero-lisbon-street.jpg',
  alt: 'Portugal desk',
} as const;
const PORTRAIT_RELOCATION = {
  src: '/photos/brand/journey-tram-real.jpg',
  alt: 'Relocation and visa desk',
} as const;

/**
 * Company Profile hub at /about — DSS-style Corporate Info entry.
 * Stats stay empty (honest) until verified figures are entered in the CMS.
 */
export const ABOUT: DefaultPage = {
  slug: 'about',
  path: '/about',
  title: 'Corporate Info',
  purpose:
    'Company profile hub: who we are, placement stats, links to founder/director notes, history and the organisation chart.',
  seo: {
    title: 'Corporate Info · S&A Recruitment',
    description:
      'Company profile for S&A Recruitment — India to Portugal hiring, founder and director notes, our history and organisation chart.',
  },
  blocks: makeBlocks('about', [
    [
      'hero',
      {
        eyebrow: 'Corporate Info',
        title: 'Connecting Global Talent with Opportunities in Portugal',
        accentWord: 'Portugal',
        subtitle:
          'S&A Recruitment is a specialist international agency connecting skilled professionals from India with trusted employers in Portugal — fairly, with clear steps, and without placement fees for candidates.',
        primaryCta: { label: 'Find Job Opportunities', href: '/jobs' },
        secondaryCta: { label: 'Contact us', href: '/contact' },
        badgeLabel: '',
        badgeHref: '',
        filmUrl: INTRO_FILM.url,
        filmLabel: 'Watch Our Story',
        highlights: [],
        layout: 'overlay',
        mediaType: 'image',
        mediaSrc: PHOTO_LISBON.src,
        mediaPoster: INTRO_FILM.poster,
        mediaAlt: PHOTO_LISBON.alt,
        slides: slidesWithCaptions(BRAND_SLIDES.about),
        stats: [],
      },
    ],
    ['corporate_nav', corporateNav],
    [
      'stats',
      {
        eyebrow: 'At a glance',
        title: 'Our work in figures',
        items: [
          { value: '', label: 'Professionals placed', note: '' },
          { value: '', label: 'Partner employers', note: '' },
          { value: '', label: 'Industry sectors', note: '' },
          { value: '', label: 'Years bridging India ↔ Portugal', note: '' },
        ],
      },
    ],
    [
      'features',
      {
        eyebrow: '',
        title: '',
        intro: '',
        columns: '2',
        style: 'mission',
        sideImage: PHOTO_KITCHEN.src,
        sideImageAlt: PHOTO_KITCHEN.alt,
        typing: false,
        items: [
          {
            icon: 'map',
            title: 'Our Mission',
            body: 'Create clear, legal career paths from India to Portugal — assessed candidates, confirmed jobs, and support from application through the first months after arrival.',
            link: { label: '', href: '' },
            image: '',
          },
          {
            icon: 'star',
            title: 'Our Vision',
            body: 'Be the recruitment partner European employers trust for skilled talent from India, and the one candidates trust for honest steps and written contracts.',
            link: { label: '', href: '' },
            image: '',
          },
        ],
      },
    ],
    [
      'features',
      {
        eyebrow: '',
        title: 'Our Core Values',
        intro: '',
        columns: '4',
        style: 'value_cards',
        sideImage: '',
        sideImageAlt: '',
        typing: false,
        items: [
          {
            icon: 'users',
            title: 'People First',
            body: 'Candidates and employers sit at the centre of every decision we take.',
            link: { label: '', href: '' },
            image: '',
          },
          {
            icon: 'shield',
            title: 'Integrity',
            body: 'We say what a role pays, what it costs, and what we cannot promise.',
            link: { label: '', href: '' },
            image: '',
          },
          {
            icon: 'star',
            title: 'Excellence',
            body: 'Assessed candidates, confirmed vacancies and written Portuguese contracts.',
            link: { label: '', href: '' },
            image: '',
          },
          {
            icon: 'heart',
            title: 'Partnership',
            body: 'Long-term relationships with employers who hire fairly and stay with us.',
            link: { label: '', href: '' },
            image: '',
          },
        ],
      },
    ],
    [
      'features',
      {
        eyebrow: 'Corporate Info',
        title: 'Explore who we are',
        intro: 'Read our leadership notes, follow the company timeline, and see how the desks are organised.',
        columns: '2',
        style: 'tiles',
        sideImage: '',
        sideImageAlt: '',
        typing: false,
        items: [
          {
            icon: 'document',
            title: "Founder's Note",
            body: 'Why we built a fair India–Portugal recruitment path.',
            link: { label: 'Read the note', href: '/founders-note' },
            image: PORTRAIT_FOUNDER.src,
          },
          {
            icon: 'chat',
            title: "Director's Note",
            body: 'How we work day to day with candidates and employers.',
            link: { label: 'Read the note', href: '/directors-note' },
            image: PORTRAIT_DIRECTOR.src,
          },
          {
            icon: 'clock',
            title: 'Our History',
            body: 'Milestones on the India–Portugal talent bridge.',
            link: { label: 'See the timeline', href: '/history' },
            image: PHOTO_TRAM.src,
          },
          {
            icon: 'building',
            title: 'Organisation Chart',
            body: 'Leadership and desks across India and Portugal.',
            link: { label: 'View the chart', href: '/organization-chart' },
            image: PHOTO_LISBON.src,
          },
        ],
      },
    ],
    [
      'employer_band',
      {
        eyebrow: '',
        title: 'Why Choose S&A Recruitment?',
        body: 'Whether you are a candidate or an employer, we are here to help you work toward a clear outcome in Portugal.',
        layout: 'why',
        bullets: [
          { icon: 'check', text: 'Specialised in Portugal recruitment from India.' },
          { icon: 'check', text: 'Trusted and verified employer network.' },
          { icon: 'check', text: 'End-to-end support: from application to relocation.' },
          { icon: 'check', text: 'Compliance with international recruitment standards.' },
          { icon: 'check', text: 'A dedicated team committed to your success.' },
        ],
        image: PHOTO_TRAM.src,
        imageAlt: PHOTO_TRAM.alt,
        cta: { label: 'Work With Us Today', href: '/signup' },
      },
    ],
  ]),
};

export const FOUNDERS_NOTE: DefaultPage = {
  slug: 'founders-note',
  path: '/founders-note',
  title: "Founder's Note",
  purpose: 'Letter from the founder. Portrait and body are editable in the CMS.',
  seo: {
    title: "Founder's Note · Corporate Info",
    description: 'A note from the founder of S&A Recruitment on why we connect India and Portugal.',
  },
  blocks: makeBlocks('founders-note', [
    [
      'hero',
      {
        eyebrow: 'Corporate Info',
        title: "Founder's Note",
        accentWord: '',
        subtitle: 'Why we built a fair India–Portugal recruitment path — and what we refuse to promise.',
        primaryCta: { label: '', href: '' },
        secondaryCta: { label: '', href: '' },
        badgeLabel: '',
        badgeHref: '',
        filmUrl: '',
        filmLabel: '',
        highlights: [],
        layout: 'overlay',
        mediaType: 'image',
        mediaSrc: PHOTO_PORTO.src,
        mediaPoster: '',
        mediaAlt: PHOTO_PORTO.alt,
        slides: slidesWithCaptions([PHOTO_PORTO, PHOTO_LISBON]),
        stats: [],
      },
    ],
    ['corporate_nav', corporateNav],
    [
      'split',
      {
        eyebrow: 'From the founder',
        title: 'A message you can hold us to',
        body:
          'I started S&A Recruitment because too many people were asked to pay for a job that might never arrive.\n\nWe work the other way: confirmed vacancies with Portuguese employers, a free skills assessment, and written contracts that match what we said on the call. Candidates are not charged a placement fee. We will not invent placement counts or visa guarantees to win trust.\n\nIf you join us — as a candidate or an employer — you get the same facts your family would want to hear.',
        bullets: [
          'Confirmed vacancies before we shortlist.',
          'No placement fee for candidates.',
          'Written contracts and clear salaries.',
        ],
        cta: { label: '', href: '' },
        image: PORTRAIT_FOUNDER.src,
        imageAlt: PORTRAIT_FOUNDER.alt,
        gallery: [],
        imageSide: 'left',
        style: 'default',
      },
    ],
    [
      'rich_text',
      {
        eyebrow: '',
        title: '',
        body: '**— Founder, S&A Recruitment**',
        width: 'narrow',
      },
    ],
  ]),
};

export const DIRECTORS_NOTE: DefaultPage = {
  slug: 'directors-note',
  path: '/directors-note',
  title: "Director's Note",
  purpose: 'Letter from the director. Portrait and body are editable in the CMS.',
  seo: {
    title: "Director's Note · Corporate Info",
    description: 'Direction from the director’s desk on how S&A works with candidates and employers.',
  },
  blocks: makeBlocks('directors-note', [
    [
      'hero',
      {
        eyebrow: 'Corporate Info',
        title: "Director's Note",
        accentWord: '',
        subtitle: 'How we work day to day with candidates, families and hiring managers.',
        primaryCta: { label: '', href: '' },
        secondaryCta: { label: '', href: '' },
        badgeLabel: '',
        badgeHref: '',
        filmUrl: '',
        filmLabel: '',
        highlights: [],
        layout: 'overlay',
        mediaType: 'image',
        mediaSrc: PHOTO_SITE.src,
        mediaPoster: '',
        mediaAlt: PHOTO_SITE.alt,
        slides: slidesWithCaptions([PHOTO_SITE, PHOTO_KITCHEN]),
        stats: [],
      },
    ],
    ['corporate_nav', corporateNav],
    [
      'split',
      {
        eyebrow: 'From the director',
        title: 'Clear steps, written contracts',
        body:
          'Our desk runs on assessed candidates, confirmed employer briefs, and paperwork that matches the conversation.\n\nWhen a candidate asks what a role pays, what documents they need, or how long the visa file usually takes, we answer with what we know — and we say when we do not know yet. Families get the same update candidates get.\n\nEmployers receive shortlists with skills they can verify, not a pile of CVs. That is the standard we keep every week.',
        bullets: [
          'Skills checked before shortlists go out.',
          'The same facts for candidates and families.',
          'Employer briefs matched to assessed talent.',
        ],
        cta: { label: '', href: '' },
        image: PORTRAIT_DIRECTOR.src,
        imageAlt: PORTRAIT_DIRECTOR.alt,
        gallery: [],
        imageSide: 'right',
        style: 'default',
      },
    ],
    [
      'rich_text',
      {
        eyebrow: '',
        title: '',
        body: '**— Director, S&A Recruitment**',
        width: 'narrow',
      },
    ],
  ]),
};

export const HISTORY: DefaultPage = {
  slug: 'history',
  path: '/history',
  title: 'Our History',
  purpose: 'Company timeline. Years, photos and copy are editable in the CMS.',
  seo: {
    title: 'Our History · Corporate Info',
    description: 'How S&A Recruitment’s India–Portugal bridge was built — timeline editable in the CMS.',
  },
  blocks: makeBlocks('history', [
    [
      'hero',
      {
        eyebrow: 'Corporate Info',
        title: 'Our History',
        accentWord: '',
        subtitle: 'Milestones on the India–Portugal talent bridge.',
        primaryCta: { label: '', href: '' },
        secondaryCta: { label: '', href: '' },
        badgeLabel: '',
        badgeHref: '',
        filmUrl: '',
        filmLabel: '',
        highlights: [],
        layout: 'overlay',
        mediaType: 'image',
        mediaSrc: PHOTO_TRAM.src,
        mediaPoster: '',
        mediaAlt: PHOTO_TRAM.alt,
        slides: slidesWithCaptions(BRAND_SLIDES.about),
        stats: [],
      },
    ],
    ['corporate_nav', corporateNav],
    [
      'steps',
      {
        eyebrow: 'Timeline',
        title: 'How we got here',
        intro: 'From the first employer briefs to a full relocation desk — the path candidates and employers follow today.',
        items: [
          {
            icon: '',
            title: 'Company founded',
            body: 'S&A Recruitment established to connect skilled professionals in India with employers in Portugal.',
            meta: 'Beginning',
            image: PHOTO_LISBON.src,
          },
          {
            icon: '',
            title: 'First employer partnerships',
            body: 'Hospitality and construction briefs opened the corridor with written contracts and clear salaries.',
            meta: 'Growth',
            image: PHOTO_KITCHEN.src,
          },
          {
            icon: '',
            title: 'Candidate assessment path',
            body: 'A free assessment joined the talent database so employers see verified skills before shortlists.',
            meta: 'Platform',
            image: PHOTO_SITE.src,
          },
          {
            icon: '',
            title: 'Relocation support desk',
            body: 'Visa file guidance and arrival steps added so families can follow the same journey.',
            meta: 'Today',
            image: PHOTO_TRAM.src,
          },
        ],
        layout: 'timeline',
        sideImage: '',
        sideImageAlt: '',
        sideImageCaption: '',
        sideImageSide: 'left',
      },
    ],
  ]),
};

export const ORGANIZATION_CHART: DefaultPage = {
  slug: 'organization-chart',
  path: '/organization-chart',
  title: 'Organisation Chart',
  purpose: 'Leadership and desk roles by row. Names and portraits are editable in the CMS.',
  seo: {
    title: 'Organisation Chart · Corporate Info',
    description: 'How S&A Recruitment is organised — leadership and desks, editable in the CMS.',
  },
  blocks: makeBlocks('organization-chart', [
    [
      'hero',
      {
        eyebrow: 'Corporate Info',
        title: 'Organisation Chart',
        accentWord: '',
        subtitle: 'Leadership and desks across India and Portugal.',
        primaryCta: { label: '', href: '' },
        secondaryCta: { label: '', href: '' },
        badgeLabel: '',
        badgeHref: '',
        filmUrl: '',
        filmLabel: '',
        highlights: [],
        layout: 'overlay',
        mediaType: 'image',
        mediaSrc: PHOTO_LISBON.src,
        mediaPoster: '',
        mediaAlt: PHOTO_LISBON.alt,
        slides: slidesWithCaptions([PHOTO_LISBON, PHOTO_PORTO]),
        stats: [],
      },
    ],
    ['corporate_nav', corporateNav],
    [
      'org_chart',
      {
        eyebrow: 'Leadership',
        title: 'Who runs the desk',
        intro: 'The teams that move candidates from assessment to arrival — and keep employers briefed.',
        items: [
          {
            name: 'Founder',
            role: 'Founder',
            level: '1',
            image: PORTRAIT_FOUNDER.src,
            bio: 'Sets the standard for fair hiring on the India–Portugal corridor.',
          },
          {
            name: 'Director',
            role: 'Director',
            level: '2',
            image: PORTRAIT_DIRECTOR.src,
            bio: 'Owns day-to-day delivery for candidates and employers.',
          },
          {
            name: 'Operations',
            role: 'Operations',
            level: '3',
            image: PORTRAIT_OPS.src,
            bio: 'Candidate journey and employer briefs.',
          },
          {
            name: 'India desk',
            role: 'India desk',
            level: '3',
            image: PORTRAIT_INDIA.src,
            bio: 'Assessment, interviews and document prep.',
          },
          {
            name: 'Portugal desk',
            role: 'Portugal desk',
            level: '3',
            image: PORTRAIT_PORTUGAL.src,
            bio: 'Employer relations and arrival support.',
          },
          {
            name: 'Relocation & visa',
            role: 'Relocation & visa',
            level: '4',
            image: PORTRAIT_RELOCATION.src,
            bio: 'File readiness and family updates.',
          },
        ],
      },
    ],
  ]),
};

export const CORPORATE_PAGES: DefaultPage[] = [
  ABOUT,
  FOUNDERS_NOTE,
  DIRECTORS_NOTE,
  HISTORY,
  ORGANIZATION_CHART,
];
