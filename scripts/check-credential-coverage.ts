/**
 * Names-only coverage check for hosting env + console integration_secrets.
 * Never prints secret values.
 *
 *   npx tsx --env-file=.env.local scripts/check-credential-coverage.ts
 */
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';

const NEEDED = [
  'ANTHROPIC_API_KEY',
  'RESEND_API_KEY',
  'RESEND_WEBHOOK_SECRET',
  'EMAIL_FROM',
  'CRON_SECRET',
  'WHATSAPP_VERIFY_TOKEN',
  'WHATSAPP_PROVIDER',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_APP_SECRET',
  'GREEN_API_URL',
  'GREEN_API_TOKEN',
  'GREEN_INSTANCE_ID',
  'GREEN_WEBHOOK_TOKEN',
  'PAYMENT_PROVIDER',
  'EXIMPE_CLIENT_ID',
  'EXIMPE_CLIENT_SECRET',
  'EXIMPE_ENCRYPTION_KEY',
  'EXIMPE_MERCHANT_ID',
  'INTEGRATIONS_MASTER_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'IDENTITY_HASH_SALT',
] as const;

function namesFromEnvFile(path: string): Set<string> {
  if (!existsSync(path)) return new Set();
  const out = new Set<string>();
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=/);
    if (match?.[1]) out.add(match[1]);
  }
  return out;
}

function nonempty(name: string): boolean {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

async function main() {
  const localNames = namesFromEnvFile('.env.local');
  console.log('LOCAL_ENV');
  for (const name of NEEDED) {
    const inFile = localNames.has(name);
    const filled = nonempty(name);
    console.log(`${inFile && filled ? 'yes' : inFile ? 'empty' : 'no '} ${name}`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.log('CONSOLE_SECRETS skipped (no supabase admin)');
    return;
  }

  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await admin.from('integration_secrets').select('name, updated_at').order('name');
  if (error) {
    console.log('CONSOLE_ERR', error.message);
    return;
  }
  const saved = new Set((data ?? []).map((row) => String(row.name)));
  console.log('CONSOLE_SECRET_NAMES', [...saved].join(',') || '(none)');
  console.log('CONSOLE_COVERAGE');
  for (const name of NEEDED) {
    if (
      name === 'NEXT_PUBLIC_SUPABASE_URL' ||
      name === 'SUPABASE_SERVICE_ROLE_KEY' ||
      name === 'IDENTITY_HASH_SALT' ||
      name === 'INTEGRATIONS_MASTER_KEY'
    ) {
      continue;
    }
    console.log(`${saved.has(name) ? 'yes' : 'no '} ${name}`);
  }

  /* Effective coverage: env OR console. */
  console.log('EFFECTIVE');
  for (const name of NEEDED) {
    const ok = nonempty(name) || saved.has(name);
    console.log(`${ok ? 'yes' : 'no '} ${name}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
