/**
 * Publish the code-default home page into cms_pages (en).
 * Run: npx tsx scripts/refresh-home-cms.ts
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { HOME } from '../src/lib/cms/defaults/home';
import { sanitizeBlocks, sanitizeSeo } from '../src/lib/cms/sanitize';

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i < 0) continue;
    const key = trimmed.slice(0, i);
    let value = trimmed.slice(i + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function main() {
  const blocks = sanitizeBlocks(HOME.blocks);
  const seo = sanitizeSeo(HOME.seo);
  const now = new Date().toISOString();

  const admin = createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin
    .from('cms_pages')
    .upsert(
      {
        slug: 'home',
        locale: 'en',
        title: HOME.title,
        blocks,
        seo,
        published_blocks: blocks,
        published_seo: seo,
        published_at: now,
        updated_at: now,
      },
      { onConflict: 'slug,locale' },
    )
    .select('slug');

  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log('Published home defaults:', data);
}

void main();
