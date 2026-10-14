'use client';

import { useMemo, useRef, useState } from 'react';
import type { DailyPoint } from '@/lib/console/analytics';

type Metric = 'applications' | 'signups' | 'payments';

const METRICS: { key: Metric; label: string }[] = [
  { key: 'applications', label: 'Applications' },
  { key: 'signups', label: 'New candidates' },
  { key: 'payments', label: 'Assessments paid' },
];

const W = 720;
const H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 40 };

function niceMax(value: number): number {
  if (value <= 5) return 5;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const n = value / magnitude;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * magnitude;
}

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/**
 * Daily activity over the selected range: one metric at a time (so one axis
 * and one colour), a 2px line over a 10% wash, and a crosshair that snaps to
 * the nearest day. Arrow keys move the crosshair for keyboard users, and the
 * same numbers are in the table underneath.
 */
export function TrendChart({ daily }: { daily: DailyPoint[] }) {
  const [metric, setMetric] = useState<Metric>('applications');
  const [hover, setHover] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  const values = useMemo(() => daily.map((d) => d[metric]), [daily, metric]);
  const max = niceMax(Math.max(0, ...values));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (daily.length <= 1 ? innerW / 2 : (i / (daily.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(values.length - 1).toFixed(1)} ${PAD.top + innerH} L${x(0).toFixed(1)} ${PAD.top + innerH} Z`;
  const total = values.reduce((a, b) => a + b, 0);
  const ticks = [0, max / 2, max];
  const labelEvery = Math.ceil(daily.length / 6);

  function onMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = svg.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((event.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.left) / innerW) * (daily.length - 1));
    setHover(Math.max(0, Math.min(daily.length - 1, i)));
  }

  const active = hover !== null ? daily[hover] : null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div role="tablist" aria-label="Metric" className="flex flex-wrap gap-1 rounded-full border border-line bg-paper p-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              role="tab"
              type="button"
              aria-selected={metric === m.key}
              onClick={() => setMetric(m.key)}
              className={`cursor-pointer rounded-full border-0 px-3 py-1 text-[13px] ${metric === m.key ? 'bg-ink text-paper' : 'bg-transparent text-ink-2 hover:text-ink'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="m-0 text-[13px] text-muted">
          <span className="text-[18px] font-semibold text-ink">{total.toLocaleString('en-IN')}</span> in {daily.length} days
        </p>
      </div>

      <div className="relative mt-3">
        <svg
          ref={svg}
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-employer"
          role="img"
          aria-label={`${METRICS.find((m) => m.key === metric)?.label} per day. Use arrow keys to read values.`}
          tabIndex={0}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') setHover((h) => Math.min(daily.length - 1, (h ?? -1) + 1));
            if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? daily.length) - 1));
            if (e.key === 'Escape') setHover(null);
          }}
          onBlur={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--color-line-soft)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--color-muted)">
                {t >= 1000 ? `${t / 1000}K` : t}
              </text>
            </g>
          ))}
          {daily.map((d, i) =>
            i % labelEvery === 0 || i === daily.length - 1 ? (
              <text key={d.date} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === daily.length - 1 ? 'end' : 'middle'} fontSize={11} fill="var(--color-muted)">
                {shortDate(d.date)}
              </text>
            ) : null,
          )}
          <path d={area} fill="var(--color-employer)" fillOpacity={0.1} />
          <path d={line} fill="none" stroke="var(--color-employer)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {hover !== null && active && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--color-ink)" strokeOpacity={0.25} strokeWidth={1} />
              <circle cx={x(hover)} cy={y(active[metric])} r={4.5} fill="var(--color-employer)" stroke="var(--color-surface)" strokeWidth={2} />
            </g>
          )}
          {hover === null && values.length > 0 && (
            <circle cx={x(values.length - 1)} cy={y(values[values.length - 1]!)} r={4} fill="var(--color-employer)" stroke="var(--color-surface)" strokeWidth={2} />
          )}
        </svg>

        {hover !== null && active && (
          <div
            role="status"
            className="pointer-events-none absolute top-1 rounded-[10px] border border-line bg-surface px-3 py-2 text-[12px] shadow-[0_10px_30px_-12px_rgba(27,26,23,0.35)]"
            style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > daily.length / 2 ? 'calc(-100% - 10px)' : '10px'})` }}
          >
            <p className="m-0 text-muted">{shortDate(active.date)}</p>
            {METRICS.map((m) => (
              <p key={m.key} className="m-0 mt-1 flex items-center gap-2">
                <span aria-hidden className="inline-block h-0.5 w-3 rounded" style={{ background: m.key === metric ? 'var(--color-employer)' : 'var(--color-line-strong)' }} />
                <strong className="tabular-nums text-ink">{active[m.key].toLocaleString('en-IN')}</strong>
                <span className="text-ink-2">{m.label.toLowerCase()}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-[12px] text-muted">Show as a table</summary>
        <div className="scroll-x mt-2 max-h-[240px] overflow-y-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="text-muted">
                <th className="py-1 text-start font-normal">Day</th>
                {METRICS.map((m) => (
                  <th key={m.key} className="py-1 text-end font-normal">{m.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...daily].reverse().map((d) => (
                <tr key={d.date} className="border-t border-line-soft">
                  <td className="py-1">{shortDate(d.date)}</td>
                  {METRICS.map((m) => (
                    <td key={m.key} className="py-1 text-end tabular-nums">{d[m.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
