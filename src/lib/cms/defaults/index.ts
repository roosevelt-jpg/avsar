import type { DefaultPage } from './make';
import { HOME } from './home';
import { HOW_IT_WORKS } from './how-it-works';
import { WHY_PORTUGAL } from './why-portugal';
import { VISA } from './visa';
import { FAQ } from './faq';
import { STAY_SAFE } from './stay-safe';
import { FOR_YOUR_FAMILY } from './for-your-family';
import { ABOUT } from './about';
import { JOBS_INTRO } from './jobs';
import { LEGAL_PAGES } from './legal';

/**
 * Every CMS page, with the content it ships with.
 *
 * This is what the public site renders until an admin saves the page in the
 * console. Saving copies these blocks into the database as the starting draft;
 * "Reset to default" deletes the stored page and the site falls back here.
 *
 * `path` is the public URL under the locale: '' is the home page.
 */

export type { DefaultPage } from './make';
export { makeBlocks } from './make';

export const DEFAULT_PAGES: DefaultPage[] = [HOME, JOBS_INTRO, HOW_IT_WORKS, WHY_PORTUGAL, VISA, FAQ, STAY_SAFE, FOR_YOUR_FAMILY, ABOUT, ...LEGAL_PAGES];

export function defaultPage(slug: string): DefaultPage | undefined {
  return DEFAULT_PAGES.find((page) => page.slug === slug);
}

/** Slugs that render at /[locale]/[slug] through the CMS catch-all. */
export const CMS_ROUTED_SLUGS = DEFAULT_PAGES.filter((page) => page.slug !== 'home' && page.slug !== 'jobs').map(
  (page) => page.slug,
);
