import { afterEach, describe, expect, it, vi } from 'vitest';
import { canEncrypt, decryptValue, encryptValue } from '@/lib/integrations/crypto';
import { ENVIRONMENT_ONLY, INTEGRATIONS, MANAGED_FIELDS, managedField } from '@/lib/integrations/catalog';
import { fillTemplate, paragraphsOf, DEFAULT_EMAILS } from '@/lib/email/templates';
import { DEFAULT_SETTINGS, mergeSettings } from '@/lib/cms/settings';
import { formatMoney, priceBreakdown, DEFAULT_PRICING, type PricingSettings } from '@/lib/company/config';

const MASTER = 'a-test-master-key-that-is-long-enough-0123456789';

describe('integration secret encryption', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('round-trips a value', () => {
    vi.stubEnv('INTEGRATIONS_MASTER_KEY', MASTER);
    expect(canEncrypt()).toBe(true);
    const sealed = encryptValue('sk_live_123');
    expect(sealed.ciphertext).not.toContain('sk_live_123');
    expect(decryptValue(sealed)).toBe('sk_live_123');
  });

  it('uses a fresh IV every time', () => {
    vi.stubEnv('INTEGRATIONS_MASTER_KEY', MASTER);
    expect(encryptValue('same').iv).not.toBe(encryptValue('same').iv);
  });

  it('refuses a tampered ciphertext instead of returning a different value', () => {
    vi.stubEnv('INTEGRATIONS_MASTER_KEY', MASTER);
    const sealed = encryptValue('secret-value');
    const bytes = Buffer.from(sealed.ciphertext, 'base64');
    bytes[0] = (bytes[0] ?? 0) ^ 0xff;
    expect(decryptValue({ ...sealed, ciphertext: bytes.toString('base64') })).toBeNull();
  });

  it('cannot decrypt under another master key', () => {
    vi.stubEnv('INTEGRATIONS_MASTER_KEY', MASTER);
    const sealed = encryptValue('secret-value');
    vi.stubEnv('INTEGRATIONS_MASTER_KEY', `${MASTER}-rotated`);
    expect(decryptValue(sealed)).toBeNull();
  });

  it('will not encrypt without a long enough master key', () => {
    vi.stubEnv('INTEGRATIONS_MASTER_KEY', 'short');
    expect(canEncrypt()).toBe(false);
    expect(() => encryptValue('x')).toThrow('integrations_master_key_missing');
  });
});

describe('integration catalog', () => {
  it('has unique field names', () => {
    const names = MANAGED_FIELDS.map((field) => field.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('never manages a browser-bundled or bootstrap variable', () => {
    for (const field of MANAGED_FIELDS) expect(field.name.startsWith('NEXT_PUBLIC_')).toBe(false);
    for (const { name } of ENVIRONMENT_ONLY) expect(managedField(name)).toBeUndefined();
  });

  it('has unique integration ids', () => {
    const ids = INTEGRATIONS.flatMap((group) => group.items.map((item) => item.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('email templates', () => {
  it('fills known placeholders and blanks unknown ones', () => {
    expect(fillTemplate('Hello {{first_name}}, {{ missing }}ok', { first_name: 'Asha' })).toBe('Hello Asha, ok');
  });

  it('drops paragraphs left empty by an absent value', () => {
    const body = fillTemplate('One\n\n{{note}}\n\nTwo', {});
    expect(paragraphsOf(body)).toEqual(['One', 'Two']);
  });

  it('keeps every default template free of HTML', () => {
    for (const template of Object.values(DEFAULT_EMAILS)) {
      for (const text of Object.values(template)) {
        if (typeof text === 'string') expect(text).not.toMatch(/<[a-z!/]/i);
      }
    }
  });
});

describe('settings merge', () => {
  it('returns the defaults when nothing is stored', () => {
    expect(mergeSettings([])).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps currencies added in code when an older row is stored', () => {
    const merged = mergeSettings([{ key: 'pricing', value: { feeMinor: { EUR: 3_000 } } }]);
    expect(merged.pricing.feeMinor.EUR).toBe(3_000);
    expect(merged.pricing.feeMinor.INR).toBe(DEFAULT_PRICING.feeMinor.INR);
  });

  it('ignores unknown keys', () => {
    const merged = mergeSettings([{ key: 'not_a_setting', value: { x: 1 } }]);
    expect(merged).toEqual(DEFAULT_SETTINGS);
  });
});

describe('pricing from settings', () => {
  it('keeps VAT inside the total, in integer minor units', () => {
    const pricing: PricingSettings = { ...DEFAULT_PRICING, chargeCurrency: 'EUR', feeMinor: { ...DEFAULT_PRICING.feeMinor, EUR: 2_460 }, vatBasisPoints: 2_300 };
    const { netMinor, vatMinor, totalMinor } = priceBreakdown(pricing);
    expect(totalMinor).toBe(2_460);
    expect(netMinor + vatMinor).toBe(totalMinor);
    expect(Number.isInteger(netMinor)).toBe(true);
  });

  it('formats rupees with the Indian grouping', () => {
    expect(formatMoney(240_000, 'INR')).toContain('₹2,400');
  });
});
