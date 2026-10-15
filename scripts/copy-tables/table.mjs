import { readFileSync } from 'node:fs';

const sources = JSON.parse(readFileSync(new URL('../copy-sources.json', import.meta.url), 'utf8'));

/**
 * A translation table keyed by the English source string. A key ending in
 * "..." matches the one source string that starts with it, which keeps long
 * paragraphs and curly apostrophes out of exact-match trouble.
 *
 * Returns `{ [locale]: { [english]: translation } }`.
 */
export function table(locales, rows) {
  const out = Object.fromEntries(locales.map((code) => [code, {}]));
  for (const [key, ...values] of rows) {
    let english = key;
    if (key.endsWith('...')) {
      const prefix = key.slice(0, -3);
      const hits = sources.filter((s) => s.startsWith(prefix));
      if (hits.length !== 1) throw new Error(`prefix ${JSON.stringify(prefix)} matches ${hits.length}`);
      english = hits[0];
    } else if (!sources.includes(key)) {
      throw new Error(`not in sources: ${JSON.stringify(key)}`);
    }
    if (values.length !== locales.length) throw new Error(`wrong column count for ${JSON.stringify(key)}`);
    locales.forEach((code, i) => {
      out[code][english] = values[i];
    });
  }
  return out;
}
