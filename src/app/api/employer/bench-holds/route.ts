import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionEmployer } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { notifyStaff } from '@/lib/notifications/staff';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const HOLD_HOURS = 72;
const MAX_ACTIVE_HOLDS = 5;
const schema = z.object({ candidateId: z.string().uuid() }).strict();

/**
 * Hold a ready-to-travel candidate for three days while the employer decides.
 *
 * A hold tells our team to talk to this employer first; it does not reserve
 * the person, who is free to apply anywhere. Three days and five at a time,
 * so the bench cannot be emptied by one employer browsing. The candidate must
 * be on this employer's bench right now, which `employer_bench()` decides as
 * the signed-in employer.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'not_configured', message: 'Supabase is not configured, so nothing can be saved.' }, { status: 503 });
  }
  const employer = await getSessionEmployer();
  if (!employer) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const supabase = await getServerSupabase();
  const { data: bench } = (await supabase?.rpc('employer_bench')) ?? { data: null };
  const row = ((bench ?? []) as Record<string, unknown>[]).find((r) => String(r.candidate_id) === parsed.data.candidateId);
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (row.held_until && row.held_by_me !== true) return NextResponse.json({ error: 'held_by_another' }, { status: 409 });
  if (row.held_by_me === true) return NextResponse.json({ status: 'already_held' });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });
  const now = new Date();
  const { count } = await admin
    .from('bench_holds')
    .select('id', { count: 'exact', head: true })
    .eq('employer_id', employer.employerId)
    .is('released_at', null)
    .gt('expires_at', now.toISOString());
  if ((count ?? 0) >= MAX_ACTIVE_HOLDS) return NextResponse.json({ error: 'too_many_holds' }, { status: 409 });

  const expiresAt = new Date(now.getTime() + HOLD_HOURS * 3_600_000).toISOString();
  const { error } = await admin.from('bench_holds').insert({
    employer_id: employer.employerId,
    candidate_id: parsed.data.candidateId,
    held_by: employer.userId,
    expires_at: expiresAt,
  });
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });

  await audit(employer.userId, 'bench.hold', `candidate:${parsed.data.candidateId}`, { expiresAt });
  await notifyStaff({
    permission: 'applications.manage',
    kind: 'bench.hold',
    title: `${employer.name || 'An employer'} is holding ${String(row.candidate_name)}`,
    body: 'Ready-to-travel candidate, held for 72 hours. Get in touch with the employer.',
    href: '/admin/employers',
  });
  return NextResponse.json({ status: 'held', expiresAt }, { status: 201 });
}

/** Let a hold go early. Only your own. */
export async function DELETE(request: Request) {
  const employer = await getSessionEmployer();
  if (!employer) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  await admin
    .from('bench_holds')
    .update({ released_at: new Date().toISOString() })
    .eq('employer_id', employer.employerId)
    .eq('candidate_id', parsed.data.candidateId)
    .is('released_at', null);
  await audit(employer.userId, 'bench.release', `candidate:${parsed.data.candidateId}`);
  return NextResponse.json({ status: 'released' });
}
