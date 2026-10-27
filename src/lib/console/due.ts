import { getAdminSupabase } from '@/lib/supabase/admin';
import { zonedLocalToUtc } from '@/lib/interviews/time';
import { overdueCreatedOnOrBefore, replyClock, zonedDate } from '@/lib/console/workdays';

/**
 * The morning list. Each row is work that already lives somewhere else
 * (an application, a lead, a legal review, a document). This only gathers
 * the ones that are due, so the dashboard is a queue rather than a second copy.
 */

export type DueItem = {
  id: string;
  kind: 'reply' | 'step' | 'scam' | 'interview' | 'legal' | 'document' | 'talk' | 'checkout' | 'family';
  title: string;
  detail: string;
  href: string;
  tone: 'overdue' | 'today' | 'waiting';
  sort: string;
};

export type MineItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  late: boolean;
};

const CLOSED = ['rejected', 'withdrawn', 'relocated'];

function nextDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const next = new Date(Date.UTC(y, (m ?? 1) - 1, (d ?? 1) + 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
}

/** Applications created before this instant are past the reply promise. */
export function lateCreatedBefore(responseDays: number, today = new Date()): string {
  const cutoff = overdueCreatedOnOrBefore(responseDays, today);
  const boundary = zonedLocalToUtc(`${nextDay(cutoff)}T00:00`, 'Asia/Kolkata');
  return (boundary ?? today).toISOString();
}

function one(value: unknown): Record<string, unknown> | undefined {
  return (Array.isArray(value) ? value[0] : value) as Record<string, unknown> | undefined;
}

function productLabel(value: unknown): string {
  if (value === 'skills_report') return 'skills report';
  if (value === 'visa_requirements') return 'visa-requirements list';
  if (value === 'bundle') return 'both reports';
  if (value === 'package') return 'both reports';
  return 'a report';
}

export async function workQueue(input: {
  userId: string;
  responseDays: number;
  applications: boolean;
  leads: boolean;
  relocation: boolean;
}): Promise<{ due: DueItem[]; mine: MineItem[]; lateCount: number }> {
  const admin = getAdminSupabase();
  if (!admin) return { due: [], mine: [], lateCount: 0 };

  const today = zonedDate(new Date());
  const lateBefore = lateCreatedBefore(input.responseDays);
  const dayStart = zonedLocalToUtc(`${today}T00:00`, 'Asia/Kolkata')?.toISOString() ?? new Date().toISOString();
  const dayEnd = zonedLocalToUtc(`${nextDay(today)}T00:00`, 'Asia/Kolkata')?.toISOString() ?? new Date().toISOString();

  const due: DueItem[] = [];

  if (input.applications) {
    const [lateRows, soonRows, steps, interviews, mineRows, lateCountQuery] = await Promise.all([
      admin
        .from('applications')
        .select('id, created_at, candidates!inner (full_name), job_postings!inner (title)')
        .eq('status', 'submitted')
        .lt('created_at', lateBefore)
        .order('created_at', { ascending: true })
        .limit(8),
      admin
        .from('applications')
        .select('id, created_at, candidates!inner (full_name), job_postings!inner (title)')
        .eq('status', 'submitted')
        .gte('created_at', lateBefore)
        .order('created_at', { ascending: true })
        .limit(20),
      admin
        .from('applications')
        .select('id, next_step, next_step_on, candidates!inner (full_name), job_postings!inner (title)')
        .lte('next_step_on', today)
        .not('status', 'in', `(${CLOSED.join(',')})`)
        .order('next_step_on', { ascending: true })
        .limit(8),
      admin
        .from('application_interviews')
        .select('id, starts_at, applications!inner (id, candidates!inner (full_name), job_postings!inner (title))')
        .eq('status', 'scheduled')
        .gte('starts_at', dayStart)
        .lt('starts_at', dayEnd)
        .order('starts_at', { ascending: true })
        .limit(8),
      admin
        .from('applications')
        .select('id, status, created_at, next_step, next_step_on, candidates!inner (full_name), job_postings!inner (title)')
        .eq('assigned_to', input.userId)
        .not('status', 'in', `(${CLOSED.join(',')})`)
        .order('next_step_on', { ascending: true, nullsFirst: false })
        .limit(12),
      admin.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'submitted').lt('created_at', lateBefore),
    ]);

    for (const row of lateRows.data ?? []) {
      const clock = replyClock(String(row.created_at), input.responseDays);
      due.push({
        id: `reply-${row.id}`,
        kind: 'reply',
        title: String(one(row.candidates)?.full_name ?? 'Application'),
        detail: `${one(row.job_postings)?.title ?? 'Job'} · day ${clock.elapsed} of ${clock.limit}`,
        href: `/admin/applications/${row.id}`,
        tone: 'overdue',
        sort: String(row.created_at),
      });
    }
    for (const row of soonRows.data ?? []) {
      const clock = replyClock(String(row.created_at), input.responseDays);
      if (!clock.dueSoon) continue;
      due.push({
        id: `soon-${row.id}`,
        kind: 'reply',
        title: String(one(row.candidates)?.full_name ?? 'Application'),
        detail: `${one(row.job_postings)?.title ?? 'Job'} · day ${clock.elapsed} of ${clock.limit}`,
        href: `/admin/applications/${row.id}`,
        tone: 'today',
        sort: String(row.created_at),
      });
    }
    for (const row of steps.data ?? []) {
      const when = String(row.next_step_on ?? today);
      due.push({
        id: `step-${row.id}`,
        kind: 'step',
        title: String(one(row.candidates)?.full_name ?? 'Application'),
        detail: String(row.next_step || 'Next step'),
        href: `/admin/applications/${row.id}`,
        tone: when < today ? 'overdue' : 'today',
        sort: when,
      });
    }
    for (const row of interviews.data ?? []) {
      const app = one(row.applications) ?? {};
      if (!app.id) continue;
      due.push({
        id: `interview-${row.id}`,
        kind: 'interview',
        title: String(one(app.candidates)?.full_name ?? 'Interview'),
        detail: String(one(app.job_postings)?.title ?? 'Interview today'),
        href: `/admin/applications/${app.id}`,
        tone: 'today',
        sort: String(row.starts_at),
      });
    }

    const mine: MineItem[] = (mineRows.data ?? []).map((row) => {
      const clock = row.status === 'submitted' ? replyClock(String(row.created_at), input.responseDays) : null;
      const step = row.next_step ? String(row.next_step) : null;
      return {
        id: String(row.id),
        title: String(one(row.candidates)?.full_name ?? 'Application'),
        detail: [one(row.job_postings)?.title, step, row.next_step_on].filter(Boolean).join(' · '),
        href: `/admin/applications/${row.id}`,
        late: Boolean(clock?.overdue) || (row.next_step_on != null && String(row.next_step_on) < today),
      };
    });

    await addShared(due, input);
    const rank = { overdue: 0, today: 1, waiting: 2 } as const;
    due.sort((a, b) => rank[a.tone] - rank[b.tone] || a.sort.localeCompare(b.sort));
    return { due: due.slice(0, 24), mine, lateCount: lateCountQuery.count ?? 0 };
  }

  await addShared(due, input);
  const rank = { overdue: 0, today: 1, waiting: 2 } as const;
  due.sort((a, b) => rank[a.tone] - rank[b.tone] || a.sort.localeCompare(b.sort));
  return { due: due.slice(0, 24), mine: [], lateCount: 0 };
}

