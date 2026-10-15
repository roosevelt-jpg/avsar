import { describe, expect, it } from 'vitest';
import { becomesVisibleToEmployer } from '@/lib/applications/status';
import { languageAlternates } from '@/lib/i18n/path';

describe('becomesVisibleToEmployer', () => {
  it('fires on the move that first shows the application to the employer', () => {
    expect(becomesVisibleToEmployer('screening', 'shortlisted')).toBe(true);
    expect(becomesVisibleToEmployer('submitted', 'interview')).toBe(true);
    expect(becomesVisibleToEmployer('rejected', 'shortlisted')).toBe(true);
  });

  it('stays quiet for moves the employer can already see, or cannot see at all', () => {
    expect(becomesVisibleToEmployer('interview', 'shortlisted')).toBe(false);
    expect(becomesVisibleToEmployer('shortlisted', 'offer')).toBe(false);
    expect(becomesVisibleToEmployer('submitted', 'screening')).toBe(false);
    expect(becomesVisibleToEmployer('shortlisted', 'rejected')).toBe(false);
  });
});

describe('languageAlternates', () => {
  it('lists every language and an English x-default, from any localised path', () => {
    const { canonical, languages } = languageAlternates('/hi/jobs/line-cook-algarve');
    expect(canonical).toBe('/hi/jobs/line-cook-algarve');
    expect(languages.en).toBe('/jobs/line-cook-algarve');
    expect(languages.ar).toBe('/ar/jobs/line-cook-algarve');
    expect(languages['x-default']).toBe('/jobs/line-cook-algarve');
    expect(Object.keys(languages)).toHaveLength(15);
  });

  it('handles the home page', () => {
    const { languages } = languageAlternates('/');
    expect(languages.en).toBe('/');
    expect(languages.ta).toBe('/ta');
  });
});
