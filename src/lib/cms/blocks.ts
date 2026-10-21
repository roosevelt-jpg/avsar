/**
 * The CMS block registry. Client-safe.
 *
 * One definition per block type drives three things, so they cannot drift:
 *   - the editor form (src/components/admin/cms/BlockForm.tsx renders `fields`)
 *   - server-side sanitising (src/lib/cms/sanitize.ts walks `fields`)
 *   - the empty block an editor gets when they press "Add block" (`empty`)
 *
 * The renderer (src/components/cms/BlockRenderer.tsx) is the only place that
 * knows how each type looks. Adding a block type is: a definition here, a
 * component there, and a case in the renderer's switch.
 */

export const ICONS = [
  'shield', 'check', 'rupee', 'globe', 'home', 'chat', 'briefcase', 'plane',
  'document', 'star', 'clock', 'users', 'phone', 'heart', 'graduation', 'map',
  'euro',
] as const;
export type IconName = (typeof ICONS)[number];

export type Field =
  | { kind: 'text'; name: string; label: string; help?: string; max?: number; placeholder?: string }
  | { kind: 'textarea'; name: string; label: string; help?: string; max?: number; rows?: number; markdown?: boolean }
  | { kind: 'url'; name: string; label: string; help?: string }
  | { kind: 'media'; name: string; label: string; help?: string; accept: 'image' | 'video' | 'any'; optional?: boolean }
  | { kind: 'number'; name: string; label: string; help?: string; min: number; max: number }
  | { kind: 'select'; name: string; label: string; help?: string; options: { value: string; label: string }[] }
  | { kind: 'boolean'; name: string; label: string; help?: string }
  /* optional: an empty link is left out of the saved data rather than stored
     as a blank pair, so content written without it stays unchanged. */
  | { kind: 'link'; name: string; label: string; help?: string; optional?: boolean }
  | { kind: 'stringList'; name: string; label: string; help?: string; max?: number }
  | { kind: 'list'; name: string; label: string; help?: string; itemLabel: string; fields: Field[]; max?: number };

export type BlockData = Record<string, unknown>;

export type Block = {
  /** Stable within a page, so React keys and the editor survive reordering. */
  id: string;
  type: BlockType;
  /** Hidden blocks stay in the draft but are not rendered. */
  hidden?: boolean;
  data: BlockData;
};

export type CmsLink = { label: string; href: string };

const iconOptions = ICONS.map((icon) => ({ value: icon, label: icon }));
const eyebrow: Field = { kind: 'text', name: 'eyebrow', label: 'Eyebrow', help: 'Small label above the title', max: 80 };
const title: Field = { kind: 'text', name: 'title', label: 'Title', max: 160 };
const intro: Field = { kind: 'textarea', name: 'intro', label: 'Intro', rows: 3, max: 600 };

type Definition = {
  label: string;
  description: string;
  fields: Field[];
  empty: BlockData;
};

