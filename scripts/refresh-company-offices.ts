/**
 * Publish DEFAULT_COMPANY.offices (with country/role) into site_settings.
 * Run: npx tsx scripts/refresh-company-offices.ts
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEFAULT_COMPANY } from '../src/lib/company/config';

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
  const { data: existing, error: readError } = await admin
    .from('site_settings')
    .select('value')
    .eq('key', 'company')
    .maybeSingle();
  if (readError) {
    console.error(readError);
    process.exit(1);
  }
  const current =
    existing?.value && typeof existing.value === 'object' ? (existing.value as Record<string, unknown>) : {};
  const next = { ...current, offices: DEFAULT_COMPANY.offices };
  const { error } = await admin.from('site_settings').upsert(
    { key: 'company', value: next, updated_at: new Date().toISOString() },
    { onConflict: 'key' },
  );
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(
    'Updated company.offices:',
    DEFAULT_COMPANY.offices.map((office) => `${office.city} (${office.country ?? ''})`).join(' · '),
  );
}

void main();
