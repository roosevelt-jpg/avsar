import type { Locale } from '@/lib/i18n/path';
import ar from './ar.json';
import as from './as.json';
import bn from './bn.json';
import gu from './gu.json';
import hi from './hi.json';
import kn from './kn.json';
import ml from './ml.json';
import mr from './mr.json';
import or from './or.json';
import pa from './pa.json';
import ta from './ta.json';
import te from './te.json';
import ur from './ur.json';
import { coverageUpdates } from './coverage';
import { interfaceUpdates } from './interface';

/**
 * Translations of page copy rewritten or added after the generated files:
 * the October 2026 home page, the footer, the Zoom and immigration-lawyer
 * wording. JSON, one file per language, so a translator can work on one file
 * without touching code. Same rule as the rest: the key is the English source,
 * character for character, and tests/unit/translations.test.ts fails when one
 * is missing. Needs a native read before launch.
 */
const pages: Record<Exclude<Locale, 'en'>, Record<string, string>> = { hi, bn, mr, te, ta, ur, gu, kn, or, ml, pa, as, ar };

export const updates = Object.fromEntries(
  Object.entries(pages).map(([locale, copy]) => [
    locale,
    { ...copy, ...coverageUpdates[locale as Exclude<Locale, 'en'>], ...interfaceUpdates[locale as Exclude<Locale, 'en'>] },
  ]),
) as Record<Exclude<Locale, 'en'>, Record<string, string>>;
