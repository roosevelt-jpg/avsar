import { NextResponse } from 'next/server';
import { signupSchema } from '@/lib/validation';
import { getSiteSettings } from '@/lib/cms/data';
import { itemSectorFor } from '@/lib/data/positions';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getSessionCandidate } from '@/lib/auth';
import { recordConsent } from '@/lib/privacy/log';

export const runtime = 'nodejs';

/**
 * Completes the profile. Nothing is charged here.
 *
 * The account and the candidate row already exist, created at the first step by
 * /api/auth/register. This finishes the profile and lets the candidate through
 * to the assessment, which is free to sit. The fee is collected afterwards, by
 * /api/payments/checkout, and is what unlocks the report.
 *
 * Which row is identified from the session, never from the request body. Before
 * accounts existed this matched on a hash of the phone number, which meant
 * anyone who typed someone else's number wrote over their record.
 *
 * The consent stored here is the record that the odds and the placement fee
 * were shown. It is taken at this step on purpose: the disclosure has to happen
 * before somebody spends ninety minutes on an assessment, not at a checkout
 * that now comes after it.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const input = parsed.data;
  const supabase = getAdminSupabase();
  const locale = request.headers.get('x-avsar-locale') ?? 'en';

  /* The session says who this is. An unauthenticated request has no row to
     complete, so it is sent back to open an account rather than quietly
     creating a second one. */
  const candidate = await getSessionCandidate();
  if (!candidate) {
    return NextResponse.json({ error: 'not_registered' }, { status: 401 });
  }

  const candidateId: string = candidate.id;

  if (supabase) {
    const CONSENT_VERSION = (await getSiteSettings()).hiring.consentVersion;
    const { error } = await supabase
      .from('candidates')
      .update({
        full_name: input.fullName,
        has_passport: input.hasPassport,
        position: input.position,
        /* The enum the item bank is keyed on, derived rather than sent: a
           browser must not be able to pick which questions it gets. */
        sector: itemSectorFor(input.position),
        years_experience_band: input.yearsExperience,
        english_self_rating: input.englishSelf ?? null,
        city_state: input.cityState,
        profile_completed_at: new Date().toISOString(),
        /* Stored, not just validated: this is the odds-disclosure consent, and
           it is the record that matters if the fee model is ever challenged. */
        consent_selection_odds_at: new Date().toISOString(),
        consent_version: CONSENT_VERSION,
        locale,
      })
      .eq('id', candidateId);

    if (error) {
      console.error('[signup] profile update failed', error);
      return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
    }
    await recordConsent(candidateId, 'selection_odds', true, 'signup', CONSENT_VERSION);
  }

  return NextResponse.json({ profileComplete: true });
}
