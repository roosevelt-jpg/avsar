/**
 * Align live jobsBoard shell fields with code defaults.
 *
 *   npx tsx --env-file=.env.local scripts/patch-jobs-board-shell.ts
 */
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_SETTINGS } from '../src/lib/cms/settings';

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

  const { error } = await admin.from('site_settings').upsert({
    key: 'jobsBoard',
    value: DEFAULT_SETTINGS.jobsBoard,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  console.log('jobsBoard shell updated');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
