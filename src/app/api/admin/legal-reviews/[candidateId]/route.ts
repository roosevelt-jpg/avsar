import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { getMailer } from '@/lib/email';
import { composeEmail } from '@/lib/email/compose';
import { localePath } from '@/lib/i18n';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { sendWhatsApp } from '@/lib/whatsapp';

export const runtime = 'nodejs';

const text = z.string().trim().max(4000);

const schema = z
  .object({
    action: z.enum(['save', 'deliver']),
    summary: text,
    requirements: text,
    missingDocuments: text,
    issues: text,
  })
  .strict();

/**
 * Save or deliver a candidate's preliminary legal review.
 *
 * Delivery is one-way: once the candidate has read it, a later edit would
 * change a document they may already have relied on, so a delivered review is
 * corrected by talking to the candidate, not by rewriting it here. Only
 * candidates who bought the package have one.
 */
export async function PUT(request: Request, { params }: { params: Promise<{ candidateId: string }> }) {
  const guard = await apiPermission('relocation.manage');
  if (guard instanceof NextResponse) return guard;

  const { candidateId } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !z.string().uuid().safeParse(candidateId).success) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }
  const body = parsed.data;
  if (body.action === 'deliver' && (body.summary.length < 20 || body.requirements.length < 20)) {
    return NextResponse.json({ error: 'summary_and_requirements_required' }, { status: 422 });
  }

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: candidate } = await admin
    .from('candidates')
    .select('id, full_name, email, locale, payment_status, erased_at')
    .eq('id', candidateId)
    .maybeSingle();
  if (!candidate || candidate.erased_at || candidate.payment_status !== 'paid') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const { data: existing } = await admin.from('legal_reviews').select('status').eq('candidate_id', candidateId).maybeSingle();
  if (existing?.status === 'delivered') return NextResponse.json({ error: 'already_delivered' }, { status: 409 });

  const deliver = body.action === 'deliver';
  const { error } = await admin.from('legal_reviews').upsert(
    {
      candidate_id: candidateId,
      status: deliver ? 'delivered' : 'draft',
      summary: body.summary,
      requirements: body.requirements,
      missing_documents: body.missingDocuments,
      issues: body.issues,
      reviewed_by: guard.userId,
      delivered_at: deliver ? new Date().toISOString() : null,
    },
    { onConflict: 'candidate_id' },
  );
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });

  await audit(guard.userId, deliver ? 'legal_review.deliver' : 'legal_review.save', `candidate:${candidateId}`);

  if (deliver) {
    const firstName = String(candidate.full_name ?? '').split(' ')[0] || 'there';
    if (candidate.email) {
      const origin = new URL(request.url).origin;
      const url = `${origin}${localePath(String(candidate.locale ?? 'en'), '/dashboard')}`;
      try {
        const email = await composeEmail(
          'legal_review_ready',
          { first_name: firstName },
          { origin, actionUrl: url },
        );
        await getMailer().send({ to: String(candidate.email), ...email });
      } catch (mailError) {
        console.error('[legal-review] delivery email failed', mailError);
      }
    }
    await sendWhatsApp({
      candidateId,
      template: 'legal_review_ready',
      params: [firstName],
    });
  }

  return NextResponse.json({ status: deliver ? 'delivered' : 'draft' });
}