export const BLOCKS = {
  hero: {
    label: 'Hero',
    description: 'The top of a page: headline, subtitle, buttons and an image or film.',
    fields: [
      eyebrow,
      { kind: 'text', name: 'title', label: 'Headline', max: 160 },
      { kind: 'textarea', name: 'subtitle', label: 'Subtitle', rows: 3, max: 500 },
      { kind: 'link', name: 'primaryCta', label: 'Primary button' },
      { kind: 'link', name: 'secondaryCta', label: 'Secondary link', help: 'Shown as a text link, so the primary button stays the one obvious action' },
      {
        kind: 'media',
        name: 'filmUrl',
        label: 'Film to play',
        help: 'A YouTube link or an uploaded film. Adds a "watch" button that plays it in a pop-up; YouTube loads only when pressed.',
        accept: 'video',
      },
      { kind: 'text', name: 'filmLabel', label: 'Film button text', help: 'e.g. "Watch how it works · 53 seconds"', max: 80 },
      { kind: 'stringList', name: 'highlights', label: 'Highlights', help: 'Short ticks under the buttons', max: 5 },
      { kind: 'text', name: 'intentsLabel', label: 'Choices question', help: 'e.g. "What would you like to do?" Shown above the choice buttons', max: 80 },
      {
        kind: 'list',
        name: 'intents',
        label: 'Choice buttons',
        help: 'Rounded buttons that send each visitor straight to the right page',
        itemLabel: 'Choice',
        max: 6,
        fields: [
          { kind: 'select', name: 'icon', label: 'Icon', options: iconOptions },
          { kind: 'text', name: 'label', label: 'Label', max: 40 },
          { kind: 'url', name: 'href', label: 'Goes to' },
          { kind: 'media', name: 'image', label: '3D image', help: 'Optional. With images, the choices show as picture cards instead of small buttons', accept: 'image', optional: true },
        ],
      },
      {
        kind: 'stringList',
        name: 'bubbles',
        label: 'Background bubbles',
        help: 'Short phrases that float either side of the headline on wide screens (1536px and up), e.g. "Interview on Zoom". Keep each one true and under 30 characters.',
        max: 12,
      },
      {
        kind: 'boolean',
        name: 'liveProof',
        label: 'Show live numbers under the headline',
        help: 'Counted from the database: tests finished, people put forward, people hired. Shown only once at least 50 people have finished the test.',
      },
      {
        kind: 'boolean',
        name: 'routeMap',
        label: 'Show the India to Portugal map watermark',
        help: 'A very faint map behind the headline with flight routes from Delhi and Mumbai to Lisbon and Porto.',
      },
      {
        kind: 'select',
        name: 'layout',
        label: 'Layout',
        options: [
          { value: 'split', label: 'Text beside the media' },
          { value: 'stacked', label: 'Text centred, media wide underneath' },
        ],
      },
      {
        kind: 'select',
        name: 'mediaType',
        label: 'Media',
        options: [
          { value: 'video', label: 'Film' },
          { value: 'image', label: 'Image' },
          { value: 'none', label: 'None (centred text)' },
        ],
      },
      { kind: 'media', name: 'mediaSrc', label: 'Image or film', accept: 'any' },
      { kind: 'media', name: 'mediaPoster', label: 'Film poster image', accept: 'image' },
      { kind: 'text', name: 'mediaAlt', label: 'Image description (for screen readers)', max: 200 },
      {
        kind: 'list',
        name: 'stats',
        label: 'Stats strip',
        itemLabel: 'Stat',
        max: 4,
        fields: [
          { kind: 'text', name: 'value', label: 'Value', max: 40 },
          { kind: 'text', name: 'label', label: 'Label', max: 80 },
        ],
      },
    ],
    empty: { eyebrow: '', title: 'New headline', subtitle: '', primaryCta: { label: '', href: '' }, secondaryCta: { label: '', href: '' }, filmUrl: '', filmLabel: '', highlights: [], intentsLabel: '', intents: [], bubbles: [], liveProof: false, routeMap: false, layout: 'split', mediaType: 'none', mediaSrc: '', mediaPoster: '', mediaAlt: '', stats: [] },
  },
  trust_bar: {
    label: 'Trust bar',
    description: 'A row of short reassurance points with icons.',
    fields: [
      {
        kind: 'list',
        name: 'items',
        label: 'Points',
        itemLabel: 'Point',
        max: 6,
        fields: [
          { kind: 'select', name: 'icon', label: 'Icon', options: iconOptions },
          { kind: 'text', name: 'title', label: 'Title', max: 60 },
          { kind: 'text', name: 'body', label: 'Detail', max: 140 },
        ],
      },
    ],
    empty: { items: [] },
  },
  stats: {
    label: 'Numbers',
    description: 'Large figures with a label each.',
    fields: [
      eyebrow,
      title,
      {
        kind: 'list',
        name: 'items',
        label: 'Numbers',
        itemLabel: 'Number',
        max: 6,
        fields: [
          { kind: 'text', name: 'value', label: 'Value', max: 40 },
          { kind: 'text', name: 'label', label: 'Label', max: 80 },
          { kind: 'text', name: 'note', label: 'Note', max: 160 },
        ],
      },
    ],
    empty: { eyebrow: '', title: '', items: [] },
  },
  live_funnel: {
    label: 'Live odds',
    description:
      'Out of every 100 people who finish the test, how many qualify, are put forward to an employer and are hired. Counted live from the database, never typed in.',
    fields: [
      eyebrow,
      title,
      intro,
      { kind: 'text', name: 'completedLabel', label: 'Stage 1 label', max: 120 },
      { kind: 'text', name: 'qualifiedLabel', label: 'Stage 2 label', help: '{{shortlist_score}} is the score out of 10', max: 120 },
      { kind: 'text', name: 'shortlistedLabel', label: 'Stage 3 label', max: 120 },
      { kind: 'text', name: 'hiredLabel', label: 'Stage 4 label', max: 120 },
      {
        kind: 'number',
        name: 'minSample',
        label: 'Publish rates from',
        help: 'Finished tests needed before percentages are shown. Below this, the waiting text is shown instead, because a rate from a handful of people misleads.',
        min: 1,
        max: 100000,
      },
      {
        kind: 'textarea',
        name: 'pendingText',
        label: 'Waiting text',
        help: '{{finished}} is how many have finished so far, {{min_sample}} the number above.',
        rows: 3,
        max: 600,
      },
      { kind: 'textarea', name: 'note', label: 'Note under the figures', rows: 3, max: 600 },
      { kind: 'link', name: 'cta', label: 'Link', help: 'Shown as a text link, not a button' },
    ],
    empty: {
      eyebrow: '',
      title: 'Where people actually get to',
      intro: '',
      completedLabel: 'finish the free test',
      qualifiedLabel: 'score above {{shortlist_score}} out of 10',
      shortlistedLabel: 'are put forward to an employer',
      hiredLabel: 'are hired',
      minSample: 50,
      pendingText: '{{finished}} people have finished the test so far. We publish these rates once {{min_sample}} have, because a rate from a handful of people misleads.',
      note: '',
      cta: { label: '', href: '' },
    },
  },
  steps: {
    label: 'Steps',
    description: 'A numbered process, optionally with a picture per step.',
    fields: [
      eyebrow,
      title,
      intro,
      {
        kind: 'list',
        name: 'items',
        label: 'Steps',
        itemLabel: 'Step',
        max: 10,
        fields: [
          { kind: 'text', name: 'title', label: 'Title', max: 100 },
          { kind: 'textarea', name: 'body', label: 'Body', rows: 3, max: 500 },
          { kind: 'text', name: 'meta', label: 'Small label', help: 'e.g. "Day 1" or "Free"', max: 40 },
          { kind: 'media', name: 'image', label: 'Image', accept: 'image' },
        ],
      },
      {
        kind: 'select',
        name: 'layout',
        label: 'Layout',
        help: 'Both layouts show a picture on each step. Timeline is the tighter grid.',
        options: [
          { value: 'cards', label: 'Cards' },
          { value: 'timeline', label: 'Timeline' },
        ],
      },
    ],
    empty: { eyebrow: '', title: 'How it works', intro: '', items: [], layout: 'cards' },
  },
  features: {
    label: 'Feature grid',
    description: 'Cards with an icon, a title and a sentence.',
    fields: [
      eyebrow,
      title,
      intro,
      {
        kind: 'select',
        name: 'columns',
        label: 'Columns',
        options: [
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
        ],
      },
      {
        kind: 'list',
        name: 'items',
        label: 'Cards',
        itemLabel: 'Card',
        max: 12,
        fields: [
          { kind: 'select', name: 'icon', label: 'Icon', options: iconOptions },
          { kind: 'text', name: 'title', label: 'Title', max: 100 },
          { kind: 'textarea', name: 'body', label: 'Body', rows: 3, max: 400 },
          { kind: 'link', name: 'link', label: 'Link', help: 'Optional. Shown as "Learn more" style text under the card', optional: true },
          { kind: 'media', name: 'image', label: '3D image', help: 'Optional. Shown floating at the top of the card in place of the icon', accept: 'image', optional: true },
        ],
      },
      {
        kind: 'boolean',
        name: 'typing',
        label: 'Type the card text as it scrolls into view',
        help: 'The text writes itself out once, like someone typing. Visitors who turn off motion see it straight away.',
      },
      {
        kind: 'select',
        name: 'style',
        label: 'Style',
        options: [
          { value: 'cards', label: 'White cards' },
          { value: 'tiles', label: 'Soft coloured tiles' },
        ],
      },
    ],
    empty: { eyebrow: '', title: '', intro: '', columns: '3', items: [], style: 'cards', typing: false },
  },
  split: {
    label: 'Image and text',
    description: 'A picture on one side, words on the other.',
    fields: [
      eyebrow,
      title,
      { kind: 'textarea', name: 'body', label: 'Body', rows: 6, max: 3000, markdown: true },
      { kind: 'stringList', name: 'bullets', label: 'Bullet points', max: 8 },
      { kind: 'link', name: 'cta', label: 'Button' },
      { kind: 'media', name: 'image', label: 'Image', accept: 'image' },
      { kind: 'text', name: 'imageAlt', label: 'Image description', max: 200 },
      {
        kind: 'list',
        name: 'gallery',
        label: 'More images',
        help: 'Shown in turn with the main image. Leave empty for one picture.',
        itemLabel: 'Image',
        max: 6,
        fields: [
          { kind: 'media', name: 'src', label: 'Image', accept: 'image' },
          { kind: 'text', name: 'alt', label: 'Description', max: 200 },
        ],
      },
      {
        kind: 'select',
        name: 'imageSide',
        label: 'Image side',
        options: [
          { value: 'right', label: 'Right' },
          { value: 'left', label: 'Left' },
        ],
      },
    ],
    empty: { eyebrow: '', title: '', body: '', bullets: [], cta: { label: '', href: '' }, image: '', imageAlt: '', imageSide: 'right', gallery: [] },
  },
  featured_jobs: {
    label: 'Open jobs',
    description: 'The newest published jobs, live from the jobs board.',
    fields: [
      eyebrow,
      title,
      intro,
      { kind: 'number', name: 'limit', label: 'How many', min: 1, max: 12 },
      { kind: 'link', name: 'cta', label: 'Button' },
    ],
    empty: { eyebrow: '', title: 'Open positions', intro: '', limit: 6, cta: { label: 'See all jobs', href: '/jobs' } },
  },
  job_categories: {
    label: 'Job categories',
    description: 'Every position we recruit for, with photographs, linking to the jobs board.',
    fields: [eyebrow, title, intro],
    empty: { eyebrow: '', title: 'Roles we recruit for', intro: '' },
  },
  video: {
    label: 'Film',
    description: 'An uploaded film or a YouTube link.',
    fields: [
      eyebrow,
      title,
      intro,
      { kind: 'media', name: 'src', label: 'Film (upload, or paste a YouTube link)', accept: 'video' },
      { kind: 'media', name: 'poster', label: 'Poster image', accept: 'image' },
      { kind: 'text', name: 'caption', label: 'Caption', max: 200 },
    ],
    empty: { eyebrow: '', title: '', intro: '', src: '', poster: '', caption: '' },
  },
  gallery: {
    label: 'Gallery',
    description: 'A grid of photographs.',
    fields: [
      eyebrow,
      title,
      {
        kind: 'list',
        name: 'items',
        label: 'Images',
        itemLabel: 'Image',
        max: 24,
        fields: [
          { kind: 'media', name: 'image', label: 'Image', accept: 'image' },
          { kind: 'text', name: 'alt', label: 'Description', max: 200 },
          { kind: 'text', name: 'caption', label: 'Caption', max: 140 },
        ],
      },
    ],
    empty: { eyebrow: '', title: '', items: [] },
  },
  testimonials: {
    label: 'Testimonials',
    description: 'Quotes from real candidates or employers. Only publish quotes you have written permission to use.',
    fields: [
      eyebrow,
      title,
      {
        kind: 'list',
        name: 'items',
        label: 'Quotes',
        itemLabel: 'Quote',
        max: 9,
        fields: [
          { kind: 'textarea', name: 'quote', label: 'Quote', rows: 3, max: 600 },
          { kind: 'text', name: 'name', label: 'Name', max: 80 },
          { kind: 'text', name: 'detail', label: 'Role and place', help: 'e.g. "Line cook, Algarve. From Kochi."', max: 120 },
          { kind: 'media', name: 'photo', label: 'Photo', accept: 'image' },
        ],
      },
    ],
    empty: { eyebrow: '', title: 'In their words', items: [] },
  },
  candidate_stories: {
    label: 'Stories from placed candidates',
    description:
      'Stories written by candidates we placed, live from the relocation queue. Only stories the candidate submitted and staff approved appear; nothing is shown when there are none.',
    fields: [eyebrow, title, intro, { kind: 'number', name: 'limit', label: 'How many', min: 1, max: 9 }],
    empty: { eyebrow: '', title: 'From people who made the move', intro: '', limit: 3 },
  },
  faq: {
    label: 'FAQ',
    description: 'Questions and answers that open one at a time.',
    fields: [
      eyebrow,
      title,
      intro,
      {
        kind: 'list',
        name: 'items',
        label: 'Questions',
        itemLabel: 'Question',
        max: 40,
        fields: [
          { kind: 'text', name: 'question', label: 'Question', max: 200 },
          { kind: 'textarea', name: 'answer', label: 'Answer', rows: 4, max: 2000, markdown: true },
        ],
      },
    ],
    empty: { eyebrow: '', title: 'Questions', intro: '', items: [] },
  },
  cta: {
    label: 'Call to action',
    description: 'A band with a headline and buttons.',
    fields: [
      title,
      { kind: 'textarea', name: 'body', label: 'Body', rows: 3, max: 500 },
      { kind: 'link', name: 'primary', label: 'Primary button' },
      { kind: 'link', name: 'secondary', label: 'Secondary button' },
    ],
    empty: { title: '', body: '', primary: { label: '', href: '' }, secondary: { label: '', href: '' } },
  },
  rich_text: {
    label: 'Text',
    description: 'Headings, paragraphs, lists and links.',
    fields: [
      eyebrow,
      title,
      { kind: 'textarea', name: 'body', label: 'Body', rows: 12, max: 20000, markdown: true },
      {
        kind: 'select',
        name: 'width',
        label: 'Width',
        options: [
          { value: 'narrow', label: 'Narrow (reading)' },
          { value: 'wide', label: 'Wide' },
        ],
      },
    ],
    empty: { eyebrow: '', title: '', body: '', width: 'narrow' },
  },
  notice: {
    label: 'Notice',
    description: 'A highlighted box: a warning, a tip, or good news.',
    fields: [
      {
        kind: 'select',
        name: 'tone',
        label: 'Style',
        options: [
          { value: 'warning', label: 'Warning' },
          { value: 'info', label: 'Information' },
          { value: 'success', label: 'Good news' },
        ],
      },
      title,
      { kind: 'textarea', name: 'body', label: 'Body', rows: 4, max: 2000, markdown: true },
    ],
    empty: { tone: 'info', title: '', body: '' },
  },
  contact_cards: {
    label: 'Contact cards',
    description: 'Phone, WhatsApp, email and office, read from Site settings.',
    fields: [eyebrow, title, intro],
    empty: { eyebrow: '', title: 'Talk to a person', intro: '' },
  },
  document: {
    label: 'Document',
    description: 'A full page of text with its own page title: terms, policies, rules.',
    fields: [
      { kind: 'text', name: 'title', label: 'Page title', help: 'The main heading of the page', max: 160 },
      { kind: 'text', name: 'updated', label: 'Last updated', help: 'e.g. 15 October 2026. Leave empty to hide.', max: 60 },
      {
        kind: 'textarea',
        name: 'body',
        label: 'Text',
        help: '## for a section heading, - for a list item, **bold**, [link text](/path). Placeholders such as {{legal_name}} are filled from Settings.',
        rows: 24,
        max: 40000,
        markdown: true,
      },
    ],
    empty: { title: '', updated: '', body: '' },
  },
  contact_form: {
    label: 'Contact form',
    description: 'The message form. Messages arrive in the console inbox.',
    fields: [{ kind: 'text', name: 'title', label: 'Page title', help: 'Shown as the main heading', max: 160 }, intro],
    empty: { title: 'Contact us', intro: '' },
  },
} satisfies Record<string, Definition>;

