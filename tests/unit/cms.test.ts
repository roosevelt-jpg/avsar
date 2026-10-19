import { describe, expect, it } from 'vitest';
import { DEFAULT_PAGES } from '@/lib/cms/defaults';
import { safeUrl, sanitizeBlocks } from '@/lib/cms/sanitize';
import { applyTokens, applyTokensDeep } from '@/lib/cms/tokens';
import { localHref } from '@/lib/cms/settings';

describe('sanitizeBlocks', () => {
  /* Defaults are written by hand, so a field the registry does not declare, or
     a value it would coerce, is a bug in either the default or the registry. */
  it.each(DEFAULT_PAGES.map((page) => [page.slug, page] as const))('keeps the %s defaults unchanged', (_slug, page) => {
    const clean = sanitizeBlocks(page.blocks);
    expect(clean.map((block) => block.id)).toEqual(page.blocks.map((block) => block.id));
    clean.forEach((block, i) => {
      const original = page.blocks[i]!;
      expect(block.type).toBe(original.type);
      for (const [key, value] of Object.entries(original.data)) {
        expect(block.data[key], `${page.slug} ${block.id}.${key}`).toEqual(value);
      }
    });
  });

  it('is idempotent', () => {
    for (const page of DEFAULT_PAGES) {
      const once = sanitizeBlocks(page.blocks);
      expect(sanitizeBlocks(once)).toEqual(once);
    }
  });

  it('removes javascript: and protocol-relative URLs', () => {
    const [block] = sanitizeBlocks([
      {
        id: 'x',
        type: 'cta',
        data: { title: 'Go', primary: { label: 'Click', href: 'javascript:alert(1)' }, secondary: { label: 'Off', href: '//evil.example' } },
      },
    ]);
    expect(block).toBeDefined();
    expect((block!.data.primary as { href: string }).href).toBe('');
    expect((block!.data.secondary as { href: string }).href).toBe('');
  });

  it('drops unknown block types and undeclared fields', () => {
    const blocks = sanitizeBlocks([
      { id: 'a', type: 'script', data: { html: '<script>' } },
      { id: 'b', type: 'rich_text', data: { body: 'Hello', html: '<b>x</b>' } },
    ]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.data).not.toHaveProperty('html');
  });

  it('replaces duplicate or malformed ids', () => {
    const blocks = sanitizeBlocks([
      { id: 'same', type: 'rich_text', data: {} },
      { id: 'same', type: 'rich_text', data: {} },
      { id: 'bad id!', type: 'rich_text', data: {} },
    ]);
    const ids = blocks.map((block) => block.id);
    expect(new Set(ids).size).toBe(3);
    expect(ids[0]).toBe('same');
    expect(ids[2]).not.toBe('bad id!');
  });

  it('returns nothing for non-arrays', () => {
    expect(sanitizeBlocks(null)).toEqual([]);
    expect(sanitizeBlocks({ type: 'hero' })).toEqual([]);
  });
});

describe('safeUrl', () => {
  it.each([
    ['/jobs', '/jobs'],
    ['#faq', '#faq'],
    ['https://example.com', 'https://example.com'],
    ['mailto:a@b.co', 'mailto:a@b.co'],
    ['tel:+351210000000', 'tel:+351210000000'],
    ['//evil.example', ''],
    ['javascript:alert(1)', ''],
    ['JAVASCRIPT:alert(1)', ''],
    ['data:text/html,x', ''],
    [42, ''],
  ])('%s → %s', (input, expected) => {
    expect(safeUrl(input)).toBe(expected);
  });
});

describe('applyTokens', () => {
  const values = { fee_inr: '₹2,400', whatsapp: '+91 90000 00000' };

  it('replaces known tokens, with or without inner spaces', () => {
    expect(applyTokens('Fee {{fee_inr}}, call {{ whatsapp }}', values)).toBe('Fee ₹2,400, call +91 90000 00000');
  });

  it('leaves unknown tokens visible so an editor notices', () => {
    expect(applyTokens('{{nope}} stays', values)).toBe('{{nope}} stays');
  });

  it('returns text without tokens untouched', () => {
    expect(applyTokens('plain', values)).toBe('plain');
  });

  it('walks nested block data', () => {
    expect(applyTokensDeep({ a: ['{{fee_inr}}'], b: { c: '{{whatsapp}}' }, n: 3 }, values)).toEqual({
      a: ['₹2,400'],
      b: { c: '+91 90000 00000' },
      n: 3,
    });
  });
});

describe('localHref', () => {
  it('leaves English paths without a prefix', () => {
    expect(localHref('en', '/jobs')).toBe('/jobs');
  });

  it('prefixes candidate paths for other languages', () => {
    expect(localHref('hi', '/jobs')).toBe('/hi/jobs');
    expect(localHref('ar', '/faq#visa')).toBe('/ar/faq#visa');
  });

  it('leaves console, API, absolute and already-localised URLs alone', () => {
    expect(localHref('hi', '/admin/jobs')).toBe('/admin/jobs');
    expect(localHref('hi', '/api/applications')).toBe('/api/applications');
    expect(localHref('hi', '/employers')).toBe('/employers');
    expect(localHref('hi', 'https://wa.me/91')).toBe('https://wa.me/91');
    expect(localHref('hi', '//cdn.example/x')).toBe('//cdn.example/x');
    expect(localHref('hi', '/ta/jobs')).toBe('/ta/jobs');
  });
});
