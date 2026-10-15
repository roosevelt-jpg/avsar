import { NextResponse } from 'next/server';
import { notifyStaff } from '@/lib/notifications/staff';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

const EXPIRY_WARNING_DAYS = 30;

/**
 * Daily: tell the relocation team what slipped overnight.
 *
 * Two things go wrong quietly in a move: a step passes its date with nobody
 * noticing, and a verified document (usually the police clearance, valid for
 * a few months) runs out before the visa appointment. One summary
 * notification each, not one per row, so the bell stays readable; the
 * relocation page has the detail. Steps that went overdue yesterday are
 * counted separately so the message says what is new.
 */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'demo_mode' }, { status: 503 });

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const horizon = new Date(Date.now() + EXPIRY_WARNING_DAYS * 86_400_000).toISOString().slice(0, 10);

  const [overdue, newlyOverdue, expiring] = await Promise.all([
    admin.from('relocation_milestones').select('id', { count: 'exact', head: true }).in('status', ['pending', 'in_progress', 'blocked']).lt('due_on', today),
    admin.from('relocation_milestones').select('id', { count: 'exact', head: true }).in('status', ['pending', 'in_progress', 'blocked']).eq('due_on', yesterday),
    admin
      .from('relocation_documents')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'verified')
      .is('superseded_at', null)
      .gte('expires_on', today)
      .lte('expires_on', horizon),
  ]);

  const overdueCount = overdue.count ?? 0;
  const expiringCount = expiring.count ?? 0;
  if (overdueCount > 0) {
    await notifyStaff({
      permission: 'relocation.manage',
      kind: 'relocation.overdue',
      title: `${overdueCount} relocation ${overdueCount === 1 ? 'step is' : 'steps are'} past due`,
      body: newlyOverdue.count ? `${newlyOverdue.count} went overdue yesterday.` : undefined,
      href: '/admin/relocation',
    });
  }
  if (expiringCount > 0) {
    await notifyStaff({
      permission: 'relocation.manage',
      kind: 'relocation.expiring',
      title: `${expiringCount} verified ${expiringCount === 1 ? 'document expires' : 'documents expire'} within ${EXPIRY_WARNING_DAYS} days`,
      body: 'Ask the candidates for new copies before their visa appointments.',
      href: '/admin/relocation',
    });
  }

  return NextResponse.json({ overdue: overdueCount, newlyOverdue: newlyOverdue.count ?? 0, expiring: expiringCount });
}

export const GET = run;
export const POST = run;
