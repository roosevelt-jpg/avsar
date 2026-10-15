import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionCandidate } from '@/lib/auth';
import { notifyStaff } from '@/lib/notifications/staff';
import { clientIp, rateLimit, rateLimitedResponse, RATE_LIMITS } from '@/lib/security/rate-limit';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const runtime = 'nodejs';

const schema = z
  .object({
    kind: z.enum(['erase', 'correct']),
    message: z.string().trim().max(2000).optional(),
  })
  .strict();

const LABEL = { erase: 'Erase my data', correct: 'Correct my data' } as const;

/**
 * A candidate asks us to delete or correct their data.
 *
 * Erasure is not self-service, on purpose: if a contract or visa file is in
 * progress, deleting the person would break it, and someone should explain
 * that rather than a button refusing. The request lands in the inbox as a
 * privacy request, the privacy lead is notified, and the answer is due within
 * a month (GDPR article 12).
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'demo_mode', message: 'Supabase is not configured, so nothing can be saved.' }, { status: 503 });
  }
  const limited = await rateLimit(RATE_LIMITS.contact, clientIp(request));
  if (!limited.ok) return rateLimitedResponse(limited);

  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  /* One open request per kind is enough; pressing twice should not make two. */
  const { data: open } = await admin
    .from('leads')
    .select('id')
    .eq('candidate_id', candidate.id)
    .eq('kind', 'privacy')
    .neq('status', 'closed')
    .ilike('message', `${LABEL[parsed.data.kind]}%`)
    .limit(1);
  if (open && open.length > 0) return NextResponse.json({ status: 'already_requested' });

  const { data, error } = await admin
    .from('leads')
    .insert({
      kind: 'privacy',
      topic: 'privacy',
      full_name: candidate.fullName,
      email: candidate.email,
      message: `${LABEL[parsed.data.kind]}${parsed.data.message ? `\n\n${parsed.data.message}` : ''}`,
      source: 'dashboard',
      locale: candidate.locale,
      candidate_id: candidate.id,
    })
    .select('id')
    .single();
  if (error || !data) return NextResponse.json({ error: 'save_failed' }, { status: 500 });

  await notifyStaff({
    permission: 'privacy.manage',
    kind: 'privacy.request',
    title: `Privacy request: ${LABEL[parsed.data.kind].toLowerCase()}`,
    body: candidate.fullName,
    href: `/admin/privacy?candidate=${candidate.id}`,
  });

  return NextResponse.json({ status: 'requested' }, { status: 201 });
}
