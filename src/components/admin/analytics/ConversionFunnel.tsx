import type { ConversionStage } from '@/lib/console/analytics';

/**
 * Candidate conversion for people who signed up in the selected range.
 * Bars shrink along Registered → Profile → Assessed → Paid → Applied.
 */
export function ConversionFunnel({ stages }: { stages: ConversionStage[] }) {
  const top = stages[0]?.value ?? 0;
  if (!top) return <p className="m-0 text-[14px] text-muted">No new candidates in this period yet.</p>;
  return (
    <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
      {stages.map((row, i) => {
        const prev = i ? (stages[i - 1]?.value ?? 0) : row.value;
        const step = prev ? Math.round((row.value / prev) * 100) : 0;
        const ofAll = (row.value / top) * 100;
        return (
          <li
            key={row.key}
            className="grid grid-cols-[140px_minmax(0,1fr)_auto] items-center gap-3 text-[13px]"
            title={`${row.label}: ${row.value} (${ofAll.toFixed(1)}% of registrations)`}
          >
            <span className="truncate text-ink-2">{row.label}</span>
            <div className="h-5">
              <div className="h-full rounded-e-[4px] bg-accent" style={{ width: `${Math.max(1, ofAll)}%`, opacity: 1 - i * 0.1 }} />
            </div>
            <span className="w-[92px] text-end tabular-nums">
              <span className="font-medium text-ink">{row.value.toLocaleString('en-IN')}</span>
              {i > 0 && <span className="ms-1.5 text-muted">{step}%</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
