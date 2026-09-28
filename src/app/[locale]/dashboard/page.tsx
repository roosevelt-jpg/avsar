import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mono } from '@/components/ui/Mono';
import { Wordmark } from '@/components/ui/Wordmark';
import { VisibilityToggle } from '@/components/candidate/VisibilityToggle';
import { fill, getDictionary, isLocale } from '@/lib/i18n';
import { initials } from '@/lib/data/candidates';

export const metadata = { title: 'Your report' };

/**
 * Placeholder report for the signed-out preview. Once auth is wired this comes
 * from `reports` for the signed-in candidate.
 */
const SAMPLE_REPORT = {
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
} as const;

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const d = t.dash;
  const r = SAMPLE_REPORT;

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
        <span
          aria-hidden
          className="flex size-[34px] items-center justify-center rounded-full bg-ink font-mono text-[12px] text-paper"
        >
          {initials(r.name)}
        </span>
      </header>

      <main className="px-[clamp(20px,4cqi,56px)] py-[clamp(32px,5cqi,64px)]">
        <Mono className="text-muted">{fill(d.greeting, { name: r.name.split(' ')[0] ?? r.name })}</Mono>
        <div className="mt-3 mb-9 flex flex-wrap items-end justify-between gap-4">
          <h1 className="m-0 text-[clamp(28px,4cqi,48px)] font-semibold leading-[1.1] tracking-[-0.03em]">
            {d.title}
          </h1>
          <Link
            href={`/${locale}/dashboard/report.pdf`}
            className="t-colors rounded-[12px] border border-line-strong bg-surface px-4 py-2.5 text-[14px] no-underline hover:border-ink"
          >
            {d.download}
          </Link>
        </div>

        {/* stat cards */}
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
          <section>
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
          <VisibilityToggle label={d.visible} note={d.visibleNote} />
        </div>
      </main>
    </>
  );
}
