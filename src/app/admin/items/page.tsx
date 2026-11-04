import { Mono } from '@/components/ui/Mono';
import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { CalibrateItemsButton } from '@/components/admin/CalibrateItemsButton';
import { requirePermission } from '@/lib/rbac/server';
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
  await requirePermission('cv.review', '/admin/items');

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
    <AdminShell current="/admin/items" isStaff>
      <AdminHeading
        title="Item calibration"
        lead={`Difficulty is the share who answer correctly. Discrimination is how well an item separates the candidates who do well on the rest of the section from those who do not: above 0.2 is a working item, and below zero means the stronger candidates are getting it wrong, which in practice almost always means the answer key is wrong. Items are only weighted once ${MIN_RESPONSES} people have answered them.`}
        actions={<CalibrateItemsButton />}
      />

      <p className="mt-4 mb-0 text-[14px] text-muted">
        {stats.length} items with responses, {calibrated} past the floor of {MIN_RESPONSES}.
      </p>

      {suspects.length > 0 && (
        <section className="mt-8">
          <h2 className="m-0 mb-3 text-[20px] font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
            Look at these
          </h2>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {suspects.map((row) => (
              <li key={row.stat.itemId} className="rounded-[14px] border border-accent bg-accent-tint px-4 py-3">
                <Mono className="text-muted">{row.stat.itemId}</Mono>
                <p className="m-0 mt-1 text-[15px] font-medium text-ink">{row.reason}</p>
                {row.item && <p className="m-0 mt-1 text-[14px] leading-[1.5] text-ink-2">{row.item.prompt}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-7 scroll-x rounded-[14px] border border-line bg-surface shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-surface-subtle">
              {['ITEM', 'QUESTION', 'N', 'DIFFICULTY', 'DISCRIMINATION', 'WEIGHT'].map((header) => (
                <th key={header} scope="col" className="px-4 py-3 font-mono text-[11px] font-medium text-muted">
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
                <td className="px-4 py-3 text-[14px] tabular-nums">{stat ? `${Math.round(stat.pValue * 100)}%` : '—'}</td>
                <td
                  className={`px-4 py-3 text-[14px] tabular-nums ${
                    stat && stat.discrimination < 0 ? 'font-semibold text-accent-deep' : ''
                  }`}
                >
                  {stat ? stat.discrimination.toFixed(2) : '—'}
                </td>
                <td className="px-4 py-3 text-[14px] tabular-nums text-muted">{weightFor(stat).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
