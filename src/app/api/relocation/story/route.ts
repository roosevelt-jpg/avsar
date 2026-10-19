import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionCandidate } from '@/lib/auth';
import { notifyStaff } from '@/lib/notifications/staff';
import { recordConsent } from '@/lib/privacy/log';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const runtime = 'nodejs';

const schema = z
  .object({
    displayName: z.string().trim().min(1).max(60),
    roleLabel: z.string().trim().min(1).max(80),
    cityLabel: z.string().trim().max(80).optional().or(z.literal('')),
    quote: z.string().trim().min(20).max(600),
    consent: z.literal(true),
  })
  .strict();

/**
 * A placed candidate's own words, for the website.
 *
 * The site does not invent testimonials, so this is the only way one appears:
 * written by someone we actually placed, under the name they choose to show,
 * and published only after a member of staff has read it. The candidate can
 * withdraw it at any time and it comes down at once.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'not_configured', message: 'Supabase is not configured, so nothing can be saved.' }, { status: 503 });
  }
  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors }, { status: 422 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: placed } = await admin
    .from('applications')
    .select('id')
    .eq('candidate_id', candidate.id)
    .in('status', ['hired', 'visa_processing', 'relocated'])
    .order('status_changed_at', { ascending: false })
    .limit(1);
  if (!placed || placed.length === 0) return NextResponse.json({ error: 'not_placed' }, { status: 403 });

  /* One story per person: a new one replaces any not yet published. */
  await admin.from('success_stories').update({ status: 'withdrawn' }).eq('candidate_id', candidate.id).in('status', ['submitted', 'approved', 'rejected']);
  const { error } = await admin.from('success_stories').insert({
    candidate_id: candidate.id,
    application_id: placed[0]!.id,
    display_name: parsed.data.displayName,
    role_label: parsed.data.roleLabel,
    city_label: parsed.data.cityLabel || null,
    quote: parsed.data.quote,
  });
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });

  await recordConsent(candidate.id, 'story', true, 'dashboard');
  await notifyStaff({ permission: 'relocation.manage', kind: 'story.submitted', title: 'Story to review', body: parsed.data.displayName, href: '/admin/relocation' });
  return NextResponse.json({ status: 'submitted' }, { status: 201 });
}

export async function DELETE() {
  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const { data } = await admin
    .from('success_stories')
    .update({ status: 'withdrawn' })
    .eq('candidate_id', candidate.id)
    .in('status', ['submitted', 'approved', 'rejected'])
    .select('id');
  if (data && data.length > 0) await recordConsent(candidate.id, 'story', false, 'dashboard');
  return NextResponse.json({ status: 'withdrawn' });
}
