import { getAdminSupabase } from '@/lib/supabase/admin';
import { log } from '@/lib/observability/log';
import { MANAGED_FIELDS } from './catalog';
import { decryptValue } from './crypto';

/**
 * Applies the values saved on the Integrations page to `process.env`.
 *
 * The payment adapters, the mailer and the rest read `process.env` directly,
 * and keeping it that way means a value can come from either place without
 * every caller knowing. A console value wins over the hosting environment;
 * clearing it in the console brings the environment value back.
 *
 * Each server instance refreshes at most once a minute, from the entry points
 * that use a key (checkout, webhooks, email, cron), so a saved change is live
 * everywhere within about a minute.
 */

const MAX_AGE_MS = 60_000;
const ORIGINAL = new Map<string, string | undefined>();
let loadedAt = 0;
let inFlight: Promise<void> | null = null;

function snapshotOriginals() {
  if (ORIGINAL.size > 0) return;
  for (const field of MANAGED_FIELDS) ORIGINAL.set(field.name, process.env[field.name]);
}

async function load(): Promise<void> {
  const admin = getAdminSupabase();
  if (!admin) return;
  snapshotOriginals();
  const { data, error } = await admin.from('integration_secrets').select('name, ciphertext, iv, tag');
  if (error) {
    log.warn('integrations.load_failed', { error: error.message });
    return;
  }
  const saved = new Map<string, string>();
  for (const row of data ?? []) {
    const value = decryptValue(row as { ciphertext: string; iv: string; tag: string });
    if (value === null) log.warn('integrations.decrypt_failed', { name: String(row.name) });
    else saved.set(String(row.name), value);
  }
  for (const field of MANAGED_FIELDS) {
    const value = saved.has(field.name) ? saved.get(field.name) : ORIGINAL.get(field.name);
    if (value === undefined) delete process.env[field.name];
    else process.env[field.name] = value;
  }
  loadedAt = Date.now();
}

/** Never throws: a stale key is better than a failed checkout. */
export async function refreshIntegrations(force = false): Promise<void> {
  if (!force && Date.now() - loadedAt < MAX_AGE_MS) return;
  if (!inFlight) inFlight = load().finally(() => (inFlight = null));
  try {
    await inFlight;
  } catch (error) {
    log.warn('integrations.refresh_failed', { error: error instanceof Error ? error.message : String(error) });
  }
}

/** Where each managed value currently comes from, for the console. */
export function integrationSource(name: string, savedNames: ReadonlySet<string>): 'console' | 'environment' | 'missing' {
  if (savedNames.has(name)) return 'console';
  snapshotOriginals();
  return ORIGINAL.get(name) ? 'environment' : 'missing';
}
