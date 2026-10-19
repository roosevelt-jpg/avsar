import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';

/* Set by the database or meaningless on a copy: identity, timestamps,
   publication state, the generated search column, and the employer's request,
   which belongs to the posting it created rather than to copies of it. */
const NOT_COPIED = [
  'id', 'slug', 'status', 'published_at', 'created_at', 'updated_at', 'created_by', 'updated_by', 'search',
  'requested_at', 'requested_by', 'request_note',
];

/**
 * Copies a posting into a new draft, for the employer who hires the same role
 * in a second city. Always a draft, so nothing goes live without review.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const guard = await apiPermission('jobs.edit');
  if (guard instanceof NextResponse) return guard;

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: source } = await admin.from('job_postings').select('*').eq('id', id).maybeSingle();
  if (!source) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const copy: Record<string, unknown> = Object.fromEntries(Object.entries(source).filter(([key]) => !NOT_COPIED.includes(key)));
  const suffix = randomBytes(2).toString('hex');
  /* Kept within the editor's slug rule (80 chars, no doubled hyphens) and title limit. */
  copy.slug = `${String(source.slug).slice(0, 70).replace(/-+$/, '')}-copy-${suffix}`;
  copy.title = `${String(source.title)} (copy)`.slice(0, 140);
  copy.status = 'draft';
  copy.featured = false;
  copy.created_by = guard.userId;
  copy.updated_by = guard.userId;

  const { data, error } = await admin.from('job_postings').insert(copy).select('id').single();
  if (error || !data) {
    console.error('[jobs] duplicate failed', error);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  await audit(guard.userId, 'job.duplicate', `job:${data.id}`, { from: id });
  return NextResponse.json({ id: data.id });
}
