/**
 * Publish DEFAULT_SETTINGS.navigation into site_settings so the live header
 * picks up Industries / Assessments / etc. without a manual Settings save.
 * Run: npx tsx scripts/refresh-navigation.ts
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEFAULT_SETTINGS } from '../src/lib/cms/settings';

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
  const admin = createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
  const navigation = DEFAULT_SETTINGS.navigation;
  const { data, error } = await admin
    .from('site_settings')
    .upsert(
      {
        key: 'navigation',
        value: navigation,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    )
    .select('key');
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log('Published navigation defaults:', data);
  console.log(
    'Items:',
    navigation.items.map((item) => item.label).join(' · '),
    '| CTA:',
    navigation.headerCta.label,
  );
}

void main();
