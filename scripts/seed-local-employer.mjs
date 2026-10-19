/**
 * Local / sandbox employer login.
 *
 * Creates (or reuses) a Supabase Auth user, an employers row, and the
 * employer_users link, then prints the credentials.
 *
 *   node --env-file=.env.local scripts/seed-local-employer.mjs
 *
 * LOCAL ONLY. Do not run against production. The password is fixed and public
 * in this file on purpose so the team can sign in to the employer portal.
 */

import { createClient } from '@supabase/supabase-js';

const EMAIL = 'employer.local@avsar.dev';
const PASSWORD = 'LocalEmployer1!';
const FULL_NAME = 'Local Demo Employer';
const COMPANY = 'Local Demo Employer (Lisbon)';
const COUNTRY = 'PT';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

if (/prod|production/i.test(url) && process.env.ALLOW_LOCAL_SEEDS !== 'true') {
  console.error(
    'Refusing to seed against what looks like production. Set ALLOW_LOCAL_SEEDS=true to override.',
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserIdByEmail(email) {
  /* listUsers is paginated; for a local seed a few pages is enough. */
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((user) => user.email?.toLowerCase() === email);
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function main() {
  const email = EMAIL.toLowerCase();
  let userId = await findUserIdByEmail(email);

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: FULL_NAME },
    });
    if (error || !data.user) {
      console.error('Auth user create failed:', error?.message ?? 'unknown');
      process.exit(1);
    }
    userId = data.user.id;
    console.log('Created auth user', userId);
  } else {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: FULL_NAME },
    });
    if (error) {
      console.error('Auth user update failed:', error.message);
      process.exit(1);
    }
    console.log('Reused auth user', userId, '(password reset to seed value)');
  }

  const { data: existingLink } = await admin
    .from('employer_users')
    .select('employer_id')
    .eq('auth_user_id', userId)
    .maybeSingle();

  let employerId = existingLink?.employer_id ?? null;

  if (!employerId) {
    const { data: employer, error: employerError } = await admin
      .from('employers')
      .insert({
        name: COMPANY,
        country: COUNTRY,
        vat_number: 'LOCAL-SEED',
        vetted_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (employerError || !employer) {
      console.error('Employer insert failed:', employerError?.message ?? 'unknown');
      process.exit(1);
    }
    employerId = employer.id;

    const { error: linkError } = await admin.from('employer_users').upsert({
      auth_user_id: userId,
      employer_id: employerId,
      role: 'recruiter',
    });
    if (linkError) {
      console.error('employer_users link failed:', linkError.message);
      process.exit(1);
    }
    console.log('Created employer', employerId);
  } else {
    console.log('Already linked to employer', employerId);
  }

  console.log(`
Local employer login
  Sign-in:  /en/signin  (password tab)
  Home:     /admin/employer
  Email:    ${EMAIL}
  Password: ${PASSWORD}
  Company:  ${COMPANY}
`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
