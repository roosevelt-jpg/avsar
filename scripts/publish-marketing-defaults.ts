/**
 * Force-publish marketing CMS defaults and seed missing site_settings rows.
 *
 *   npx tsx --env-file=.env.local scripts/publish-marketing-defaults.ts
 *
 * Overwrites English published rows for marketing slugs so live pages pick up
 * slideshow heroes and films from code. Seeds footer / navigation (and other
 * marketing settings) only when the key is absent, so console edits stay.
 */

import { createClient } from '@supabase/supabase-js';
import { DEFAULT_PAGES } from '../src/lib/cms/defaults';
import { sanitizeBlocks, sanitizeSeo } from '../src/lib/cms/sanitize';
import { DEFAULT_SETTINGS, type SettingsKey } from '../src/lib/cms/settings';

const SLUGS = new Set([
  'home',
  'jobs',
  'how-it-works',
  'why-portugal',
  'visa-and-relocation',
  'about',
  'contact',
  'success-stories',
  'news-and-insights',
  'cookie-policy',
  'faq',
]);

/** Marketing-facing settings the rebuild expects in the DB for the console editor. */
const SEED_SETTINGS: SettingsKey[] = [
  'footer',
  'navigation',
  'jobsBoard',
  'employerLanding',
  'employerRegistration',
  'applications',
  'general',
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const now = new Date().toISOString();
  let updated = 0;

  for (const page of DEFAULT_PAGES.filter((entry) => SLUGS.has(entry.slug))) {
    const blocks = sanitizeBlocks(page.blocks);
    const seo = sanitizeSeo(page.seo);
    const { error } = await admin.from('cms_pages').upsert(
      {
        slug: page.slug,
        locale: 'en',
        title: page.title,
        blocks,
        seo,
        published_blocks: blocks,
        published_seo: seo,
        published_at: now,
        updated_at: now,
      },
      { onConflict: 'slug,locale' },
    );
    if (error) {
      console.error(page.slug, error.message);
      process.exit(1);
    }
    updated += 1;
    console.log('published', page.slug);
  }

  console.log(`Done. Updated ${updated} English CMS pages.`);

  let seeded = 0;
  for (const key of SEED_SETTINGS) {
    const { data: existing, error: readError } = await admin
      .from('site_settings')
      .select('key')
      .eq('key', key)
      .maybeSingle();
    if (readError) {
      console.error('settings read', key, readError.message);
      process.exit(1);
    }
    if (existing) {
      console.log('settings keep', key);
      continue;
    }
    const { error } = await admin.from('site_settings').insert({
      key,
      value: DEFAULT_SETTINGS[key],
      updated_at: now,
    });
    if (error) {
      console.error('settings seed', key, error.message);
      process.exit(1);
    }
    seeded += 1;
    console.log('settings seeded', key);
  }
  console.log(`Settings seeded ${seeded}/${SEED_SETTINGS.length} missing keys.`);

  /* Force multi-slide heroes on employer Settings rows that still have a single frame. */
  for (const key of ['employerLanding', 'employerRegistration'] as const) {
    const { data: row, error: readError } = await admin.from('site_settings').select('value').eq('key', key).maybeSingle();
    if (readError) {
      console.error('slideshow read', key, readError.message);
      process.exit(1);
    }
    if (!row) continue;
    const value = { ...(row.value as Record<string, unknown>) };
    const defaults = DEFAULT_SETTINGS[key] as { slides: unknown[] };
    const current = Array.isArray(value.slides) ? value.slides : [];
    if (current.length >= 2) {
      console.log('slideshow keep', key, current.length);
      continue;
    }
    value.slides = defaults.slides;
    const { error } = await admin.from('site_settings').update({ value, updated_at: now }).eq('key', key);
    if (error) {
      console.error('slideshow update', key, error.message);
      process.exit(1);
    }
    console.log('slideshow upgraded', key, defaults.slides.length);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
