import { describe, expect, it } from 'vitest';
import { linesTheyWrote } from '@/lib/candidate/own-words';
import { familyCopy } from '@/lib/cms/copy/family';

describe('lines they wrote', () => {
  it('keeps the source phrase and skips the rewritten line', () => {
    const lines = linesTheyWrote({
      experience: [
        {
          bullets: [
            { basedOn: 'Cooked breakfast for a hotel in Kochi for four years' },
            { basedOn: '  Cooked breakfast for a hotel in Kochi for four years  ' },
            { basedOn: 'short' },
            { basedOn: 'Held the late shift when the other cook was off' },
          ],
        },
      ],
    });
    expect(lines).toEqual([
      'Cooked breakfast for a hotel in Kochi for four years',
      'Held the late shift when the other cook was off',
    ]);
  });

  it('returns nothing when there is no CV yet', () => {
    expect(linesTheyWrote(null)).toEqual([]);
  });
});

describe('family page copy', () => {
  it('translates every line in every language', () => {
    for (const [locale, copy] of Object.entries(familyCopy)) {
      const same = Object.entries(copy).filter(([key, value]) => key === value);
      expect(same, locale).toEqual([]);
    }
  });
});
