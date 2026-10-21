'use client';

import { useEffect, useState } from 'react';
import { barWidth, per100, type FunnelStats } from '@/lib/stats/funnel-shared';

const REFRESH_MS = 60_000;

type Labels = {
  completed: string;
  qualified: string;
  shortlisted: string;
  hired: string;
  per100: string;
  basedOn: string;
  live: string;
  sampleProgress: string;
  awaitingRates: string;
};

/**
 * The figures, kept current while the page is open. The server renders the
 * first numbers, so this works without JavaScript; the refresh only runs
 * while the tab is visible, so a phone in a pocket is not polling.
 *
 * Below minSample the live percentages stay hidden (a rate from a handful of
 * people misleads). The column still shows the four stages as a quiet preview
 * and how far the sample has to go, so the block does not look broken.
 */
export function LiveFunnelView({
  initial,
  minSample,
  pendingText,
  labels,
  locale,
}: {
  initial: FunnelStats;
  minSample: number;
  pendingText: string;
  labels: Labels;
  locale: string;
}) {
  const [stats, setStats] = useState(initial);

  useEffect(() => {
    let stopped = false;
    async function refresh() {
      if (document.visibilityState !== 'visible') return;
      try {
        const response = await fetch('/api/stats/funnel', { cache: 'no-store' });
        if (response.ok && !stopped) setStats((await response.json()) as FunnelStats);
      } catch {
        /* Keep the last figures; the next tick tries again. */
      }
    }
    /* The page itself may be cached, so the first figures can be older than
       a minute: refresh once straight away, then on the timer. */
    void refresh();
    const timer = window.setInterval(refresh, REFRESH_MS);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const number = new Intl.NumberFormat(locale === 'en' ? 'en-IN' : locale);

  if (stats.completed < minSample) {
    const progress = Math.min(100, Math.round((stats.completed / Math.max(1, minSample)) * 100));
    const stages = [labels.completed, labels.qualified, labels.shortlisted, labels.hired];
    return (
      <div aria-live="polite" className="rounded-[20px] border border-dashed border-line-strong bg-paper p-[clamp(18px,2.4cqi,28px)]">
        <p className="m-0 max-w-[62ch] text-[16px] leading-[1.6] text-ink-2">
          {pendingText
            .replace(/\{\{\s*finished\s*\}\}/g, number.format(stats.completed))
            .replace(/\{\{\s*min_sample\s*\}\}/g, number.format(minSample))}
        </p>

        <div className="mt-5">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-[13px] text-muted">
            <span>
              {labels.sampleProgress
                .replace(/\{\{\s*finished\s*\}\}/g, number.format(stats.completed))
                .replace(/\{\{\s*min_sample\s*\}\}/g, number.format(minSample))}
            </span>
            <span className="font-mono tabular-nums">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-canvas" aria-hidden>
            <div className="h-full rounded-full bg-[#c96a4b]" style={{ width: `${Math.max(progress, stats.completed > 0 ? 4 : 0)}%` }} />
          </div>
        </div>

        <p className="m-0 mt-6 mb-3 font-mono text-[12px] uppercase tracking-[0.12em] text-muted">{labels.per100}</p>
        <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
          {stages.map((label) => (
            <li key={label} className="rounded-[16px] border border-line bg-surface-subtle px-4 py-3.5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="min-w-[3.5ch] text-[28px] font-semibold leading-none tracking-[-0.04em] text-muted/50 tabular-nums">—</span>
                <span className="text-[15px] text-ink-2">{label}</span>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-canvas" aria-hidden>
                <div className="h-full w-[18%] rounded-full bg-[#c96a4b]" />
              </div>
            </li>
          ))}
        </ol>
        <p className="m-0 mt-4 text-[13px] text-muted">{labels.awaitingRates}</p>
      </div>
    );
  }

  const rows = [
    { value: '100', count: stats.completed, label: labels.completed, width: 100 },
    { value: per100(stats.qualified, stats.completed), count: stats.qualified, label: labels.qualified, width: barWidth(stats.qualified, stats.completed) },
    { value: per100(stats.shortlisted, stats.completed), count: stats.shortlisted, label: labels.shortlisted, width: barWidth(stats.shortlisted, stats.completed) },
    { value: per100(stats.hired, stats.completed), count: stats.hired, label: labels.hired, width: barWidth(stats.hired, stats.completed) },
  ];

  return (
    <div aria-live="polite">
      <p className="m-0 mb-4 font-mono text-[12px] uppercase tracking-[0.12em] text-muted">{labels.per100}</p>
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {rows.map((row, index) => (
          <li key={index} className="rounded-[18px] border border-line bg-paper p-5">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="min-w-[3.5ch] text-[clamp(32px,4.4cqi,48px)] font-semibold leading-none tracking-[-0.04em] tabular-nums">{row.value}</span>
              <span className="text-[17px] text-ink">{row.label}</span>
              <span className="ms-auto font-mono text-[12px] text-muted tabular-nums">{number.format(row.count)}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas" aria-hidden>
              <div className="h-full rounded-full bg-[#c96a4b]" style={{ width: `${row.width}%` }} />
            </div>
          </li>
        ))}
      </ol>
      <p className="m-0 mt-4 inline-flex items-center gap-2 text-[13px] text-muted">
        <span aria-hidden className="size-[7px] animate-pulse rounded-full bg-success" />
        {labels.live} · {labels.basedOn.replace(/\{\{\s*finished\s*\}\}/g, number.format(stats.completed))}
      </p>
    </div>
  );
}
