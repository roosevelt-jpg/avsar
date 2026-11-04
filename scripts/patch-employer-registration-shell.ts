/**
 * Align live employerRegistration shell fields with code defaults.
 *
 *   npx tsx --env-file=.env.local scripts/patch-employer-registration-shell.ts
 */
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_EMPLOYER_REGISTRATION } from '../src/lib/cms/employer-registration';

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

  const { data, error } = await admin
    .from('site_settings')
    .select('value')
    .eq('key', 'employerRegistration')
    .maybeSingle();
  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  const current = (data?.value as Record<string, unknown> | null) ?? {};
  const next = {
    ...current,
    ...DEFAULT_EMPLOYER_REGISTRATION,
    // Keep any console-only option lists if already customised.
    industryOptions:
      Array.isArray(current.industryOptions) && (current.industryOptions as unknown[]).length > 0
        ? current.industryOptions
        : DEFAULT_EMPLOYER_REGISTRATION.industryOptions,
    countryOptions:
      Array.isArray(current.countryOptions) && (current.countryOptions as unknown[]).length > 0
        ? current.countryOptions
        : DEFAULT_EMPLOYER_REGISTRATION.countryOptions,
    companySizeOptions:
      Array.isArray(current.companySizeOptions) && (current.companySizeOptions as unknown[]).length > 0
        ? current.companySizeOptions
        : DEFAULT_EMPLOYER_REGISTRATION.companySizeOptions,
    employmentOptions:
      Array.isArray(current.employmentOptions) && (current.employmentOptions as unknown[]).length > 0
        ? current.employmentOptions
        : DEFAULT_EMPLOYER_REGISTRATION.employmentOptions,
    timelineOptions:
      Array.isArray(current.timelineOptions) && (current.timelineOptions as unknown[]).length > 0
        ? current.timelineOptions
        : DEFAULT_EMPLOYER_REGISTRATION.timelineOptions,
  };

  const { error: writeError } = await admin.from('site_settings').upsert({
    key: 'employerRegistration',
    value: next,
    updated_at: new Date().toISOString(),
  });
  if (writeError) {
    console.error(writeError.message);
    process.exit(1);
  }

  console.log('employerRegistration shell updated');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
