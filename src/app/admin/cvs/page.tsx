import Link from 'next/link';
import { Mono } from '@/components/ui/Mono';
import { Wordmark } from '@/components/ui/Wordmark';
import { AccountMenu } from '@/components/auth/AccountMenu';
import { RunCvAssessment } from '@/components/employer/RunCvAssessment';
import { requireStaff } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isAiConfigured } from '@/lib/cv/client';

export const metadata = { title: 'CV queue' };

type Row = {
  id: string;
  candidateId: string;
  candidateName: string;
  sector: string;
  state: string;
  failureReason: string | null;
  uploadedAt: string;
  assessmentId: string | null;
  suggestedScore: number | null;
  requiresReview: boolean;
};

/** Every uploaded CV and where it is in the pipeline. Staff only. */
export default async function CvQueuePage() {
  if (isSupabaseConfigured()) await requireStaff('/admin/cvs');

  const supabase = getAdminSupabase();
  let rows: Row[] = [];

  if (supabase) {
    const { data } = await supabase
      .from('cv_documents')
      .select(
        'id, candidate_id, state, failure_reason, uploaded_at, candidates (full_name, sector), cv_assessments (id, suggested_score, requires_review)',
      )
      .order('uploaded_at', { ascending: false })
      .limit(100);

    rows = (data ?? []).map((row) => {
      const candidate = row.candidates as { full_name?: string; sector?: string } | null;
      const assessments = (row.cv_assessments ?? []) as {
        id: string;
        suggested_score: number;
        requires_review: boolean;
      }[];
      const assessment = assessments[0];
      return {
        id: row.id as string,
        candidateId: row.candidate_id as string,
        candidateName: candidate?.full_name ?? '-',
        sector: candidate?.sector ?? '-',
        state: row.state as string,
        failureReason: (row.failure_reason as string | null) ?? null,
        uploadedAt: row.uploaded_at as string,
        assessmentId: assessment?.id ?? null,
        suggestedScore: assessment?.suggested_score ?? null,
        requiresReview: assessment?.requires_review ?? false,
      };
    });
  }

  return (
    <div className="avsar-root">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-[clamp(20px,4cqi,56px)] py-[18px]">
        <Wordmark href="/admin" suffix="CV queue" accent="employer" />
        <span className="flex flex-wrap items-center gap-4">
          <Link href="/admin" className="text-[15px] no-underline text-ink-2 hover:text-employer t-colors">
            Talent pool
          </Link>
          <AccountMenu locale="en" tone="employer" />
        </span>
      </header>

      <main className="px-[clamp(20px,4cqi,56px)] py-[clamp(28px,4cqi,48px)]">
        <h1 className="m-0 text-[clamp(26px,3.6cqi,42px)] font-semibold leading-[1.1] tracking-[-0.03em]">
          CV queue
        </h1>
        <p className="mt-3 mb-6 max-w-[62ch] text-[15px] leading-[1.6] text-ink-2">
          Reading a CV is triggered here rather than on upload, because each read
          costs per document and a candidate who uploads the wrong file four times
          should not be four assessments.
        </p>

        {!isAiConfigured() && (
          <p className="mt-0 mb-6 rounded-[12px] border border-accent bg-accent-tint px-4 py-3 text-[14px] text-ink">
            ANTHROPIC_API_KEY is not set, so reads will fail. Everything else on this
            page works.
          </p>
        )}

        <div className="scroll-x rounded-[16px] border border-line bg-surface">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['CANDIDATE', 'SECTOR', 'UPLOADED', 'STATE', 'SCORE', ''].map((header) => (
                  <th key={header} scope="col" className="px-4 py-3 font-mono text-[11px] font-medium text-muted">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line-soft last:border-b-0">
                  <td className="px-4 py-3.5 text-[15px] font-medium">{row.candidateName}</td>
                  <td className="px-4 py-3.5 text-[14px]">{row.sector}</td>
                  <td className="px-4 py-3.5">
                    <Mono className="text-muted">
                      {new Date(row.uploadedAt).toLocaleDateString('en-GB')}
                    </Mono>
                  </td>
                  <td className="px-4 py-3.5">
                    <Mono className={row.state === 'failed' ? 'text-accent-deep' : 'text-muted'}>
                      {row.state}
                    </Mono>
                    {row.failureReason && (
                      <span className="mt-1 block max-w-[280px] text-[12px] text-muted">
                        {row.failureReason}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {row.suggestedScore === null ? (
                      <Mono className="text-muted">-</Mono>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Mono className="font-medium text-employer-deep">{row.suggestedScore}</Mono>
                        {row.requiresReview && (
                          <Mono className="text-accent-deep">needs review</Mono>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="flex items-center justify-end gap-2">
                      {row.assessmentId && (
                        <Link
                          href={`/admin/review/${row.assessmentId}`}
                          className="t-colors rounded-[8px] border border-line-strong bg-surface px-3 py-1.5 text-[13px] no-underline text-ink hover:border-employer"
                        >
                          Review
                        </Link>
                      )}
                      <RunCvAssessment documentId={row.id} state={row.state} />
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[15px] text-muted">
                    No CVs uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
