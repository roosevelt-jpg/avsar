import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_HIRING, meetsShortlistScore } from '@/lib/company/config';
import { applyTokens, tokenValues } from '@/lib/cms/tokens';
import { DEFAULT_SETTINGS } from '@/lib/cms/settings';
import { backgroundFlags, backgroundSchema, backgroundToRow, EMPTY_BACKGROUND } from '@/lib/candidate/background';
import { scoreKinds } from '@/lib/relocation/documents';
import { ngeniusProvider } from '@/lib/payments/ngenius';
import { staffAlertRecipients } from '@/lib/notifications/staff';

describe('shortlist score', () => {
  it('needs strictly more than 7 out of 10', () => {
    expect(DEFAULT_HIRING.shortlistMinScore).toBe(70);
    expect(meetsShortlistScore(DEFAULT_HIRING, 70)).toBe(false);
    expect(meetsShortlistScore(DEFAULT_HIRING, 71)).toBe(true);
    expect(meetsShortlistScore({ shortlistMinScore: 60 }, 61)).toBe(true);
  });

  it('publishes only the historical shortlist figure', () => {
    expect(DEFAULT_HIRING.outcomeHired).toBeLessThanOrEqual(DEFAULT_HIRING.outcomeShortlisted);
    const values = tokenValues(DEFAULT_SETTINGS);
    expect(applyTokens('{{shortlist_hired}} of {{shortlist_size}}, above {{shortlist_score}}', values)).toBe('10 of 15, above 7');
  });
});

describe('background answers', () => {
  const base = {
    visaRefused: null,
    visaRefusalDetail: '',
    workedAbroad: null,
    workedAbroadDetail: '',
    overstayOrRemoval: null,
    overstayDetail: '',
    dependants: null,
    dependantsDetail: '',
  };

  it('accepts "not answered" for every question', () => {
    expect(backgroundSchema.safeParse(base).success).toBe(true);
  });

  it('refuses unknown fields, so nobody can write a candidate id through it', () => {
    expect(backgroundSchema.safeParse({ ...base, candidateId: 'x' }).success).toBe(false);
  });

  it('drops a detail written under a "no"', () => {
    const row = backgroundToRow({ ...base, visaRefused: false, visaRefusalDetail: 'leftover', dependants: 0, dependantsDetail: 'leftover' });
    expect(row.visa_refusal_detail).toBe('');
    expect(row.dependants_detail).toBe('');
  });

  it('flags a refusal and an overstay for the lawyers, and nothing else', () => {
    expect(backgroundFlags(EMPTY_BACKGROUND)).toEqual([]);
    expect(backgroundFlags({ ...EMPTY_BACKGROUND, visaRefused: true, overstayOrRemoval: true, workedAbroad: true })).toEqual([
      'Previous visa refusal',
      'Overstay or removal',
    ]);
  });
});

describe('national ID document', () => {
  it('counts towards nothing on its own: it stands in for a passport only for the legal review', () => {
    expect(scoreKinds(['national_id']).score).toBe(0);
  });
});

describe('N-Genius without credentials', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('simulates checkout and never reports a payment', async () => {
    vi.stubEnv('NGENIUS_API_KEY', '');
    expect(ngeniusProvider.isConfigured()).toBe(false);
    expect(await ngeniusProvider.confirmSession('anything')).toEqual({ paid: false, paymentId: null });
    expect(await ngeniusProvider.handleWebhook('{}', new Headers())).toBeNull();
  });

  it('refuses a webhook without the shared secret', async () => {
    vi.stubEnv('NGENIUS_API_KEY', 'key');
    vi.stubEnv('NGENIUS_OUTLET_REF', 'outlet');
    vi.stubEnv('NGENIUS_WEBHOOK_SECRET', 'secret');
    const headers = new Headers({ 'x-webhook-secret': 'wrong' });
    expect(await ngeniusProvider.handleWebhook(JSON.stringify({ order: { reference: 'r' } }), headers)).toBeNull();
  });
});

describe('staff alert recipients', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('reads a comma-separated list and skips anything that is not an address', () => {
    vi.stubEnv('STAFF_ALERT_EMAILS', ' a@x.com, ,b@y.com,nope ');
    expect(staffAlertRecipients()).toEqual(['a@x.com', 'b@y.com']);
  });
});
