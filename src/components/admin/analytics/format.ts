import type { Kpi } from '@/lib/console/analytics';
import { CHARGE_CURRENCY } from '@/lib/data/cohort';

/** 1,284 · 12.9K · 3.4M. Proportional digits; compact from ten thousand up. */
export function compact(n: number): string {
  if (Math.abs(n) < 10_000) return Math.round(n).toLocaleString('en-IN');
  if (Math.abs(n) < 1_000_000) return `${(n / 1000).toFixed(n < 100_000 ? 1 : 0)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export function formatKpi(kpi: Pick<Kpi, 'format'>, value: number): string {
  switch (kpi.format) {
    case 'money': {
      const units = value / 100;
      const symbol = CHARGE_CURRENCY === 'INR' ? '₹' : '€';
      if (CHARGE_CURRENCY === 'INR' && units >= 100_000) return `₹${(units / 100_000).toFixed(units >= 1_000_000 ? 1 : 2)}L`;
      return `${symbol}${compact(units)}`;
    }
    case 'percent':
      return `${value.toFixed(value < 10 ? 1 : 0)}%`;
    case 'hours':
      if (value === 0) return 'n/a';
      return value < 48 ? `${value.toFixed(value < 10 ? 1 : 0)}h` : `${(value / 24).toFixed(1)}d`;
    default:
      return compact(value);
  }
}

/** Signed change vs the previous period, or null when there is nothing to compare. */
export function delta(kpi: Kpi): { text: string; direction: 'up' | 'down' | 'flat'; good: boolean } | null {
  if (kpi.previous === null || kpi.previous === undefined) return null;
  if (kpi.format === 'percent') {
    const diff = kpi.value - kpi.previous;
    const direction = Math.abs(diff) < 0.05 ? 'flat' : diff > 0 ? 'up' : 'down';
    return { text: `${diff > 0 ? '+' : ''}${diff.toFixed(1)} pts`, direction, good: direction === 'flat' || (direction === 'up') === kpi.upIsGood };
  }
  if (kpi.previous === 0) return kpi.value === 0 ? { text: '0%', direction: 'flat', good: true } : { text: 'new', direction: 'up', good: kpi.upIsGood };
  const pct = ((kpi.value - kpi.previous) / kpi.previous) * 100;
  const direction = Math.abs(pct) < 0.5 ? 'flat' : pct > 0 ? 'up' : 'down';
  return { text: `${pct > 0 ? '+' : ''}${pct.toFixed(Math.abs(pct) < 10 ? 1 : 0)}%`, direction, good: direction === 'flat' || (direction === 'up') === kpi.upIsGood };
}