export type BlockType = keyof typeof BLOCKS;
export const BLOCK_TYPES = Object.keys(BLOCKS) as BlockType[];

export function isBlockType(value: string): value is BlockType {
  return value in BLOCKS;
}

export function newBlockId(): string {
  return `b_${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyBlock(type: BlockType): Block {
  return { id: newBlockId(), type, data: structuredClone(BLOCKS[type].empty) as BlockData };
}

// --------------------------------------------------------- reading helpers
// Renderers receive `data` as unknown-shaped JSON. These keep them short and
// make every field optional at the point of use.

export function str(data: BlockData, key: string): string {
  const value = data[key];
  return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
}

export function num(data: BlockData, key: string, fallback: number): number {
  const value = Number(data[key]);
  return Number.isFinite(value) ? value : fallback;
}

export function strList(data: BlockData, key: string): string[] {
  const value = data[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0) : [];
}

export function items(data: BlockData, key: string): BlockData[] {
  const value = data[key];
  return Array.isArray(value) ? value.filter((item): item is BlockData => typeof item === 'object' && item !== null) : [];
}

export function link(data: BlockData, key: string): CmsLink | null {
  const value = data[key];
  if (!value || typeof value !== 'object') return null;
  const { label, href } = value as Record<string, unknown>;
  return typeof label === 'string' && typeof href === 'string' && label && href ? { label, href } : null;
}
