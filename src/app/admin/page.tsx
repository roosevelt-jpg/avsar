import Link from 'next/link';
import { Suspense } from 'react';
import { Mono } from '@/components/ui/Mono';
import { Wordmark } from '@/components/ui/Wordmark';
import { SearchControls } from '@/components/employer/SearchControls';
import { ShortlistButton } from '@/components/employer/ShortlistButton';
import { searchTalent } from '@/lib/talent-search';
import { parseQuery, describeQuery } from '@/lib/assessment/query-parser';
import { SECTOR_SLUGS, sectorLabel, type SectorSlug } from '@/lib/data/sectors';
import { DEFAULT_EMPLOYER_QUERY, initials, type Cefr } from '@/lib/data/candidates';
import { COHORT } from '@/lib/data/cohort';

export const metadata = { title: 'Talent pool' };

const PAGE_SIZE = 25;

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sector?: string; minEnglish?: string; page?: string }>;
}) {
  const query = await searchParams;

  const q = query.q ?? DEFAULT_EMPLOYER_QUERY;
  const sector: SectorSlug | undefined =
    query.sector && (SECTOR_SLUGS as readonly string[]).includes(query.sector)
      ? (query.sector as SectorSlug)
      : undefined;
  const minEnglish = (['A2', 'B1', 'B2'] as const).includes(query.minEnglish as 'A2' | 'B1' | 'B2')
    ? (query.minEnglish as Cefr)
    : 'B1';
  const page = Math.max(1, Number(query.page ?? 1) || 1);

  const result = await searchTalent({ query: q, sector, minEnglish, page, pageSize: PAGE_SIZE });
  const understood = describeQuery(parseQuery(q), sectorLabel);
  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <div className="avsar-root">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-[clamp(20px,4cqi,56px)] py-[18px]">
        <Wordmark href="/employers" suffix="talent pool" accent="employer" />
        <nav className="flex flex-wrap gap-[clamp(12px,2.4cqi,28px)] text-[15px] text-ink-2">
          <span aria-current="page" className="font-medium text-ink">
            Search
          </span>
          <Link href="/admin/shortlists" className="no-underline hover:text-employer t-colors">
            Shortlists
          </Link>
          <Link href="/admin/cohorts" className="no-underline hover:text-employer t-colors">
            Cohorts
          </Link>
          <Link href="/admin/placements" className="no-underline hover:text-employer t-colors">
            Placements
          </Link>
        </nav>
      </header>

      <main className="px-[clamp(20px,4cqi,56px)] py-[clamp(28px,4cqi,48px)]">
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
            {result.total} matches · {COHORT.name} · {COHORT.assessedCount.toLocaleString('en-GB')} assessed
          </Mono>
          <Mono className="text-muted">Sorted by overall score</Mono>
        </div>

        {result.sample && (
          <p className="mt-0 mb-4 rounded-[12px] border border-line bg-surface-subtle px-4 py-3 text-[13px] text-muted">
            Showing the sample pool. Configure Supabase to search real candidates.
          </p>
        )}

        <div className="scroll-x rounded-[16px] border border-line bg-surface">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['CANDIDATE', 'SECTOR', 'ENGLISH', 'SCORE', 'EXP', ''].map((header) => (
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
                  <td className="px-4 py-3.5 text-right">
                    <span className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/review/${result.sample ? 'sample' : row.id}`}
                        className="t-colors rounded-[8px] border border-line-strong bg-surface px-3 py-1.5 text-[13px] no-underline text-ink hover:border-employer"
                      >
                        CV review
                      </Link>
                      <ShortlistButton candidateId={row.id} />
                    </span>
                  </td>
                </tr>
              ))}
              {result.rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[15px] text-muted">
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
      </main>
    </div>
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
      className="t-colors rounded-[8px] border border-line-strong bg-surface px-3 py-1.5 text-[13px] no-underline hover:border-employer"
    >
      {label}
    </Link>
  );
}
