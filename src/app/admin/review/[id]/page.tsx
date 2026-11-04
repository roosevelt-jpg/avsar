import type { ComponentProps } from 'react';
import { notFound } from 'next/navigation';
import { AdminButton, AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { CvReviewPanel } from '@/components/employer/CvReviewPanel';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { rubricFor, RUBRIC_VERSION } from '@/lib/cv/rubric';
import { SECTOR_SLUGS, sectorLabel, type SectorSlug } from '@/lib/data/sectors';
import { requirePermission } from '@/lib/rbac/server';
import { logDataAccess } from '@/lib/privacy/log';

export const metadata = { title: 'CV review' };

type PanelProps = ComponentProps<typeof CvReviewPanel>;

/** Review one AI-assisted assessment. */
export default async function CvReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const access = await requirePermission('cv.review', `/admin/review/${id}`);

  const supabase = getAdminSupabase();
  if (!supabase) notFound();

  const { data } = await supabase
    .from('cv_assessments')
    .select(
      'id, candidate_id, sector, suggested_score, role_fit, criteria, strengths, concerns, discrepancies, attention_reasons, model, prompt_version, rubric_version',
    )
    .eq('id', id)
    .maybeSingle();

  if (!data) notFound();
  await logDataAccess(access.userId, String(data.candidate_id), 'cv_assessment.view', { assessment: id });

  const row = {
    id: data.id as string,
    sector: data.sector as SectorSlug,
    suggestedScore: data.suggested_score as number,
    roleFit: data.role_fit as string,
    criteria: data.criteria as PanelProps['criteria'],
    strengths: data.strengths as string[],
    concerns: data.concerns as string[],
    discrepancies: data.discrepancies as PanelProps['discrepancies'],
    attentionReasons: data.attention_reasons as string[],
    model: data.model as string,
    promptVersion: data.prompt_version as string,
    rubricVersion: data.rubric_version as string,
  };

  const sector: SectorSlug = (SECTOR_SLUGS as readonly string[]).includes(row.sector)
    ? row.sector
    : SECTOR_SLUGS[0];

  const rubricLabels = Object.fromEntries(rubricFor(sector).map((c) => [c.id, c.label]));

  /* A rating produced under an older rubric cannot be read against today's
     criteria without saying so. */
  const staleRubric = row.rubricVersion !== RUBRIC_VERSION;

  return (
    <AdminShell current="/admin/cv-queue" isStaff>
      <AdminHeading
        title="Review before deciding"
        lead={`${sectorLabel(sector)} CV assessment`}
        actions={<AdminButton href="/admin/cv-queue" variant="light">Back to the CV queue</AdminButton>}
      />

      {staleRubric && (
        <p className="mt-6 mb-0 rounded-[14px] border border-accent bg-accent-tint px-4 py-3 text-[13px] text-ink">
          Scored under rubric {row.rubricVersion}; the current rubric is {RUBRIC_VERSION}. Criterion labels and
          weights may have changed since.
        </p>
      )}

      <div className="mt-7">
        <CvReviewPanel
          assessmentId={row.id}
          suggestedScore={row.suggestedScore}
          roleFit={row.roleFit}
          criteria={row.criteria}
          strengths={row.strengths}
          concerns={row.concerns}
          discrepancies={row.discrepancies}
          attentionReasons={row.attentionReasons}
          rubricLabels={rubricLabels}
          audit={{
            model: row.model,
            promptVersion: row.promptVersion,
            rubricVersion: row.rubricVersion,
          }}
        />
      </div>
    </AdminShell>
  );
}
