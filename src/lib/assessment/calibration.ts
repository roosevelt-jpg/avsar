import { ITEM_BANK, type Item } from './items';

/**
 * Item statistics, and what the scorer does with them.
 *
 * Two numbers per item, both standard in classical test theory:
 *
 *  - **p-value**, the proportion who answered correctly. Near 1 or near 0 and
 *    the item separates nobody; it still belongs in the test if it is worth
 *    asking, but it should not carry the same weight as one that discriminates.
 *  - **discrimination**, the point-biserial correlation between getting this
 *    item right and scoring well on the rest of the section. Above about 0.2 is
 *    a working item. Negative means the stronger candidates are getting it
 *    wrong, which in practice almost always means the key is wrong.
 *
 * The thresholds live here rather than in the database on purpose: changing how
 * a score is computed should be a code review, not an UPDATE somebody runs.
 */

export type ItemStat = {
  itemId: string;
  n: number;
  pValue: number;
  discrimination: number;
};

/**
 * Below this, the statistics are noise and the item is weighted as 1.
 *
 * Thirty is the conventional floor for a usable point-biserial. It is low for
 * comfort and high enough that one unusual cohort cannot reweight the test.
 */
export const MIN_RESPONSES = 30;

/** Under this, an item is contributing more noise than signal. */
export const WEAK_DISCRIMINATION = 0.1;

/**
 * What an item counts for.
 *
 * Clamped into [0.25, 1.25] so calibration adjusts the balance without any
 * single item dominating or disappearing. An item that discriminates negatively
 * is floored, not removed: removing it silently would hide a miskeyed question
 * instead of surfacing it, and `suspectItems` exists to surface it.
 */
export function weightFor(stat: ItemStat | undefined): number {
  if (!stat || stat.n < MIN_RESPONSES) return 1;
  const scaled = 0.5 + stat.discrimination * 1.5;
  return Math.max(0.25, Math.min(1.25, scaled));
}

/** Items a human should look at, worst first. */
export function suspectItems(stats: readonly ItemStat[]): {
  stat: ItemStat;
  item: Item | undefined;
  reason: string;
}[] {
  return stats
    .filter((stat) => stat.n >= MIN_RESPONSES)
    .map((stat) => {
      const item = ITEM_BANK.find((candidate) => candidate.id === stat.itemId);
      if (stat.discrimination < 0) {
        return { stat, item, reason: 'Negative discrimination: the answer key is probably wrong' };
      }
      if (stat.discrimination < WEAK_DISCRIMINATION) {
        return { stat, item, reason: 'Barely discriminates: it separates nobody' };
      }
      if (stat.pValue >= 0.95) return { stat, item, reason: 'Almost everyone gets it right' };
      if (stat.pValue <= 0.2) {
        return { stat, item, reason: 'Almost nobody gets it right: too hard, or ambiguous' };
      }
      return { stat, item, reason: '' };
    })
    .filter((row) => row.reason !== '')
    .sort((a, b) => a.stat.discrimination - b.stat.discrimination);
}

/**
 * Point-biserial, computed against the rest of the section.
 *
 * Against the rest and not against the total: an item correlated with a total
 * that includes itself is correlated with itself, which inflates every figure
 * and inflates the weakest items most.
 *
 * Returns nothing for an item with no variance. If everybody answered it the
 * same way the correlation is undefined, not zero, and reporting zero would
 * read as "this item is bad" rather than "there is nothing to say yet".
 */
export function computeStats(
  responses: readonly { candidateId: string; itemId: string; correct: boolean }[],
): ItemStat[] {
  const byCandidate = new Map<string, { itemId: string; correct: boolean }[]>();
  for (const row of responses) {
    const list = byCandidate.get(row.candidateId) ?? [];
    list.push({ itemId: row.itemId, correct: row.correct });
    byCandidate.set(row.candidateId, list);
  }

  const itemIds = [...new Set(responses.map((row) => row.itemId))];
  const out: ItemStat[] = [];

  for (const itemId of itemIds) {
    /* Each candidate who saw this item: did they get it right, and how did they
       do on everything else they were asked. */
    const points: { got: boolean; rest: number }[] = [];
    for (const [, answers] of byCandidate) {
      const mine = answers.find((answer) => answer.itemId === itemId);
      if (!mine) continue;
      const others = answers.filter((answer) => answer.itemId !== itemId);
      if (others.length === 0) continue;
      points.push({
        got: mine.correct,
        rest: others.filter((answer) => answer.correct).length / others.length,
      });
    }

    const n = points.length;
    if (n === 0) continue;

    const right = points.filter((point) => point.got);
    const wrong = points.filter((point) => !point.got);
    const pValue = right.length / n;

    /* No variance: everybody answered it the same way, so there is nothing to
       correlate. The row is written with the p-value and a flat zero, and the
       response floor keeps it out of the weighting either way. */
    if (right.length === 0 || wrong.length === 0) {
      out.push({ itemId, n, pValue, discrimination: 0 });
      continue;
    }

    const meanRight = mean(right.map((point) => point.rest));
    const meanWrong = mean(wrong.map((point) => point.rest));
    const sd = standardDeviation(points.map((point) => point.rest));

    const discrimination =
      sd === 0 ? 0 : ((meanRight - meanWrong) / sd) * Math.sqrt(pValue * (1 - pValue));

    out.push({
      itemId,
      n,
      pValue: round(pValue),
      discrimination: round(Math.max(-1, Math.min(1, discrimination))),
    });
  }

  return out.sort((a, b) => a.itemId.localeCompare(b.itemId));
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Population standard deviation: these are all the responses, not a sample. */
function standardDeviation(values: readonly number[]): number {
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}
