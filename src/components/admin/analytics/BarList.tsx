import Link from 'next/link';

/**
 * A ranked list as horizontal bars: label above, a thin bar in the console
 * blue, the value at the bar's tip. One series, so one colour and no legend;
 * the panel title says what is measured.
 */
export function BarList({
  rows,
  empty = 'No data in this period yet.',
  suffix,
}: {
  rows: { label: string; value: number; href?: string; note?: string }[];
  empty?: string;
  suffix?: (row: { value: number }) => string;
}) {
  if (!rows.length || rows.every((r) => r.value === 0)) return <p className="m-0 text-[14px] text-muted">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0">
      {rows.map((row) => {
        const label = row.href ? (
          <Link href={row.href} className="truncate text-ink no-underline hover:text-employer">{row.label}</Link>
        ) : (
          <span className="truncate text-ink">{row.label}</span>
        );
        return (
          <li key={row.label} title={`${row.label}: ${row.value.toLocaleString('en-IN')}${suffix ? ` ${suffix(row)}` : ''}`}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
              {label}
              {row.note ? <span className="shrink-0 text-[12px] text-muted">{row.note}</span> : null}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 flex-1">
                <div
                  className="h-full rounded-e-[4px] bg-employer transition-[width] duration-500"
                  style={{ width: `${Math.max(1.5, (row.value / max) * 100)}%` }}
                />
              </div>
              <span className="w-[56px] shrink-0 text-end text-[13px] font-medium tabular-nums text-ink">
                {row.value.toLocaleString('en-IN')}
                {suffix ? <span className="font-normal text-muted"> {suffix(row)}</span> : null}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
