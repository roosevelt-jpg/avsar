/**
 * One-shot audit: published CMS + key site_settings for stale theme strings.
 *   npx tsx scripts/audit-theme-cms.ts
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i < 0) continue;
    const key = trimmed.slice(0, i);
    let value = trimmed.slice(i + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'Our Verticals', re: /Our Verticals/i },
  { name: 'lisbon.jpg', re: /lisbon\.jpg/i },
  { name: 'employer-meeting', re: /employer-meeting/i },
  { name: 'cream/terracotta hex', re: /#F4F1EA|#f4f1ea/i },
];

function hitsIn(blob: string): string[] {
  return PATTERNS.filter((p) => p.re.test(blob)).map((p) => p.name);
}

function titlesIn(blob: string): string[] {
  const out: string[] = [];
  const re = /"title":"([^"]{1,100})"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(blob)) && out.length < 14) {
    const title = match[1];
    if (title) out.push(title);
  }
  return out;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error('Missing Supabase env');
    process.exit(1);
  }
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: pages, error } = await admin.from('cms_pages').select('slug,locale,title,published_at,published_blocks,blocks');
  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log('=== cms_pages ===');
  let stalePages = 0;
  for (const page of pages ?? []) {
    const published = JSON.stringify(page.published_blocks ?? []);
    const draft = JSON.stringify(page.blocks ?? []);
    const pubHits = hitsIn(published);
    const draftHits = hitsIn(draft);
    const categoryOk = /Our Categories/i.test(published);
    const verticalsOk = !/Our Verticals/i.test(published);
    if (pubHits.length || draftHits.length || (!categoryOk && page.slug === 'home')) {
      stalePages += 1;
      console.log(
        JSON.stringify({
          slug: page.slug,
          locale: page.locale,
          published_at: page.published_at,
          pubHits,
          draftHits,
          homeCategories: page.slug === 'home' ? categoryOk && verticalsOk : undefined,
          titles: titlesIn(published).filter((t) => /vertical|categor|footprint|portugal|hire/i.test(t)),
        }),
      );
    }
  }
  if (stalePages === 0) console.log('No stale theme strings in published/draft CMS blocks.');

  const home = (pages ?? []).find((p) => p.slug === 'home' && p.locale === 'en');
  if (home) {
    const published = JSON.stringify(home.published_blocks ?? []);
    console.log('home has Our Categories:', /Our Categories/i.test(published));
    console.log('home has Our Verticals:', /Our Verticals/i.test(published));
    console.log('home has presence_map:', /presence_map/i.test(published));
  }

  console.log('=== site_settings ===');
  const { data: settings, error: settingsError } = await admin.from('site_settings').select('key,value');
  if (settingsError) {
    console.error(settingsError);
    process.exit(1);
  }
  for (const row of settings ?? []) {
    const blob = JSON.stringify(row.value ?? {});
    const found = hitsIn(blob);
    if (found.length) console.log(row.key, found);
  }
  console.log('settings keys checked:', (settings ?? []).length);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
