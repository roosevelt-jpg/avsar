import Link from 'next/link';
import type { Kpi } from '@/lib/console/analytics';
import { delta, formatKpi } from './format';

/**
 * A stat tile: label, value, change vs the previous period, and a sparkline.
 *
 * The change carries an arrow and a sign as well as a colour, so it reads the
 * same in greyscale and to colour-blind readers. Green and terracotta mean
 * good and bad news, not up and down: a falling response time is green.
 */
export function StatCard({ kpi, range }: { kpi: Kpi; range: number }) {
  const change = delta(kpi);
  const body = (
    <>
      <p className="m-0 text-[13px] text-ink-2">{kpi.label}</p>
      <p className="m-0 mt-2 text-[30px] font-semibold leading-none tracking-[-0.03em] text-ink">{formatKpi(kpi, kpi.value)}</p>
      <div className="mt-3 flex min-h-[22px] items-center justify-between gap-2">
        {change ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium ${
              change.direction === 'flat' ? 'bg-paper text-muted' : change.good ? 'bg-success/15 text-[oklch(0.42_0.12_150)]' : 'bg-accent-tint text-accent-deep'
            }`}
            title={`Previous ${range} days: ${formatKpi(kpi, kpi.previous ?? 0)}`}
          >
            <span aria-hidden>{change.direction === 'up' ? '▲' : change.direction === 'down' ? '▼' : '■'}</span>
            {change.text}
            <span className="sr-only"> compared with the previous {range} days</span>
          </span>
        ) : (
          <span className="text-[12px] text-muted">no earlier data</span>
        )}
        {kpi.trend.length > 1 && <Sparkline values={kpi.trend} label={`${kpi.label}, daily`} />}
      </div>
      <p className="m-0 mt-1.5 text-[11px] text-muted">vs previous {range} days</p>
    </>
  );
  const className = 't-colors block h-full rounded-[18px] border border-line/70 bg-surface p-5 no-underline shadow-[0_1px_2px_rgba(27,26,23,0.05)]';
  return kpi.href ? (
    <Link href={kpi.href} className={`${className} hover:border-line-strong`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/**
 * Twelve-ish points of trend in the de-emphasis grey, today in the accent.
 * Decoration beside a labelled number, so it needs no axis or tooltip.
 */
export function Sparkline({ values, label, width = 96, height = 28 }: { values: number[]; label: string; width?: number; height?: number }) {
  /* Long ranges are bucketed to at most 30 points so the line stays readable. */
  const bucket = Math.ceil(values.length / 30);
  const points = bucket > 1 ? Array.from({ length: Math.ceil(values.length / bucket) }, (_, i) => values.slice(i * bucket, (i + 1) * bucket).reduce((a, b) => a + b, 0)) : values;
  const max = Math.max(1, ...points);
  const step = (width - 8) / Math.max(1, points.length - 1);
  const xy = points.map((v, i) => [4 + i * step, height - 4 - (v / max) * (height - 8)] as const);
  const d = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const last = xy[xy.length - 1]!;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="shrink-0 overflow-visible">
      <path d={d} fill="none" stroke="var(--color-muted)" strokeOpacity={0.55} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={3.5} fill="var(--color-employer)" stroke="var(--color-surface)" strokeWidth={2} />
    </svg>
  );
}
