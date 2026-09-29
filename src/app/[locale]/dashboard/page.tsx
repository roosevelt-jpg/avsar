import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mono } from '@/components/ui/Mono';
import { Wordmark } from '@/components/ui/Wordmark';
import { VisibilityToggle } from '@/components/candidate/VisibilityToggle';
import { AccountMenu } from '@/components/auth/AccountMenu';
import { fill, getDictionary, isLocale } from '@/lib/i18n';
import { requireCandidate } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getServerSupabase } from '@/lib/supabase/server';
import { sectorLabel, SECTOR_SLUGS, type SectorSlug } from '@/lib/data/sectors';

export const metadata = { title: 'Your report' };

/**
 * Shown when Supabase is not configured, so the screen stays reviewable in a
 * bare checkout. With Supabase present this is replaced by the signed-in
 * candidate's own report.
 */
type DashboardReport = {
  name: string;
  overall: number;
  percentile: number;
  english: string;
  skills: number;
  experienceScore: number;
  years: number;
  sector: string;
  breakdown: number[];
  timeline: readonly { date: string; state: 'done' | 'now' | 'next' }[];
};

const SAMPLE_REPORT: DashboardReport = {
  name: 'Arjun Nair',
  overall: 78,
  percentile: 12,
  english: 'B1',
  skills: 82,
  experienceScore: 71,
  years: 6,
  sector: 'Hospitality',
  breakdown: [86, 84, 79, 74, 66],
  timeline: [
    { date: '2 Oct 2026', state: 'done' },
    { date: '5 Oct 2026', state: 'done' },
    { date: '11 Oct 2026', state: 'done' },
    { date: 'Until 15 Dec 2026', state: 'now' },
    { date: '15 Jan 2027', state: 'next' },
  ],
};

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const d = t.dash;

  let r: DashboardReport = SAMPLE_REPORT;
  let visible = true;
  let reportReady = true;

  if (isSupabaseConfigured()) {
    const candidate = await requireCandidate(locale, `/${locale}/dashboard`);
    visible = candidate.visibleToEmployers;

    const supabase = await getServerSupabase();
    const { data: report } = (await supabase
      ?.from('reports')
      .select('overall_score, english_cefr, skills_score, experience_score, percentile, breakdown')
      .eq('candidate_id', candidate.id)
      .maybeSingle()) ?? { data: null };

    const sector: SectorSlug = (SECTOR_SLUGS as readonly string[]).includes(candidate.sector)
      ? (candidate.sector as SectorSlug)
      : SECTOR_SLUGS[0];

    if (report) {
      const breakdown = Array.isArray(report.breakdown)
        ? (report.breakdown as { score?: number }[]).map((entry) => entry.score ?? 0)
        : [];
      r = {
        name: candidate.fullName,
        overall: report.overall_score as number,
        percentile: (report.percentile as number | null) ?? 0,
        english: report.english_cefr as string,
        skills: report.skills_score as number,
        experienceScore: report.experience_score as number,
        years: [0, 2, 4, 6][candidate.yearsBand] ?? 0,
        sector: sectorLabel(sector),
        breakdown,
        timeline: SAMPLE_REPORT.timeline,
      };
    } else {
      /* Paid but not assessed yet, or assessed but not scored. Showing a
         placeholder score to a real candidate would be a lie about their
         standing, so the page says plainly that it is not ready. */
      reportReady = false;
      r = { ...SAMPLE_REPORT, name: candidate.fullName };
    }
  }

  const stats = [
    { label: d.overall, value: String(r.overall), suffix: '/100', note: fill(d.overallNote, { percentile: r.percentile }), dark: true },
    { label: d.englishLabel, value: r.english, note: d.englishNote, dark: false },
    { label: fill(d.skillsLabel, { sector: r.sector }), value: String(r.skills), note: d.skillsNote, dark: false },
    { label: d.expLabel, value: String(r.experienceScore), note: fill(d.expNote, { years: r.years }), dark: false },
  ];

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-[clamp(20px,4cqi,56px)] py-[18px]">
        <Wordmark href={`/${locale}`} />
        <nav className="flex flex-wrap gap-[clamp(12px,2.4cqi,28px)] text-[15px] text-ink-2">
          <span aria-current="page" className="font-medium text-ink">
            {d.navOverview}
          </span>
          <span>{d.navReport}</span>
          <span>{d.navProfile}</span>
        </nav>
        <AccountMenu locale={locale} />
      </header>

      <main className="px-[clamp(20px,4cqi,56px)] py-[clamp(32px,5cqi,64px)]">
        <Mono className="text-muted">{fill(d.greeting, { name: r.name.split(' ')[0] ?? r.name })}</Mono>
        <div className="mt-3 mb-9 flex flex-wrap items-end justify-between gap-4">
          <h1 className="m-0 text-[clamp(28px,4cqi,48px)] font-semibold leading-[1.1] tracking-[-0.03em]">
            {reportReady ? d.title : d.pending}
          </h1>
          <Link
            href={`/${locale}/dashboard/report.pdf`}
            className="t-colors rounded-[12px] border border-line-strong bg-surface px-4 py-2.5 text-[14px] no-underline hover:border-ink"
          >
            {d.download}
          </Link>
        </div>

        {!reportReady && (
          <p className="mt-0 mb-9 max-w-[62ch] rounded-[16px] border border-line bg-surface px-5 py-4 text-[15px] leading-[1.6] text-ink-2">
            {d.pendingNote}
          </p>
        )}

        {/* stat cards */}
        {reportReady && (
        <ul className="m-0 mb-10 grid list-none grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3 p-0">
          {stats.map((stat) => (
            <li
              key={stat.label}
              className={`rounded-[20px] border p-[22px] ${
                stat.dark ? 'border-ink bg-ink text-paper' : 'border-line bg-surface'
              }`}
            >
              <Mono className={stat.dark ? 'text-dark-muted' : 'text-muted'}>{stat.label}</Mono>
              <p className="mt-3 mb-1 text-[34px] font-semibold leading-none tracking-[-0.03em]">
                {stat.value}
                {stat.suffix ? (
                  <span className={`text-[16px] font-normal ${stat.dark ? 'text-dark-muted' : 'text-muted'}`}>
                    {stat.suffix}
                  </span>
                ) : null}
              </p>
              <p className={`m-0 text-[13px] ${stat.dark ? 'text-dark-muted-2' : 'text-muted'}`}>{stat.note}</p>
            </li>
          ))}
        </ul>
        )}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[clamp(20px,3cqi,40px)]">
          {/* cohort timeline */}
          <section>
            <h2 className="m-0 mb-5 text-[21px] font-semibold">{d.cohortStatus}</h2>
            <ol className="m-0 flex list-none flex-col p-0">
              {d.timeline.map((label, index) => {
                const entry = r.timeline[index];
                const state = entry?.state ?? 'next';
                const last = index === d.timeline.length - 1;
                return (
                  <li key={label} className="flex gap-3.5">
                    <div className="flex flex-col items-center">
                      <span
                        aria-hidden
                        className="mt-1.5 size-[11px] shrink-0 rounded-full border-2"
                        style={{
                          background: state === 'next' ? '#fff' : state === 'now' ? 'oklch(0.56 0.14 40)' : '#1b1a17',
                          borderColor:
                            state === 'next' ? '#d9d4c8' : state === 'now' ? 'oklch(0.56 0.14 40)' : '#1b1a17',
                        }}
                      />
                      {!last && <span aria-hidden className="w-px flex-1 bg-line" />}
                    </div>
                    <div className={`pb-6 ${state === 'next' ? 'text-muted' : 'text-ink'}`}>
                      <p className="m-0 text-[15px] font-medium">{label}</p>
                      <Mono className="text-muted">{entry?.date}</Mono>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* report breakdown */}
          <section hidden={!reportReady}>
            <h2 className="m-0 mb-5 text-[21px] font-semibold">{d.breakdown}</h2>
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {d.breakdownLabels.map((label, index) => {
                const value = r.breakdown[index] ?? 0;
                return (
                  <li key={label}>
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <span className="text-[15px]">{label}</span>
                      <Mono className="text-muted">{value}</Mono>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-line-soft">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className="mt-10">
          <VisibilityToggle label={d.visible} note={d.visibleNote} initial={visible} />
        </div>
      </main>
    </>
  );
}
