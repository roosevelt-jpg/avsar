/**
 * Reads Desktop/KKY.txt (or a path arg), pushes named secrets to Vercel
 * (production/preview/development), merges into .env.local, and removes
 * matching console integration_secrets rows so hosting env is the source of
 * truth (avoids a stale encrypted row overriding Vercel).
 *
 * Never prints secret values.
 *
 *   npx tsx --env-file=.env.local scripts/wire-kky-credentials.ts
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const TARGETS = ['production', 'preview', 'development'] as const;

const DEFAULT_PATH = join(homedir(), 'Desktop', 'KKY.txt');

function parseLoose(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    if (/^from\s*address\s*:/i.test(line)) {
      out.EMAIL_FROM = line.replace(/^from\s*address\s*:/i, '').trim();
      continue;
    }
    if (/^anthropic\s*:/i.test(line)) {
      out.ANTHROPIC_API_KEY = line.replace(/^anthropic\s*:/i, '').trim();
      continue;
    }
    if (/^use this cron_secret\s*:/i.test(line)) {
      out.CRON_SECRET = line.replace(/^use this cron_secret\s*:/i, '').trim();
      continue;
    }
    if (/^verify\s*token\s*:/i.test(line)) continue;

    const eq = line.match(/^([A-Z][A-Z0-9_]*)\s*=\s*(.+)$/);
    if (eq?.[1] && eq[2]) {
      out[eq[1]] = eq[2].trim();
    }
  }
  return out;
}

function vercelEnvSet(name: string, value: string, target: string): boolean {
  spawnSync('npx', ['vercel', 'env', 'rm', name, target, '--yes'], {
    stdio: ['ignore', 'ignore', 'ignore'],
    shell: true,
  });
  const added = spawnSync('npx', ['vercel', 'env', 'add', name, target], {
    input: value,
    encoding: 'utf8',
    shell: true,
  });
  return added.status === 0;
}

function upsertLocalEnv(path: string, values: Record<string, string>) {
  const existing = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const map = new Map<string, string>();
  const order: string[] = [];
  for (const line of existing.split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (match?.[1]) {
      if (!map.has(match[1])) order.push(match[1]);
      map.set(match[1], match[2] ?? '');
    }
  }
  for (const [name, value] of Object.entries(values)) {
    if (!map.has(name)) order.push(name);
    map.set(name, value);
  }
  const body = order.map((name) => `${name}=${map.get(name) ?? ''}`).join('\n') + '\n';
  writeFileSync(path, body, 'utf8');
}

async function clearConsoleSecrets(names: string[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.log('console: skip (no supabase admin in env)');
    return;
  }
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await admin.from('integration_secrets').delete().in('name', names);
  if (error) {
    console.log(`console: clear failed (${error.message})`);
    return;
  }
  console.log(`console: cleared ${names.join(', ')}`);
}

async function main() {
  const path = process.argv[2] || DEFAULT_PATH;
  if (!existsSync(path)) {
    console.error(`Missing credentials file: ${path}`);
    process.exit(1);
  }

  const parsed = parseLoose(readFileSync(path, 'utf8'));
  const wanted = [
    'RESEND_WEBHOOK_SECRET',
    'EMAIL_FROM',
    'WHATSAPP_PROVIDER',
    'GREEN_INSTANCE_ID',
    'GREEN_API_TOKEN',
    'GREEN_API_URL',
    'GREEN_WEBHOOK_TOKEN',
    'CRON_SECRET',
    'ANTHROPIC_API_KEY',
  ] as const;

  const values: Record<string, string> = {};
  for (const name of wanted) {
    const value = parsed[name]?.trim();
    if (!value) {
      console.log(`skip  ${name} (not in file)`);
      continue;
    }
    values[name] = value;
  }

  if (!values.RESEND_API_KEY) {
    console.log('note  RESEND_API_KEY not in KKY.txt — leaving existing console/Vercel value alone');
  }

  console.log(`wiring ${Object.keys(values).length} keys from ${path}`);

  for (const [name, value] of Object.entries(values)) {
    let ok = 0;
    for (const target of TARGETS) {
      if (vercelEnvSet(name, value, target)) ok += 1;
    }
    console.log(ok === TARGETS.length ? `set   ${name} (${TARGETS.join(', ')})` : `partial ${name} (${ok}/${TARGETS.length})`);
  }

  upsertLocalEnv('.env.local', values);
  console.log('local: updated .env.local');

  /* Hosting env is authoritative for these; drop console copies so a bad
     decrypt cannot override the live Vercel values. Keep RESEND_API_KEY /
     PAYMENT_PROVIDER if present — they were not in KKY.txt. */
  await clearConsoleSecrets(Object.keys(values));

  console.log('done. Redeploy production to load the new env.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
