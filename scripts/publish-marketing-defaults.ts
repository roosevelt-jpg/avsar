/**
 * Force-publish marketing CMS defaults to the linked Supabase project.
 *
 *   npx tsx --env-file=.env.local scripts/publish-marketing-defaults.ts
 *
 * Overwrites English published rows for marketing slugs so live pages pick up
 * slideshow heroes and films from code. Admins can edit afterward in CMS.
 */

import { createClient } from '@supabase/supabase-js';
import { DEFAULT_PAGES } from '../src/lib/cms/defaults';
import { sanitizeBlocks, sanitizeSeo } from '../src/lib/cms/sanitize';

const SLUGS = new Set([
  'home',
  'jobs',
  'how-it-works',
  'why-portugal',
  'visa-and-relocation',
  'about',
  'contact',
]);

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
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
