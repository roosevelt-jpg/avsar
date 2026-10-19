import { STATUS_META, type ApplicationStatus } from '@/lib/applications/status';

/**
 * Where this period's applications got to. Each stage counts applications
 * that reached it or went further, so the bars only ever shrink, and the step
 * percentage is the conversion from the stage above.
 */
export function Funnel({ stages }: { stages: { stage: ApplicationStatus; reached: number }[] }) {
  const top = stages[0]?.reached ?? 0;
  if (!top) return <p className="m-0 text-[14px] text-muted">No applications in this period yet.</p>;
  return (
    <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
      {stages.map((row, i) => {
        const prev = i ? (stages[i - 1]?.reached ?? 0) : row.reached;
        const step = prev ? Math.round((row.reached / prev) * 100) : 0;
        const ofAll = (row.reached / top) * 100;
        return (
          <li key={row.stage} className="grid grid-cols-[110px_minmax(0,1fr)_auto] items-center gap-3 text-[13px]" title={`${STATUS_META[row.stage].label}: ${row.reached} (${ofAll.toFixed(1)}% of applications)`}>
            <span className="truncate text-ink-2">{STATUS_META[row.stage].label}</span>
            <div className="h-5">
              <div className="h-full rounded-e-[4px] bg-employer" style={{ width: `${Math.max(1, ofAll)}%`, opacity: 1 - i * 0.08 }} />
            </div>
            <span className="w-[92px] text-end tabular-nums">
              <span className="font-medium text-ink">{row.reached.toLocaleString('en-IN')}</span>
              {i > 0 && <span className="ms-1.5 text-muted">{step}%</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
