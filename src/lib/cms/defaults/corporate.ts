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
 * Team photographs and about hero pulled from smithandadams.com/about.
 * Admins can replace any path in the CMS media picker later.
 */
const TEAM = {
  heroAbout: { src: '/photos/team/hero-about.jpg', alt: 'Smith & Adams — Lisbon' },
  og: { src: '/photos/team/og-image.jpg', alt: 'Smith & Adams' },
  george: { src: '/photos/team/george-hobson.jpg', alt: 'George Hobson, Founder, Smith & Adams' },
  georgeTeam: { src: '/photos/team/george.jpg', alt: 'George Hobson' },
  suelen: { src: '/photos/team/suelen.jpg', alt: 'Suelen Pires, CEO, Smith & Adams' },
  adam: { src: '/photos/team/adam.jpg', alt: 'Adam Ismail, Head of Hospitality' },
  abilio: { src: '/photos/team/abilio.jpg', alt: 'Abílio Diz, Head of Marketing' },
  teresa: { src: '/photos/team/teresa.jpg', alt: 'Teresa Cherry Pinto, Head of Client Relations & Asset Management' },
  alex: { src: '/photos/team/alex.jpg', alt: 'Alex Ivatsko, Digital Marketing Manager' },
  mona: { src: '/photos/team/mona.jpg', alt: 'Mona Campbel, Data Analyst' },
  renato: { src: '/photos/team/renato.jpg', alt: 'Renato Silva, Revenue Manager' },
  taibo: { src: '/photos/team/taibo.jpg', alt: 'Taibo Karã, Customer Service Manager' },
  soraia: { src: '/photos/team/soraia.jpg', alt: 'Soraia Fernandes, Hospitality Team Manager' },
  joao: { src: '/photos/team/joao.jpg', alt: 'João Leite, Customer Service Agent' },
  jahed: { src: '/photos/team/jahed.jpg', alt: 'Jahed Jahed, Customer Service Agent' },
  matilde: { src: '/photos/team/matilde.jpg', alt: 'Matilde Boulton, Designer' },
  bruna: { src: '/photos/team/bruna.jpg', alt: 'Bruna Fernandes, Comms Team Manager' },
  ines: { src: '/photos/team/ines.jpg', alt: 'Inês Vasconcelos, Public Relations Manager' },
  benjamin: { src: '/photos/team/benjamin.jpg', alt: 'Benjamin Sharps, Senior Investor Advisor' },
  nayane: { src: '/photos/team/nayane.jpg', alt: 'Nayane, OPPS Agent' },
} as const;

/**
 * Company Profile hub — copy and figures from smithandadams.com/about,
 * framed for the recruitment programme under the Smith & Adams brand.
 * Stats keep the labels published on that page (investors / advised value),
 * not recruitment placement counts.
 */
