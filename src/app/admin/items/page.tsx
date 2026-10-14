import Link from 'next/link';
import { Mono } from '@/components/ui/Mono';
import { Wordmark } from '@/components/ui/Wordmark';
import { AccountMenu } from '@/components/auth/AccountMenu';
import { requireStaff } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { ITEM_BANK } from '@/lib/assessment/items';
import {
  suspectItems,
  weightFor,
  MIN_RESPONSES,
  type ItemStat,
} from '@/lib/assessment/calibration';

export const metadata = { title: 'Item calibration' };

/**
 * How each question is behaving, and which ones are broken.
 *
 * The point of this page is the top table. A question with negative
 * discrimination is one the strongest candidates get wrong, which almost always
 * means the key is wrong, and that is a scoring error affecting everyone who has
 * sat it. Nothing surfaces that except looking.
 */
export default async function ItemCalibrationPage() {
  if (isSupabaseConfigured()) await requireStaff('/admin/items');

  const supabase = getAdminSupabase();
  let stats: ItemStat[] = [];

  if (supabase) {
    const { data } = await supabase
      .from('item_stats')
      .select('item_id, n_responses, p_value, discrimination');

    stats = (data ?? []).map((row) => ({
      itemId: row.item_id as string,
      n: Number(row.n_responses ?? 0),
      pValue: Number(row.p_value ?? 0),
      discrimination: Number(row.discrimination ?? 0),
    }));
  }

  const suspects = suspectItems(stats);
  const byId = new Map(stats.map((stat) => [stat.itemId, stat]));
  const calibrated = stats.filter((stat) => stat.n >= MIN_RESPONSES).length;

  const rows = ITEM_BANK.filter((item) => item.correct !== undefined)
    .map((item) => ({ item, stat: byId.get(item.id) }))
    .sort((a, b) => (a.stat?.discrimination ?? 99) - (b.stat?.discrimination ?? 99));

  return (
    <div className="avsar-root">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-[clamp(20px,4cqi,56px)] py-[18px]">
        <Wordmark href="/admin" suffix="Item calibration" accent="employer" />
        <span className="flex flex-wrap items-center gap-4">
          <Link href="/admin" className="t-colors text-[15px] text-ink-2 no-underline hover:text-employer">
            Talent pool
          </Link>
          <AccountMenu locale="en" tone="employer" />
        </span>
      </header>

      <main className="px-[clamp(20px,4cqi,56px)] py-[clamp(28px,4cqi,48px)]">
        <h1 className="m-0 text-[clamp(26px,3.6cqi,42px)] font-semibold leading-[1.1] tracking-[-0.03em]">
          Item calibration
        </h1>
        <p className="mt-3 mb-6 max-w-[68ch] text-[15px] leading-[1.6] text-ink-2">
          Difficulty is the share who answer correctly. Discrimination is how well
          an item separates the candidates who do well on the rest of the section
          from those who do not: above 0.2 is a working item, and{' '}
          <strong>below zero means the stronger candidates are getting it wrong</strong>,
          which in practice almost always means the answer key is wrong. Items are
          only weighted once {MIN_RESPONSES} people have answered them.
        </p>

        <p className="mt-0 mb-8 text-[14px] text-muted">
          {stats.length} items with responses, {calibrated} past the floor of{' '}
          {MIN_RESPONSES}. Recompute with <code>POST /api/assessment/calibrate</code>.
        </p>

        {suspects.length > 0 && (
          <section className="mb-10">
            <h2 className="m-0 mb-3 text-[20px] font-semibold">Look at these</h2>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {suspects.map((row) => (
                <li
                  key={row.stat.itemId}
                  className="rounded-[12px] border border-accent bg-accent-tint px-4 py-3"
                >
                  <Mono className="text-muted">{row.stat.itemId}</Mono>
                  <p className="m-0 mt-1 text-[15px] font-medium text-ink">{row.reason}</p>
                  {row.item && (
                    <p className="m-0 mt-1 text-[14px] leading-[1.5] text-ink-2">{row.item.prompt}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="scroll-x rounded-[16px] border border-line bg-surface">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['ITEM', 'QUESTION', 'N', 'DIFFICULTY', 'DISCRIMINATION', 'WEIGHT'].map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-4 py-3 font-mono text-[11px] font-medium text-muted"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ item, stat }) => (
                <tr key={item.id} className="border-b border-line-soft last:border-b-0">
                  <td className="px-4 py-3">
                    <Mono className="text-muted">{item.id}</Mono>
                  </td>
                  <td className="max-w-[420px] px-4 py-3 text-[14px] leading-[1.45]">{item.prompt}</td>
                  <td className="px-4 py-3 text-[14px] tabular-nums">{stat?.n ?? 0}</td>
                  <td className="px-4 py-3 text-[14px] tabular-nums">
                    {stat ? `${Math.round(stat.pValue * 100)}%` : '—'}
                  </td>
                  <td
                    className={`px-4 py-3 text-[14px] tabular-nums ${
                      stat && stat.discrimination < 0 ? 'font-semibold text-accent-deep' : ''
                    }`}
                  >
                    {stat ? stat.discrimination.toFixed(2) : '—'}
                  </td>
                  <td className="px-4 py-3 text-[14px] tabular-nums text-muted">
                    {weightFor(stat).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
