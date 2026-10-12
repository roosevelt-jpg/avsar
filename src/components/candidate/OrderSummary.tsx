import { Mono } from '@/components/ui/Mono';
import { activePrice, formatPrice, PRICING } from '@/lib/data/cohort';
import { fill, type Dictionary } from '@/lib/i18n';

export function OrderSummary({ t }: { t: Dictionary }) {
  const price = activePrice();
  const s = t.signup;

  return (
    <aside className="h-fit w-full rounded-[20px] border border-line bg-surface p-[clamp(20px,2.4cqi,26px)] lg:w-[340px] lg:shrink-0">
      <Mono className="text-muted">{s.summaryTitle}</Mono>
      <p className="mt-3 mb-4 text-[17px] font-semibold">{s.summaryItem}</p>

      <ul className="m-0 flex list-none flex-col gap-2.5 border-b border-line-soft p-0 pb-5">
        {s.summaryIncludes.map((line) => (
          <li key={line} className="flex items-start gap-2.5 text-[14px] leading-[1.5] text-ink-2">
            <span
              aria-hidden
              className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full bg-accent-tint text-[11px] font-semibold text-accent-deep"
            >
              ✓
            </span>
            {line}
          </li>
        ))}
      </ul>

      <dl className="m-0 flex flex-col gap-2.5 py-5 text-[14px]">
        {/*
          The net and VAT rows only exist when there is VAT to show. The seller
          is Portuguese and the supply to a candidate outside the EU is outside
          the scope of EU VAT, so the rate is 0 and a breakdown would print
          "VAT: EUR 0" above a net line identical to the total. One honest total
          beats three rows that invite the question of why one of them is zero.
        */}
        {price.vatMinor > 0 && (
          <>
            <div className="flex justify-between">
              <dt className="text-ink-2">{s.summaryEarly}</dt>
              <dd className="m-0 font-mono">{formatPrice(price.netMinor)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-2">{fill(s.summaryVat, { rate: PRICING.vatRate * 100 })}</dt>
              <dd className="m-0 font-mono">{formatPrice(price.vatMinor)}</dd>
            </div>
          </>
        )}
        <div className="mt-1.5 flex justify-between border-t border-line-soft pt-3.5 text-[17px] font-semibold">
          <dt>{s.summaryTotal}</dt>
          <dd className="m-0 font-mono">{formatPrice(price.totalMinor)}</dd>
        </div>
      </dl>

      <p className="m-0 border-t border-line-soft pt-4 text-[12px] leading-[1.5] text-muted">
        {s.summaryNote}
      </p>
    </aside>
  );
}
