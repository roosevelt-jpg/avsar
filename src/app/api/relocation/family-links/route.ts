import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionCandidate } from '@/lib/auth';
import { recordConsent } from '@/lib/privacy/log';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const runtime = 'nodejs';

const schema = z.object({ label: z.string().trim().min(1).max(60), consent: z.literal(true) }).strict();
const MAX_ACTIVE = 5;

/**
 * A progress page for the candidate's family.
 *
 * In India the family often pays for and decides on a move abroad, and they
 * have heard of agents who take money and vanish. A page they can open
 * themselves, showing the real steps and the real dates, answers that better
 * than reassurance. It shows the job, the city and the progress; never salary,
 * employer, documents or contact details. The candidate creates it, can see
 * how often it was opened, and can switch it off at any time.
 *
 * The token is shown once and only its hash is stored, so a database leak
 * does not hand out working links.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'demo_mode', message: 'Supabase is not configured, so nothing can be saved.' }, { status: 503 });
  }
  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { count } = await admin.from('family_links').select('id', { count: 'exact', head: true }).eq('candidate_id', candidate.id).is('revoked_at', null);
  if ((count ?? 0) >= MAX_ACTIVE) return NextResponse.json({ error: 'too_many_links' }, { status: 409 });

  const token = randomBytes(24).toString('base64url');
  const { error } = await admin.from('family_links').insert({
    candidate_id: candidate.id,
    token_hash: createHash('sha256').update(token).digest('hex'),
    label: parsed.data.label,
  });
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });

  await recordConsent(candidate.id, 'family_link', true, 'dashboard');
  return NextResponse.json({ url: `${new URL(request.url).origin}/family/${token}` }, { status: 201 });
}

/** Switch a link off. The page stops working at once. */
export async function DELETE(request: Request) {
  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'demo_mode' }, { status: 503 });

  const { data } = await admin
    .from('family_links')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', parsed.data.id)
    .eq('candidate_id', candidate.id)
    .is('revoked_at', null)
    .select('id');
  if (data && data.length > 0) await recordConsent(candidate.id, 'family_link', false, 'dashboard');
  return NextResponse.json({ status: 'revoked' });
}
