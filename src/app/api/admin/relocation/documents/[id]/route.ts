import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { getMailer } from '@/lib/email';
import { renderEmail } from '@/lib/email/template';
import { localePath } from '@/lib/i18n';
import { logDataAccess } from '@/lib/privacy/log';
import { apiPermission, demoWriteRefusal } from '@/lib/rbac/server';
import { DOCUMENT_LABELS, type DocumentKind } from '@/lib/relocation/documents';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const schema = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('verified'), expiresOn: isoDate.nullable().optional() }).strict(),
  z.object({ decision: z.literal('rejected'), reason: z.string().trim().min(5).max(500) }).strict(),
]);

/**
 * Open a candidate's visa document. Passports and police certificates are the
 * most sensitive files we hold, so every opening is written to the access log
 * and the signed URL lives for one minute.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiPermission('relocation.manage');
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'demo_mode' }, { status: 503 });

  const { data: doc } = await admin.from('relocation_documents').select('candidate_id, kind, storage_path').eq('id', id).maybeSingle();
  if (!doc) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { data, error } = await admin.storage.from('relocation-docs').createSignedUrl(String(doc.storage_path), 60);
  if (error || !data) return NextResponse.json({ error: 'storage_failed' }, { status: 500 });

  await logDataAccess(guard.userId, String(doc.candidate_id), 'relocation_doc.view', { document: id, kind: doc.kind });
  return NextResponse.redirect(data.signedUrl, 303);
}

/**
 * Verify or reject. A rejection always carries a reason the candidate can act
 * on, and they are emailed it, because a document that sits rejected without
 * the candidate knowing is weeks lost before a visa appointment.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiPermission('relocation.manage');
  if (guard instanceof NextResponse) return guard;
  const refusal = demoWriteRefusal(guard);
  if (refusal) return refusal;

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const body = parsed.data;
  const { data: doc, error } = await admin
    .from('relocation_documents')
    .update({
      status: body.decision,
      expires_on: body.decision === 'verified' ? (body.expiresOn ?? null) : null,
      reject_reason: body.decision === 'rejected' ? body.reason : null,
      reviewed_by: guard.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .is('superseded_at', null)
    .select('candidate_id, kind, candidates (full_name, email, locale)')
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  if (!doc) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  await audit(guard.userId, `relocation_doc.${body.decision}`, `candidate:${String(doc.candidate_id)}`, { document: id, kind: doc.kind });

  const candidate = (Array.isArray(doc.candidates) ? doc.candidates[0] : doc.candidates) as { full_name?: string; email?: string; locale?: string } | undefined;
  if (body.decision === 'rejected' && candidate?.email) {
    const origin = new URL(request.url).origin;
    const url = `${origin}${localePath(candidate.locale ?? 'en', '/dashboard/relocation')}`;
    const label = DOCUMENT_LABELS[doc.kind as DocumentKind] ?? 'A document';
    const paragraphs = [`Hello ${(candidate.full_name ?? '').split(' ')[0] || 'there'},`, `We checked your ${label.toLowerCase()} and need a new copy.`, `Why: ${body.reason}`];
    try {
      await getMailer().send({
        to: candidate.email,
        subject: `Please upload your ${label.toLowerCase()} again`,
        text: `${paragraphs.join('\n\n')}\n\nUpload it here: ${url}`,
        html: renderEmail({ preheader: body.reason, heading: 'A document needs a new upload', paragraphs, action: { label: 'Upload again', url }, origin }),
      });
    } catch (mailError) {
      console.error('[relocation] rejection email failed', mailError);
    }
  }
  return NextResponse.json({ status: body.decision });
}
