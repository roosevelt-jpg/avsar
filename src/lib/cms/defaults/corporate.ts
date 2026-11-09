import { BRAND_SLIDES, INTRO_FILM, PHOTO_KITCHEN, PHOTO_LISBON, PHOTO_PORTO, PHOTO_SITE, PHOTO_TRAM, slidesWithCaptions } from '@/lib/cms/brand-media';
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

/**
 * Company Profile hub at /about — DSS-style Corporate Info entry with honest
 * empty placement stats. Photographs and letter copy are CMS-editable.
 */
export const ABOUT: DefaultPage = {
  slug: 'about',
  path: '/about',
  title: 'Corporate Info',
  purpose:
    'Company profile hub: who we are, empty placement stats ready for real figures, links to founder/director notes, history and the organisation chart.',
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
        eyebrow: 'By the numbers',
        title: 'Placement figures we will publish when they are verified',
        items: [
          {
            value: '',
            label: 'Professionals placed',
            note: 'Left empty until we can publish a verified count.',
          },
          {
            value: '',
            label: 'Partner employers',
            note: 'Filled when the employer network figure is confirmed.',
          },
          {
            value: '',
            label: 'Industry sectors',
            note: 'Hospitality, construction and more — count when listed live.',
          },
          {
            value: '',
            label: 'Years bridging India ↔ Portugal',
            note: 'Add the founding year once the company record is confirmed.',
          },
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
        eyebrow: 'Inside Corporate Info',
        title: 'Notes, history and how we are organised',
        intro: 'Open each page to add photographs and finished copy in the CMS. Nothing here invents placements or staff names.',
        columns: '2',
        style: 'cards',
        sideImage: '',
        sideImageAlt: '',
        typing: false,
        items: [
          {
            icon: 'document',
            title: "Founder's Note",
            body: 'A short letter from the founder — portrait and wording ready for CMS upload.',
            link: { label: 'Read the note', href: '/founders-note' },
            image: '',
          },
          {
            icon: 'chat',
            title: "Director's Note",
            body: 'Direction for candidates and employers from the director’s desk.',
            link: { label: 'Read the note', href: '/directors-note' },
            image: '',
          },
          {
            icon: 'clock',
            title: 'Our History',
            body: 'A timeline of how the India–Portugal bridge was built. Years and photos are editable.',
            link: { label: 'See the timeline', href: '/history' },
            image: '',
          },
          {
            icon: 'building',
            title: 'Organisation Chart',
            body: 'Leadership and desks by row. Names and portraits stay empty until confirmed.',
            link: { label: 'View the chart', href: '/organization-chart' },
            image: '',
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
  purpose: 'Letter from the founder. Portrait and body are CMS fields — ship with honest placeholders.',
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
          'Replace this letter in the CMS with the founder’s own words and photograph.\n\nUntil then: we recruit for confirmed vacancies in Portugal, we do not charge candidates a placement fee, and we will not invent placement counts or visa guarantees to win trust.',
        bullets: [
          'Portrait photograph — upload in this block.',
          'Sign-off name and title — edit the title and closing below.',
        ],
        cta: { label: '', href: '' },
        image: '',
        imageAlt: 'Founder portrait — add in CMS',
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
        body:
          '**— Founder, S&A Recruitment**\n\n_Name and signature image can be added here once confirmed._',
        width: 'narrow',
      },
    ],
  ]),
};

export const DIRECTORS_NOTE: DefaultPage = {
  slug: 'directors-note',
  path: '/directors-note',
  title: "Director's Note",
  purpose: 'Letter from the director. Same CMS pattern as the founder’s note.',
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
          'Replace this letter in the CMS with the director’s own words and photograph.\n\nOur desk is built around assessed candidates, confirmed employer briefs, and paperwork that matches what we said on the call. Families get the same facts candidates get.',
        bullets: [
          'Director portrait — upload in this block.',
          'Update the closing line when the name is confirmed.',
        ],
        cta: { label: '', href: '' },
        image: '',
        imageAlt: 'Director portrait — add in CMS',
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
        body:
          '**— Director, S&A Recruitment**\n\n_Name and signature image can be added here once confirmed._',
        width: 'narrow',
      },
    ],
  ]),
};

export const HISTORY: DefaultPage = {
  slug: 'history',
  path: '/history',
  title: 'Our History',
  purpose: 'Company timeline. Years and photos are CMS fields; no invented founding myths.',
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
        subtitle: 'Milestones on the India–Portugal talent bridge. Edit years, photos and copy in the console.',
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
        intro:
          'Dates below are placeholders. Replace each year, sentence and photograph in the CMS when the company record is confirmed.',
        items: [
          {
            icon: '',
            title: 'Company founded',
            body: 'S&A Recruitment established to connect skilled professionals in India with employers in Portugal.',
            meta: 'Year — add in CMS',
            image: PHOTO_LISBON.src,
          },
          {
            icon: '',
            title: 'First employer partnerships',
            body: 'Hospitality and construction briefs opened the corridor with written contracts and clear salaries.',
            meta: 'Year — add in CMS',
            image: PHOTO_KITCHEN.src,
          },
          {
            icon: '',
            title: 'Candidate assessment path',
            body: 'A free assessment joined the talent database so employers see verified skills before shortlists.',
            meta: 'Year — add in CMS',
            image: PHOTO_SITE.src,
          },
          {
            icon: '',
            title: 'Relocation support desk',
            body: 'Visa file guidance and arrival steps added so families can follow the same journey.',
            meta: 'Year — add in CMS',
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
  purpose: 'Leadership and desk roles by row. Names and portraits stay empty until real people are confirmed.',
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
        subtitle: 'Roles by row. Add names and photographs in the CMS when they are confirmed — nothing invented here.',
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
        intro: 'Empty names mean the seat is listed but the person is not published yet. Upload portraits in each card.',
        items: [
          { name: '', role: 'Founder', level: '1', image: '', bio: '' },
          { name: '', role: 'Director', level: '2', image: '', bio: '' },
          { name: '', role: 'Operations', level: '3', image: '', bio: 'Candidate journey and employer briefs.' },
          { name: '', role: 'India desk', level: '3', image: '', bio: 'Assessment, interviews and document prep.' },
          { name: '', role: 'Portugal desk', level: '3', image: '', bio: 'Employer relations and arrival support.' },
          { name: '', role: 'Relocation & visa', level: '4', image: '', bio: 'File readiness and family updates.' },
        ],
      },
    ],
    [
      'notice',
      {
        tone: 'info',
        title: 'Updating this chart',
        body: 'In Admin → Pages → Organisation Chart, edit the Organisation chart block: set names, upload photos, and change rows. The public page updates after you publish.',
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
