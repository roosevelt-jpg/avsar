import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionCandidate } from '@/lib/auth';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const schema = z.object({ optIn: z.boolean() });

/**
 * Turns WhatsApp updates on or off for the signed-in candidate.
 *
 * The service role writes the row because the column is not one candidates
 * can update directly; the candidate id comes from the session, never the body.
 * Opting out clears the timestamp, so the sender stops at once.
 */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ saved: false, reason: 'storage_unconfigured' });

  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { error } = await admin
    .from('candidates')
    .update({ whatsapp_opt_in_at: parsed.data.optIn ? new Date().toISOString() : null })
    .eq('id', candidate.id);

  if (error) {
    console.error('[whatsapp-pref] update failed', error);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }
  return NextResponse.json({ saved: true });
}
