import Link from 'next/link';
import { Suspense } from 'react';
import { Mono } from '@/components/ui/Mono';
import { AdminShell } from '@/components/employer/AdminShell';
import { SearchControls } from '@/components/employer/SearchControls';
import { ShortlistButton } from '@/components/employer/ShortlistButton';
import { VoicePlayer } from '@/components/employer/VoicePlayer';
import { searchTalent } from '@/lib/talent-search';
import { parseQuery, describeQuery } from '@/lib/assessment/query-parser';
import { SECTOR_SLUGS, sectorLabel, type SectorSlug } from '@/lib/data/sectors';
import { DEFAULT_EMPLOYER_QUERY, initials, type Cefr } from '@/lib/data/candidates';
import { assessedCount } from '@/lib/company/data';
import { getSiteSettings } from '@/lib/cms/data';
import { requireStaffOrEmployer } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Talent pool' };

const PAGE_SIZE = 25;

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sector?: string; minEnglish?: string; page?: string }>;
}) {
  const query = await searchParams;

  const access = await requireStaffOrEmployer('/admin');
  /* Employers reach this page as employers; staff need the permission, so a
     content editor typing the address is refused like everywhere else. */
  if (access.isStaff) await requirePermission('candidates.view', '/admin');

  const q = query.q ?? DEFAULT_EMPLOYER_QUERY;
  const sector: SectorSlug | undefined =
    query.sector && (SECTOR_SLUGS as readonly string[]).includes(query.sector)
      ? (query.sector as SectorSlug)
      : undefined;
  const minEnglish = (['A2', 'B1', 'B2'] as const).includes(query.minEnglish as 'A2' | 'B1' | 'B2')
    ? (query.minEnglish as Cefr)
    : 'B1';
  const page = Math.max(1, Number(query.page ?? 1) || 1);

  const [result, assessed, { cohort: COHORT }] = await Promise.all([
    searchTalent({ query: q, sector, minEnglish, page, pageSize: PAGE_SIZE, maskNames: !access.isStaff }),
    assessedCount(),
    getSiteSettings(),
  ]);
  const understood = describeQuery(parseQuery(q), sectorLabel);
  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <AdminShell current="/admin" isStaff={access.isStaff}>
        <Suspense fallback={<div className="h-[140px]" />}>
          <SearchControls query={q} sector={sector} minEnglish={minEnglish} />
        </Suspense>

        {/* What the parser understood, shown back so a recruiter can correct it. */}
        {understood.length > 0 && (
          <p className="mt-4 mb-0 text-[13px] text-muted">
            Reading this as: <span className="text-ink">{understood.join(' · ')}</span>
          </p>
        )}

        <div className="mt-6 mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <Mono className="text-muted">
            {result.total} matches · {COHORT.name} · {assessed.toLocaleString('en-GB')} assessed
          </Mono>
          <Mono className="text-muted">Sorted by overall score</Mono>
        </div>

        <div className="scroll-x rounded-[16px] border border-line bg-surface">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['CANDIDATE', 'SECTOR', 'ENGLISH', 'SCORE', 'EXP', 'VOICE', ''].map((header) => (
                  <th key={header} scope="col" className="px-4 py-3 font-mono text-[11px] font-medium text-muted">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.id} className="t-colors border-b border-line-soft last:border-b-0 hover:bg-surface-hover">
                  <td className="px-4 py-3.5">
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-surface-subtle font-mono text-[11px] text-ink-2"
                      >
                        {initials(row.name)}
                      </span>
                      <span>
                        <span className="block text-[15px] font-medium">{row.name}</span>
                        <span className="block text-[13px] text-muted">{row.city}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[14px]">{sectorLabel(row.sector)}</td>
                  <td className="px-4 py-3.5 font-mono text-[13px]">{row.english}</td>
                  <td className="px-4 py-3.5 font-mono text-[15px] font-medium text-employer-deep">
                    {row.score}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[13px] text-muted">{row.yearsExperience}y</td>
                  {/* Hearing someone speak for thirty seconds tells a hiring
                      manager more than the English column does, and lets them
                      judge it themselves rather than take our letter for it. */}
                  <td className="px-4 py-3.5">
                    {row.hasVoiceIntro ? (
                      <VoicePlayer candidateId={row.id} name={row.name} />
                    ) : (
                      <span className="font-mono text-[12px] text-muted">&mdash;</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="flex items-center justify-end gap-2">
                      {/* Staff only. An employer must never be handed a raw
                          model score as if it measured the person. */}
                      {access.isStaff && (
                        <Link
                          href={`/admin/review/${row.id}`}
                          className="t-colors rounded-[8px] border border-line-strong bg-surface px-3 py-1.5 text-[13px] no-underline text-ink hover:border-ink"
                        >
                          CV review
                        </Link>
                      )}
                      <ShortlistButton candidateId={row.id} />
                    </span>
                  </td>
                </tr>
              ))}
              {result.rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[15px] text-muted">
                    No candidates match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <nav aria-label="Pagination" className="mt-5 flex items-center gap-2">
            {page > 1 && (
              <PageLink q={q} sector={sector} minEnglish={minEnglish} page={page - 1} label="Previous" />
            )}
            <Mono className="px-2 text-muted">
              Page {page} of {pages}
            </Mono>
            {page < pages && (
              <PageLink q={q} sector={sector} minEnglish={minEnglish} page={page + 1} label="Next" />
            )}
          </nav>
        )}
    </AdminShell>
  );
}

function PageLink({
  q,
  sector,
  minEnglish,
  page,
  label,
}: {
  q: string;
  sector?: SectorSlug;
  minEnglish: string;
  page: number;
  label: string;
}) {
  const params = new URLSearchParams({ q, minEnglish, page: String(page) });
  if (sector) params.set('sector', sector);
  return (
    <Link
      href={`/admin?${params.toString()}`}
      className="t-colors rounded-[8px] border border-line-strong bg-surface px-3 py-1.5 text-[13px] no-underline hover:border-ink"
    >
      {label}
    </Link>
  );
}
