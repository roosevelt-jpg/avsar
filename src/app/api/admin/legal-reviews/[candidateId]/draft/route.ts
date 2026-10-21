import { NextResponse } from 'next/server';
import { draftLegalReview } from '@/lib/legal/draft';
import { apiPermission } from '@/lib/rbac/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Fills the four review boxes from the file. Staff still edit and deliver.
 * Nothing is saved or emailed from this route.
 */
export async function POST(_request: Request, context: { params: Promise<{ candidateId: string }> }) {
  const guard = await apiPermission('relocation.manage');
  if (guard instanceof NextResponse) return guard;
  const { candidateId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(candidateId)) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  try {
    const draft = await draftLegalReview(candidateId);
    if (!draft) return NextResponse.json({ error: 'ai_unconfigured' }, { status: 503 });
    return NextResponse.json(draft);
  } catch (error) {
    console.error('[legal-draft] failed', error);
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
