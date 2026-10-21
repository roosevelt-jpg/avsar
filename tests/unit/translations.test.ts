import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PAGES } from '@/lib/cms/defaults';
import { LEGAL_PAGES } from '@/lib/cms/defaults/legal';
import { contentCopy } from '@/lib/cms/copy';
import { translatableStrings } from '@/lib/cms/localize';
import { FOOTER_LABELS, WHATSAPP_LABELS } from '@/lib/cms/interface-copy';
import { locales } from '@/lib/i18n/path';

/*
 * Translations are looked up by the English sentence, character for
 * character. Editing a sentence in a default page silently turns it back to
 * English in every other language. This fails instead, and lists what is
 * missing so it can be added to src/lib/cms/copy/updates/<locale>.ts.
 *
 * The legal pages are left out on purpose: they are contracts, and a
 * translation of one needs a lawyer's sign-off, not a test.
 *
 * Set I18N_MISSING_OUT=<file> to write the missing strings as JSON, exact to
 * the character, for whoever is translating them.
 */
const legal = new Set(LEGAL_PAGES.map((page) => page.slug));
const english = new Set<string>();
for (const page of DEFAULT_PAGES) {
  if (legal.has(page.slug)) continue;
  translatableStrings(page.blocks, null, english);
  translatableStrings(page.seo, null, english);
  translatableStrings(page.title, null, english);
}
for (const text of Object.values(FOOTER_LABELS)) english.add(text);
for (const text of Object.values(WHATSAPP_LABELS)) english.add(text);

const report: Record<string, string[]> = {};

describe('shipped page copy is translated', () => {
  for (const locale of locales) {
    if (locale === 'en') continue;
    it(`has every default page string in ${locale}`, () => {
      const copy = contentCopy[locale];
      const missing = [...english].filter((text) => !copy[text]);
      report[locale] = missing;
      if (process.env.I18N_MISSING_OUT) writeFileSync(process.env.I18N_MISSING_OUT, JSON.stringify(report, null, 2));
      expect(missing).toEqual([]);
    });
  }
});
