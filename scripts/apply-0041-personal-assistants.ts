/**
 * Applies 0041_staff_personal_assistants.sql statements that PostgREST can
 * express (columns). The SECURITY DEFINER function must be run in the
 * Supabase SQL editor if this script reports it missing.
 *
 * Run: npx tsx scripts/apply-0041-personal-assistants.ts
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

  /* Probe columns by selecting them; missing columns return an error. */
  const { error: colError } = await admin
    .from('staff_users')
    .select('whatsapp, personal_assistant')
    .limit(1);

  if (colError) {
    console.error(
      'Columns whatsapp / personal_assistant are missing. Run supabase/migrations/0041_staff_personal_assistants.sql in the Supabase SQL editor.',
      colError.message,
    );
    process.exit(2);
  }

  const { error: rpcError } = await admin.rpc('list_personal_assistants');
  if (rpcError) {
    console.error(
      'Function list_personal_assistants() is missing. Run the CREATE FUNCTION section of 0041 in the Supabase SQL editor.',
      rpcError.message,
    );
    process.exit(3);
  }

  console.log('0041 ready: staff WhatsApp columns and list_personal_assistants() are live.');
}

void main();
