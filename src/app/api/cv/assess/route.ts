import { refreshIntegrations } from '@/lib/integrations/runtime';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assessCv, needsReview } from '@/lib/cv/pipeline';
import { scrubNotes } from '@/lib/cv/redact';
import { isAiConfigured } from '@/lib/cv/client';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getSessionStaff } from '@/lib/auth';
import { SECTOR_SLUGS } from '@/lib/data/sectors';

export const runtime = 'nodejs';
/* Two model passes over a document; the default 10s serverless limit is not enough. */
export const maxDuration = 300;

const schema = z.object({ documentId: z.string().uuid() });

/**
 * Runs the assessment for one uploaded CV.
 *
 * Staff-triggered, or called by a worker draining `cv_documents` where
 * `state = 'uploaded'`. For a whole cohort use the batch path in
 * `src/lib/cv/batch.ts` instead: same output, half the cost.
 *
 * Both callers have to prove who they are. This route runs on the service role,
 * so it reads any candidate's document out of the bucket regardless of RLS, and
 * each call is two model passes over a document and a real bill. Left open it
 * is a tap anyone can turn on, needing only a document id: not quite guessable,
 * but an id is not an authorisation, and ids leak through logs and screens.
 */
export async function POST(request: Request) {
  /* A signed-in staff member, or a worker carrying the shared secret. */
  await refreshIntegrations();
  const secret = process.env.CRON_SECRET;
  const isWorker = Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`;
  if (!isWorker && !(await getSessionStaff())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  if (!isAiConfigured()) {
    return NextResponse.json({ error: 'ai_unconfigured' }, { status: 503 });
  }

  const supabase = getAdminSupabase();
  if (!supabase) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: document, error: documentError } = await supabase
    .from('cv_documents')
    .select('id, candidate_id, storage_path, mime_type')
    .eq('id', parsed.data.documentId)
    .single();

  if (documentError || !document) {
    return NextResponse.json({ error: 'document_not_found' }, { status: 404 });
  }

  const { data: candidate, error: candidateError } = await supabase
    .from('candidates')
    .select('full_name, email, sector, years_experience_band')
    .eq('id', document.candidate_id)
    .single();

  if (candidateError || !candidate) {
    return NextResponse.json({ error: 'candidate_not_found' }, { status: 404 });
  }

  await supabase.from('cv_documents').update({ state: 'extracting' }).eq('id', document.id);

  try {
    const file = await supabase.storage.from('cvs').download(document.storage_path as string);
    if (file.error || !file.data) throw new Error(`download failed: ${file.error?.message}`);

    const bytes = Buffer.from(await file.data.arrayBuffer());
    const isPdf = (document.mime_type as string) === 'application/pdf';

    const assessment = await assessCv({
      pdfBase64: isPdf ? bytes.toString('base64') : undefined,
      text: isPdf ? undefined : bytes.toString('utf8'),
      sector: (SECTOR_SLUGS as readonly string[]).includes(candidate.sector as string)
        ? (candidate.sector as (typeof SECTOR_SLUGS)[number])
        : SECTOR_SLUGS[0],
      selfReported: {
        fullName: candidate.full_name as string,
        email: candidate.email as string,
        yearsBand: candidate.years_experience_band as number,
      },
    });

    /* Protected attributes are dropped, and the free-text notes are scrubbed
       of anything the model quoted out of them. See scrubNotes. */
    const { protectedAttributes, ...rest } = assessment.extraction;
    const profile = { ...rest, extractionNotes: scrubNotes(assessment.extraction) };
    void protectedAttributes;

    const { data: row, error: insertError } = await supabase
      .from('cv_assessments')
      .insert({
        document_id: document.id,
        candidate_id: document.candidate_id,
        sector: candidate.sector,
        suggested_score: assessment.weightedScore,
        role_fit: assessment.rating.roleFit.verdict,
        criteria: assessment.rating.criteria,
        strengths: assessment.rating.strengths,
        concerns: assessment.rating.concerns,
        profile,
        discrepancies: assessment.discrepancies,
        requires_review: needsReview(assessment),
        attention_reasons: assessment.rating.attentionReasons,
        model: assessment.audit.model,
        prompt_version: assessment.audit.promptVersion,
        rubric_version: assessment.audit.rubricVersion,
        input_tokens: assessment.audit.inputTokens,
        output_tokens: assessment.audit.outputTokens,
      })
      .select('id')
      .single();

    if (insertError) throw new Error(`assessment insert failed: ${insertError.message}`);

    /* Identity goes to its own table, which no policy grants read access to. */
    await supabase
      .from('cv_protected_attributes')
      .insert({ assessment_id: row.id, attributes: protectedAttributes });

    await supabase.from('cv_documents').update({ state: 'ready' }).eq('id', document.id);

    return NextResponse.json({
      assessmentId: row.id,
      suggestedScore: assessment.weightedScore,
      requiresReview: needsReview(assessment),
      discrepancies: assessment.discrepancies.length,
    });
  } catch (error) {
    console.error('[cv/assess] failed', error);
    await supabase
      .from('cv_documents')
      .update({
        state: 'failed',
        failure_reason: error instanceof Error ? error.message.slice(0, 500) : 'unknown',
      })
      .eq('id', document.id);
    return NextResponse.json({ error: 'assessment_failed' }, { status: 500 });
  }
}