async function addShared(into: DueItem[], input: { leads: boolean; relocation: boolean }): Promise<void> {
  const admin = getAdminSupabase();
  if (!admin) return;
  const extra: DueItem[] = [];

  const today = zonedDate(new Date());
  const dayStart = zonedLocalToUtc(`${today}T00:00`, 'Asia/Kolkata')?.toISOString() ?? new Date().toISOString();
  const [talks, families, checkouts] = await Promise.all([
    admin
      .from('conversion_signals')
      .select('id, product, amount_paise, created_at, candidates!inner(full_name)')
      .eq('kind', 'talk')
      .gte('created_at', dayStart)
      .order('created_at', { ascending: true })
      .limit(12),
    admin
      .from('conversion_signals')
      .select('id, payer_phone, sent, created_at, candidates!inner(full_name)')
      .eq('kind', 'family_send')
      .gte('created_at', dayStart)
      .order('created_at', { ascending: true })
      .limit(8),
    admin
      .from('payments')
      .select('id, product, amount_paise, created_at, candidates!inner(full_name)')
      .in('status', ['created', 'pending', 'failed'])
      .gte('created_at', dayStart)
      .order('created_at', { ascending: true })
      .limit(12),
  ]);
  for (const row of talks.data ?? []) {
    extra.push({
      id: `talk-${row.id}`,
      kind: 'talk',
      title: String(one(row.candidates)?.full_name ?? 'Candidate'),
      detail: `Asked to talk before paying · ${productLabel(row.product)}`,
      href: '/admin/inbox',
      tone: 'today',
      sort: String(row.created_at),
    });
  }
  for (const row of families.data ?? []) {
    extra.push({
      id: `family-${row.id}`,
      kind: 'family',
      title: String(one(row.candidates)?.full_name ?? 'Candidate'),
      detail: `${row.sent ? 'Family page sent to' : 'Family page not sent to'} ${row.payer_phone ?? 'a number'}`,
      href: '/admin/inbox',
      tone: 'today',
      sort: String(row.created_at),
    });
  }
  for (const row of checkouts.data ?? []) {
    extra.push({
      id: `checkout-${row.id}`,
      kind: 'checkout',
      title: String(one(row.candidates)?.full_name ?? 'Candidate'),
      detail: `Opened checkout, did not pay · ${productLabel(row.product)}`,
      href: '/admin/payments',
      tone: 'today',
      sort: String(row.created_at),
    });
  }

  if (input.leads) {
    const { data } = await admin
      .from('leads')
      .select('id, full_name, created_at')
      .eq('topic', 'scam_report')
      .eq('status', 'new')
      .order('created_at', { ascending: true })
      .limit(8);
    for (const row of data ?? []) {
      extra.push({
        id: `scam-${row.id}`,
        kind: 'scam',
        title: String(row.full_name),
        detail: 'Fee or scam report, not yet read',
        href: `/admin/inbox/${row.id}`,
        tone: 'overdue',
        sort: String(row.created_at),
      });
    }
  }

  if (input.relocation) {
    const [reviews, documents] = await Promise.all([
      admin
        .from('candidates')
        .select('id, full_name, legal_reviews (status)')
        .eq('payment_status', 'paid')
        .is('erased_at', null)
        .order('created_at', { ascending: true })
        .limit(40),
      admin
        .from('relocation_documents')
        .select('id, created_at, candidates (full_name)')
        .eq('status', 'uploaded')
        .is('superseded_at', null)
        .order('created_at', { ascending: true })
        .limit(8),
    ]);
    let legal = 0;
    for (const row of reviews.data ?? []) {
      const review = one(row.legal_reviews);
      const status = review ? String(review.status) : 'none';
      if (status === 'delivered' || legal >= 8) continue;
      legal += 1;
      extra.push({
        id: `legal-${row.id}`,
        kind: 'legal',
        title: String(row.full_name ?? 'Legal review'),
        detail: status === 'draft' ? 'Legal review drafted, not delivered' : 'Legal review not started',
        href: `/admin/legal-reviews#review-${row.id}`,
        tone: 'waiting',
        sort: String(legal).padStart(2, '0'),
      });
    }
    for (const row of documents.data ?? []) {
      extra.push({
        id: `doc-${row.id}`,
        kind: 'document',
        title: String(one(row.candidates)?.full_name ?? 'Document'),
        detail: 'Visa document waiting to be checked',
        href: `/admin/relocation#doc-${row.id}`,
        tone: 'waiting',
        sort: String(row.created_at),
      });
    }
  }

  into.push(...extra);
}
