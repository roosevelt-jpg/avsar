import { refreshIntegrations } from '@/lib/integrations/runtime';
import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/cms/data';
import { formatFee } from '@/lib/company/config';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { sendWhatsApp } from '@/lib/whatsapp';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * One WhatsApp the day after someone opened checkout and did not pay.
 *
 * The signup reminders treat "finished the test" and "opened UPI and closed
 * it" the same. This only writes to people who have a payment row that is
 * still unpaid, once, and only if they opted in. A second run the next day
 * sees the notification_log row and stops.
 */
const HOURS_MIN = 20;
const HOURS_MAX = 72;

async function run(request: Request) {
  await refreshIntegrations();
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const now = Date.now();
  const after = new Date(now - HOURS_MAX * 3_600_000).toISOString();
  const before = new Date(now - HOURS_MIN * 3_600_000).toISOString();

  const { data: payments, error } = await admin
    .from('payments')
    .select('candidate_id, candidates!inner(full_name, payment_status, whatsapp_opt_in_at)')
    .in('status', ['created', 'pending', 'failed'])
    .gte('created_at', after)
    .lte('created_at', before)
    .neq('candidates.payment_status', 'paid')
    .not('candidates.whatsapp_opt_in_at', 'is', null)
    .limit(200);

  if (error) {
    console.error('[checkout-recovery] query failed', error);
    return NextResponse.json({ error: 'query_failed' }, { status: 500 });
  }

  const byCandidate = new Map<string, string>();
  for (const row of payments ?? []) {
    const id = String(row.candidate_id ?? '');
    if (!id || byCandidate.has(id)) continue;
    const joined = row.candidates as { full_name?: string } | { full_name?: string }[] | null;
    const person = Array.isArray(joined) ? joined[0] : joined;
    const name = String(person?.full_name ?? 'there');
    byCandidate.set(id, (name.split(' ')[0] || name).trim() || 'there');
  }

  const ids = [...byCandidate.keys()];
  if (ids.length === 0) return NextResponse.json({ considered: 0, sent: 0 });

  const { data: already } = await admin
    .from('notification_log')
    .select('candidate_id')
    .eq('template', 'checkout_abandoned')
    .in('candidate_id', ids);

  const done = new Set((already ?? []).map((row) => String(row.candidate_id)));
  const settings = await getSiteSettings();
  const price = formatFee(settings.pricing).replace(/[\u2066\u2069]/g, '');

  let sent = 0;
  for (const [id, firstName] of byCandidate) {
    if (done.has(id)) continue;
    await sendWhatsApp({
      candidateId: id,
      template: 'checkout_abandoned',
      params: [firstName, price],
    });
    sent += 1;
  }

  return NextResponse.json({ considered: ids.length, sent });
}

export const GET = run;
export const POST = run;
