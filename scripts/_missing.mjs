import { readFileSync, writeFileSync } from 'node:fs';

// Lists the English keys a locale's copy file does not have yet.
const locale = process.argv[2] ?? 'hi';
const sources = JSON.parse(readFileSync('scripts/copy-sources.json', 'utf8'));
const skip = new Set(['contact_cards', 'featured_jobs', 'job_categories', 'rich_text', 'trust_bar', 'PT', 'A2', 'B1']);
const text = readFileSync(`src/lib/cms/copy/${locale}.ts`, 'utf8');
const have = new Set([...text.matchAll(/^ {2}("(?:\\.|[^"\\])*"):/gm)].map((m) => JSON.parse(m[1])));
const missing = sources.filter((s) => !skip.has(s) && !have.has(s));
writeFileSync(`scripts/_missing-${locale}.json`, JSON.stringify(missing, null, 1));
console.log(locale, missing.length);
