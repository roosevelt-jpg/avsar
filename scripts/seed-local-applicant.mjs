/**
 * Local / sandbox applicant (candidate) login.
 *
 * Creates (or reuses) a Supabase Auth user and a candidates row with a
 * completed profile, then prints the credentials.
 *
 *   node --env-file=.env.local scripts/seed-local-applicant.mjs
 *
 * LOCAL ONLY. Do not run against production. The password is fixed and public
 * in this file on purpose so the team can sign in to the candidate dashboard.
 */

import { createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const EMAIL = 'applicant.local@avsar.dev';
const PASSWORD = 'LocalApplicant1!';
const FULL_NAME = 'Local Demo Applicant';
const PHONE = '+919876543210';
const COHORT_ID = 'cohort-01';
const POSITION = 'chef';
const SECTOR = 'hospitality';
const CITY_STATE = 'Mumbai, Maharashtra';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const salt = process.env.IDENTITY_HASH_SALT?.trim() || 'avsar-dev-salt';

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

function identityHash(value) {
  return createHmac('sha256', salt).update(value.trim().toLowerCase()).digest('hex');
}

async function findUserIdByEmail(email) {
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
  const phoneHash = identityHash(PHONE);
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

  const now = new Date().toISOString();
  const row = {
    cohort_id: COHORT_ID,
    auth_user_id: userId,
    full_name: FULL_NAME,
    phone: PHONE,
    phone_hash: phoneHash,
    email,
    has_passport: true,
    position: POSITION,
    sector: SECTOR,
    years_experience_band: 2,
    city_state: CITY_STATE,
    locale: 'en',
    payment_status: 'pending',
    visible_to_employers: true,
    profile_completed_at: now,
    email_verified_at: now,
    consent_selection_odds_at: now,
    consent_version: 'local-seed',
  };

  const { data: byAuth } = await admin
    .from('candidates')
    .select('id')
    .eq('auth_user_id', userId)
    .maybeSingle();

  let candidateId = byAuth?.id ?? null;

  if (!candidateId) {
    const { data: byPhone } = await admin
      .from('candidates')
      .select('id')
      .eq('phone_hash', phoneHash)
      .eq('cohort_id', COHORT_ID)
      .maybeSingle();
    candidateId = byPhone?.id ?? null;
  }

  if (candidateId) {
    const { error } = await admin.from('candidates').update(row).eq('id', candidateId);
    if (error) {
      console.error('Candidate update failed:', error.message);
      process.exit(1);
    }
    console.log('Updated candidate', candidateId);
  } else {
    const { data, error } = await admin.from('candidates').insert(row).select('id').single();
    if (error || !data) {
      console.error('Candidate insert failed:', error?.message ?? 'unknown');
      process.exit(1);
    }
    candidateId = data.id;
    console.log('Created candidate', candidateId);
  }

  console.log(`
Local applicant login
  Sign-in:  /en/applicant/signin  (password tab)
  Home:     /en/dashboard
  Email:    ${EMAIL}
  Password: ${PASSWORD}
  Name:     ${FULL_NAME}
`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
