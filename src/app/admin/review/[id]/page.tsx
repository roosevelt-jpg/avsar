import type { ComponentProps } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mono } from '@/components/ui/Mono';
import { Wordmark } from '@/components/ui/Wordmark';
import { CvReviewPanel } from '@/components/employer/CvReviewPanel';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { rubricFor, RUBRIC_VERSION } from '@/lib/cv/rubric';
import { SECTOR_SLUGS, sectorLabel, type SectorSlug } from '@/lib/data/sectors';
import { requirePermission } from '@/lib/rbac/server';
import { logDataAccess } from '@/lib/privacy/log';
import { AccountMenu } from '@/components/auth/AccountMenu';

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
    <div className="avsar-root">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-[clamp(20px,4cqi,56px)] py-[18px]">
        <Wordmark href="/admin" suffix="review" accent="employer" />
        <span className="flex flex-wrap items-center gap-4">
          <Link href="/admin/cvs" className="text-[15px] no-underline text-ink-2 hover:text-employer t-colors">
            Back to the CV queue
          </Link>
          <AccountMenu locale="en" tone="employer" />
        </span>
      </header>

      <main className="px-[clamp(20px,4cqi,56px)] py-[clamp(28px,4cqi,48px)]">
        <Mono className="text-muted">{sectorLabel(sector).toUpperCase()} · CV ASSESSMENT</Mono>
        <h1 className="mt-3 mb-6 text-[clamp(26px,3.6cqi,42px)] font-semibold leading-[1.1] tracking-[-0.03em]">
          Review before deciding
        </h1>

        {staleRubric && (
          <p className="mt-0 mb-6 rounded-[12px] border border-accent bg-accent-tint px-4 py-3 text-[13px] text-ink">
            Scored under rubric {row.rubricVersion}; the current rubric is {RUBRIC_VERSION}. Criterion
            labels and weights may have changed since.
          </p>
        )}

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
      </main>
    </div>
  );
}
