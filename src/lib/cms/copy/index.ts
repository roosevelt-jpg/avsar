import type { Locale } from '@/lib/i18n/path';
import { ar } from './ar';
import { as } from './as';
import { bn } from './bn';
import { gu } from './gu';
import { hi } from './hi';
import { kn } from './kn';
import { ml } from './ml';
import { mr } from './mr';
import { or } from './or';
import { pa } from './pa';
import { ta } from './ta';
import { te } from './te';
import { ur } from './ur';

/** English source string → translation. English itself is the key, so it is not listed. */
export type ContentCopy = Record<string, string>;

export const contentCopy: Record<Exclude<Locale, 'en'>, ContentCopy> = {
  hi,
  bn,
  mr,
  te,
  ta,
  ur,
  gu,
  kn,
  or,
  ml,
  pa,
  as,
  ar,
};