export const ABOUT: DefaultPage = {
  slug: 'about',
  path: '/about',
  title: 'Corporate Info',
  purpose:
    'Company profile for Smith & Adams: group story, mission, values, leadership notes, history and organisation chart. Editable in the CMS.',
  seo: {
    title: 'About Us · Smith & Adams',
    description:
      'Since 2020, Smith & Adams has helped international clients in Portugal — from real estate and residency to skilled recruitment from India. Meet the team.',
  },
  blocks: makeBlocks('about', [
    [
      'hero',
      {
        eyebrow: 'Lisboa · Portugal · Since 2020',
        title: 'Born from a need.',
        accentWord: 'need',
        subtitle:
          'Smith & Adams began as the answer to a problem we had ourselves. Today the same group serves international investors in Portugal — and runs this recruitment programme connecting skilled professionals from India with Portuguese employers.',
        primaryCta: { label: 'Find Job Opportunities', href: '/jobs' },
        secondaryCta: { label: 'Contact us', href: '/contact' },
        badgeLabel: '',
        badgeHref: '',
        filmUrl: INTRO_FILM.url,
        filmLabel: 'Watch Our Story',
        highlights: [],
        layout: 'overlay',
        mediaType: 'image',
        mediaSrc: TEAM.heroAbout.src,
        mediaPoster: INTRO_FILM.poster,
        mediaAlt: TEAM.heroAbout.alt,
        slides: slidesWithCaptions([
          TEAM.heroAbout,
          PHOTO_LISBON,
          PHOTO_KITCHEN,
          PHOTO_TRAM,
          { src: '/photos/brand/employer-handshake.jpg', alt: 'Working with employers in Portugal' },
        ]),
        stats: [],
      },
    ],
    ['corporate_nav', corporateNav],
    [
      'stats',
      {
        eyebrow: 'Track record and footprint',
        title: 'Figures published by Smith & Adams',
        items: [
          { value: '1,000+', label: 'Investors advised', note: 'Source: Smith & Adams Annual Report 2026.' },
          { value: '€300M+', label: 'In advised investment value', note: 'Source: Smith & Adams Annual Report 2026.' },
          { value: '30+', label: 'Countries represented', note: 'Clients across Europe, the Middle East, Asia and the Americas.' },
          { value: '2020', label: 'Lisbon-based since', note: 'With an office in Dubai.' },
        ],
      },
    ],
    [
      'features',
      {
        eyebrow: 'Smith & Adams Group',
        title: '',
        intro: '',
        columns: '2',
        style: 'mission',
        sideImage: PHOTO_LISBON.src,
        sideImageAlt: PHOTO_LISBON.alt,
        typing: false,
        items: [
          {
            icon: 'map',
            title: 'Our Mission',
            body: 'To give international clients independent, performance-focused access to Portugal — combining rigorous advice with hands-on delivery that protects outcomes without losing sight of the people we serve.',
            link: { label: '', href: '' },
            image: '',
          },
          {
            icon: 'star',
            title: 'Our Vision',
            body: "To be Portugal's leading end-to-end group for foreign clients, setting the standard across investment, hospitality and skilled hiring into Portugal.",
            link: { label: '', href: '' },
            image: '',
          },
        ],
      },
    ],
    [
      'rich_text',
      {
        eyebrow: 'Who we are',
        title: 'A Lisbon group with skin in the game',
        body:
          'The group did not start as an advisory firm. It started with a portfolio of properties, rental commitments to honour and no one on the ground able to run them to the standard they needed. So we ran them ourselves, and learned the market from the inside: what a building really costs to deliver, what tenants and guests expect, and what an asset earns once every cost is counted.\n\nThat is the position most people arriving in Portugal are in — whether they are investing or relocating for work. You do not know the local market, and you need someone who does.\n\nThat is what Smith & Adams is today: experts from first analysis to long-term delivery. More than 1,000 investors have trusted us with over €300M. We also own and operate our own brands, Hygge Kaffe and Hygge Residences, so the standard we advise on is the one we hold ourselves to every day. This recruitment platform sits under the same brand: assessed candidates from India, confirmed vacancies in Portugal, and clear steps through to arrival.',
        width: 'wide',
      },
    ],
    [
      'features',
      {
        eyebrow: 'Values',
        title: 'Six commitments, in the order we test them',
        intro: 'We lead with whichever a piece can actually prove; stated on its own, a value is just decoration.',
        columns: '3',
        style: 'value_cards',
        sideImage: '',
        sideImageAlt: '',
        typing: false,
        items: [
          {
            icon: 'shield',
            title: 'Independence',
            body: 'We advise without a hidden agenda. If something does not serve the client, we say so.',
            link: { label: '', href: '' },
            image: '',
          },
          {
            icon: 'check',
            title: 'Performance discipline',
            body: 'Every recommendation is backed by verifiable numbers, not projections we cannot defend.',
            link: { label: '', href: '' },
            image: '',
          },
          {
            icon: 'briefcase',
            title: 'Ownership mentality',
            body: 'We manage work and relationships as rigorously as if they were our own.',
            link: { label: '', href: '' },
            image: '',
          },
          {
            icon: 'document',
            title: 'Transparency',
            body: 'Clear reporting and clear terms. No surprises in the numbers or the fine print.',
            link: { label: '', href: '' },
            image: '',
          },
          {
            icon: 'users',
            title: 'Client focus',
            body: 'Every relationship receives the same level of attention, regardless of ticket size.',
            link: { label: '', href: '' },
            image: '',
          },
          {
            icon: 'globe',
            title: 'National reach, institutional standards',
            body: "Deep expertise across Portugal's markets, delivered to an institutional-grade standard.",
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
        intro: 'Leadership notes, our timeline, and the people behind the desks.',
        columns: '2',
        style: 'tiles',
        sideImage: '',
        sideImageAlt: '',
        typing: false,
        items: [
          {
            icon: 'document',
            title: "Founder's Note",
            body: 'George Hobson on why Smith & Adams exists.',
            link: { label: 'Read the note', href: '/founders-note' },
            image: TEAM.george.src,
          },
          {
            icon: 'chat',
            title: "Director's Note",
            body: 'Suelen Pires, CEO — how the group delivers day to day.',
            link: { label: 'Read the note', href: '/directors-note' },
            image: TEAM.suelen.src,
          },
          {
            icon: 'clock',
            title: 'Our History',
            body: 'From a portfolio we had to run ourselves to a Lisbon group with international clients.',
            link: { label: 'See the timeline', href: '/history' },
            image: TEAM.heroAbout.src,
          },
          {
            icon: 'building',
            title: 'Organisation Chart',
            body: 'Management and the wider team across investment, hospitality and growth.',
            link: { label: 'View the chart', href: '/organization-chart' },
            image: TEAM.og.src,
          },
        ],
      },
    ],
    [
      'employer_band',
      {
        eyebrow: '',
        title: 'Why work with Smith & Adams?',
        body: 'Whether you are a candidate relocating for work or an employer hiring in Portugal, you get the same standard the group holds on every mandate.',
        layout: 'why',
        bullets: [
          { icon: 'check', text: 'Lisbon-based group since 2020, with a Dubai office.' },
          { icon: 'check', text: 'Independent advice — paid to be right, not to sell.' },
          { icon: 'check', text: 'Hands-on delivery from first step through to management.' },
          { icon: 'check', text: 'Own hospitality brands (Hygge Kaffe, Hygge Residences) that set the bar.' },
          { icon: 'check', text: 'Recruitment under the same brand: assessed talent from India to Portugal.' },
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
  purpose: "George Hobson's note from smithandadams.com/about. Editable in the CMS.",
  seo: {
    title: "Founder's Note · George Hobson · Smith & Adams",
    description:
      'George Hobson, Founder of Smith & Adams, on independent advice and staying with clients after the keys are handed over.',
  },
  blocks: makeBlocks('founders-note', [
    [
      'hero',
      {
        eyebrow: 'Corporate Info',
        title: "Founder's Note",
        accentWord: '',
        subtitle: 'We built Smith & Adams around one idea: that you should be able to succeed in Portugal without having to become an expert in Portugal.',
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
        slides: slidesWithCaptions([PHOTO_PORTO, PHOTO_LISBON, TEAM.heroAbout]),
        stats: [],
      },
    ],
    ['corporate_nav', corporateNav],
    [
      'split',
      {
        eyebrow: 'George Hobson · Founder',
        title: 'Evidence rather than argument',
        body:
          'We built Smith & Adams around one idea: that you should be able to invest in property in Portugal — or build a career here — without having to become an expert in Portugal.\n\nMost people arrive with the same two questions: is this a good opportunity, and who looks after it once I have committed? Answering only the first is what the market usually offers. We give an independent read and then stay on, so nobody hands you off at the point where the work actually starts.\n\nPortugal earns the attention. It offers residency routes into the European Union, a legal system that treats foreign ownership the same as domestic, and cities where demand for good, well-run roles and housing has outrun supply. That combination is rarer than it sounds.\n\nWhat we ask you to judge us on is evidence rather than argument. More than 1,000 investors, over €300M placed and 300+ assets under management — and, where a number matters to your decision, you should be able to see where it came from.',
        bullets: [
          'Independent advice first, held to one standard the whole way through.',
          'More than a decade in Portuguese real estate.',
          'Lisbon and the Algarve — both regions where foreign capital concentrates.',
        ],
        cta: { label: '', href: '' },
        image: TEAM.george.src,
        imageAlt: TEAM.george.alt,
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
          'George Hobson leads investment and strategy at Smith & Adams, setting how the group reads the Portuguese market and how each commitment is structured — from the first appraisal through to handover and management.\n\nHe has spent more than a decade in Portuguese real estate. As a senior investment broker in Lisbon he advised international buyers on residential and yield-focused acquisitions, and earlier built and ran his own brokerage in the Algarve.\n\n**— George Hobson**  \nFounder · Head of Investment & Strategy, Smith & Adams',
        width: 'narrow',
      },
    ],
  ]),
};

export const DIRECTORS_NOTE: DefaultPage = {
  slug: 'directors-note',
  path: '/directors-note',
  title: "Director's Note",
  purpose: 'CEO note from Suelen Pires. Portrait and copy editable in the CMS.',
  seo: {
    title: "Director's Note · Suelen Pires · Smith & Adams",
    description: 'Suelen Pires, CEO of Smith & Adams, on how the group delivers for clients day to day.',
  },
  blocks: makeBlocks('directors-note', [
    [
      'hero',
      {
        eyebrow: 'Corporate Info',
        title: "Director's Note",
        accentWord: '',
        subtitle: 'How we work day to day with clients, candidates and partners — clear steps, clear reporting.',
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
        slides: slidesWithCaptions([PHOTO_SITE, PHOTO_KITCHEN, TEAM.heroAbout]),
        stats: [],
      },
    ],
    ['corporate_nav', corporateNav],
    [
      'split',
      {
        eyebrow: 'Suelen Pires · CEO',
        title: 'Clear steps, the same standard',
        body:
          'Smith & Adams is built so every client gets the same level of attention — whether they are placing capital, opening a residency file, or joining our recruitment path from India to Portugal.\n\nOur desks run on verified information and written next steps. When someone asks what a role pays, what documents they need, or how long a process usually takes, we answer with what we know — and we say when we do not know yet. Families get the same update the candidate gets.\n\nEmployers and investors receive shortlists and recommendations they can check, not a pile of unverified CVs or listings. That is the standard we keep every week across advisory, hospitality and hiring.',
        bullets: [
          'Same attention regardless of ticket size.',
          'Facts shared with candidates and families alike.',
          'Delivery held to the standard of our own brands.',
        ],
        cta: { label: '', href: '' },
        image: TEAM.suelen.src,
        imageAlt: TEAM.suelen.alt,
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
        body: '**— Suelen Pires**  \nCEO, Smith & Adams',
        width: 'narrow',
      },
    ],
  ]),
};

export const HISTORY: DefaultPage = {
  slug: 'history',
  path: '/history',
  title: 'Our History',
  purpose: 'Company timeline from the Smith & Adams about story. Editable in the CMS.',
  seo: {
    title: 'Our History · Smith & Adams',
    description: 'How Smith & Adams grew from running its own portfolio to a Lisbon group serving clients from 30+ countries.',
  },
  blocks: makeBlocks('history', [
    [
      'hero',
      {
        eyebrow: 'Corporate Info',
        title: 'Our History',
        accentWord: '',
        subtitle: 'From a portfolio we had to run ourselves to a Lisbon-based group with clients worldwide.',
        primaryCta: { label: '', href: '' },
        secondaryCta: { label: '', href: '' },
        badgeLabel: '',
        badgeHref: '',
        filmUrl: '',
        filmLabel: '',
        highlights: [],
        layout: 'overlay',
        mediaType: 'image',
        mediaSrc: TEAM.heroAbout.src,
        mediaPoster: '',
        mediaAlt: TEAM.heroAbout.alt,
        slides: slidesWithCaptions([TEAM.heroAbout, ...BRAND_SLIDES.about]),
        stats: [],
      },
    ],
    ['corporate_nav', corporateNav],
    [
      'steps',
      {
        eyebrow: 'Timeline',
        title: 'How we got here',
        intro: 'Milestones published on smithandadams.com — years and photographs stay editable in the CMS.',
        items: [
          {
            icon: '',
            title: 'Learning the market from the inside',
            body: 'The group started with a portfolio of properties and rental commitments to honour. We ran them ourselves and learned what buildings cost to deliver, what guests expect, and what an asset earns once every cost is counted.',
            meta: 'Before 2020',
            image: PHOTO_LISBON.src,
          },
          {
            icon: '',
            title: 'Smith & Adams established in Lisbon',
            body: 'A Lisbon-based group serving international clients, with independent advice first and hands-on management after the keys are handed over.',
            meta: '2020',
            image: TEAM.heroAbout.src,
          },
          {
            icon: '',
            title: 'Own brands, same standard',
            body: 'Hygge Kaffe and Hygge Residences — restaurants and branded residences we own and operate, so the hospitality standard we advise on is the one we hold every day.',
            meta: 'Hospitality',
            image: PHOTO_KITCHEN.src,
          },
          {
            icon: '',
            title: 'International footprint',
            body: 'More than 1,000 investors advised, over €300M in advised investment value, clients from 30+ countries, and an office in Dubai alongside Lisbon.',
            meta: 'Today',
            image: PHOTO_TRAM.src,
          },
          {
            icon: '',
            title: 'Recruitment under the same brand',
            body: 'This platform places assessed candidates from India with Portuguese employers — confirmed vacancies, clear steps, and the same honesty the group uses on every mandate.',
            meta: 'Recruitment',
            image: PHOTO_SITE.src,
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
  purpose: 'Team from smithandadams.com/about. Names and portraits editable in the CMS.',
  seo: {
    title: 'Organisation Chart · Smith & Adams',
    description: 'Meet the Smith & Adams team across investment, immigration, hospitality and growth.',
  },
  blocks: makeBlocks('organization-chart', [
    [
      'hero',
      {
        eyebrow: 'Corporate Info',
        title: 'Organisation Chart',
        accentWord: '',
        subtitle: 'The people who turn vision into delivery, across investment, immigration, hospitality and growth.',
        primaryCta: { label: '', href: '' },
        secondaryCta: { label: '', href: '' },
        badgeLabel: '',
        badgeHref: '',
        filmUrl: '',
        filmLabel: '',
        highlights: [],
        layout: 'overlay',
        mediaType: 'image',
        mediaSrc: TEAM.og.src,
        mediaPoster: '',
        mediaAlt: TEAM.og.alt,
        slides: slidesWithCaptions([TEAM.og, TEAM.heroAbout, PHOTO_LISBON]),
        stats: [],
      },
    ],
    ['corporate_nav', corporateNav],
    [
      'org_chart',
      {
        eyebrow: 'Management',
        title: 'Meet the team',
        intro: 'Leadership first, then the wider desk — photographs and roles match smithandadams.com/about.',
        items: [
          {
            name: 'George Hobson',
            role: 'Founder · Head of Investment & Strategy',
            level: '1',
            image: TEAM.george.src,
            bio: 'Sets how the group reads the Portuguese market and structures each commitment.',
          },
          {
            name: 'Suelen Pires',
            role: 'CEO',
            level: '1',
            image: TEAM.suelen.src,
            bio: 'Leads day-to-day delivery across the group.',
          },
          {
            name: 'Adam Ismail',
            role: 'Head of Hospitality',
            level: '2',
            image: TEAM.adam.src,
            bio: '',
          },
          {
            name: 'Joana Ribeiro',
            role: 'Head of Business Growth',
            level: '2',
            image: '',
            bio: '',
          },
          {
            name: 'Abílio Diz',
            role: 'Head of Marketing',
            level: '2',
            image: TEAM.abilio.src,
            bio: '',
          },
          {
            name: 'Teresa Cherry Pinto',
            role: 'Head of Client Relations & Asset Management',
            level: '2',
            image: TEAM.teresa.src,
            bio: '',
          },
          {
            name: 'Alex Ivatsko',
            role: 'Digital Marketing Manager',
            level: '3',
            image: TEAM.alex.src,
            bio: '',
          },
          {
            name: 'Mona Campbel',
            role: 'Data Analyst',
            level: '3',
            image: TEAM.mona.src,
            bio: '',
          },
          {
            name: 'Renato Silva',
            role: 'Revenue Manager',
            level: '3',
            image: TEAM.renato.src,
            bio: '',
          },
          {
            name: 'Taibo Karã',
            role: 'Customer Service Manager',
            level: '3',
            image: TEAM.taibo.src,
            bio: '',
          },
          {
            name: 'Soraia Fernandes',
            role: 'Hospitality Team Manager',
            level: '3',
            image: TEAM.soraia.src,
            bio: '',
          },
          {
            name: 'Benjamin Sharps',
            role: 'Senior Investor Advisor',
            level: '3',
            image: TEAM.benjamin.src,
            bio: '',
          },
          {
            name: 'Bruna Fernandes',
            role: 'Comms Team Manager',
            level: '4',
            image: TEAM.bruna.src,
            bio: '',
          },
          {
            name: 'Inês Vasconcelos',
            role: 'Public Relations Manager',
            level: '4',
            image: TEAM.ines.src,
            bio: '',
          },
          {
            name: 'Matilde Boulton',
            role: 'Designer',
            level: '4',
            image: TEAM.matilde.src,
            bio: '',
          },
          {
            name: 'João Leite',
            role: 'Customer Service Agent',
            level: '4',
            image: TEAM.joao.src,
            bio: '',
          },
          {
            name: 'Jahed Jahed',
            role: 'Customer Service Agent',
            level: '4',
            image: TEAM.jahed.src,
            bio: '',
          },
          {
            name: 'Nayane',
            role: 'OPPS Agent',
            level: '4',
            image: TEAM.nayane.src,
            bio: '',
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
