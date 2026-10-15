import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { collectCandidateData } from '@/lib/privacy/export';
import { logDataAccess } from '@/lib/privacy/log';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/**
 * A subject access request answered by staff: the same document the candidate
 * can download from their dashboard, for requests that arrive by email or post.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const guard = await apiPermission('privacy.manage');
  if (guard instanceof NextResponse) return guard;

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'demo_mode' }, { status: 503 });

  const data = await collectCandidateData(admin, id);
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  await logDataAccess(guard.userId, id, 'candidate.export');
  await audit(guard.userId, 'privacy.export', `candidate:${id}`);

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="candidate-data-${id.slice(0, 8)}.json"`,
      'cache-control': 'no-store',
    },
  });
}
