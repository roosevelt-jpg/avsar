'use client';

import { useState, useSyncExternalStore } from 'react';
import {
  CURRENCY_SYMBOLS,
  INDICATIVE_RATES,
  PRIMARY_INDICATIVE,
  indicativeAmount,
  type IndicativeCurrency,
} from '@/lib/data/brand';
import { fill, type Dictionary } from '@/lib/i18n';

/**
 * What the fee is worth in the candidate's own money. Never what is charged.
 *
 * Somebody in Kochi or Kathmandu reads "EUR 25" and has no feel for it, and a
 * price you cannot feel is a price you postpone. This closes that gap without
 * touching the charge: the amount taken is always EUR 25 and the candidate's own
 * bank converts it, at their bank's rate, which is theirs and is better than
 * what a dynamic-conversion checkout would give them.
 *
 * The figures are deliberately coarse. See `INDICATIVE_RATES`.
 */

/*
  The browser's region, used only to pick which currency to show first.

  This is the same reasoning that ruled the dial code out for charging, applied
  the other way round: an inferred country is far too weak to decide what to
  take from somebody's card, and perfectly good for deciding which row to open a
  dropdown on. Guessing wrong costs one click.
*/
const REGION_CURRENCY: Record<string, IndicativeCurrency> = {
  IN: 'INR',
  PH: 'PHP',
  NP: 'NPR',
  BD: 'BDT',
  PK: 'PKR',
  LK: 'LKR',
  AE: 'AED',
  EG: 'EGP',
  KE: 'KES',
  NG: 'NGN',
  US: 'USD',
  GB: 'GBP',
};


const CURRENCIES = Object.keys(INDICATIVE_RATES) as IndicativeCurrency[];

/*
  The browser language, or null on the server.

  `useSyncExternalStore` rather than reading it in an effect: the server has no
  navigator, and a value that appears during render on one side and not the
  other is a hydration mismatch. This is the one API that is allowed to answer
  differently in the two places. Nothing ever changes it, so the subscribe
  function has nothing to do.
*/
const neverChanges = () => () => {};
const languageOnClient = () => navigator.language;
const languageOnServer = () => null;

function detectCurrency(language: string | null): IndicativeCurrency | null {
  if (!language) return null;
  try {
    const region = new Intl.Locale(language).region;
    return (region && REGION_CURRENCY[region]) || null;
  } catch {
    /* A malformed language tag is not worth an error boundary. */
    return null;
  }
}

export function IndicativePrice({ t }: { t: Dictionary }) {
  const s = t.status;
  const language = useSyncExternalStore(neverChanges, languageOnClient, languageOnServer);
  const [chosen, setChosen] = useState<IndicativeCurrency | null>(null);

  /*
    What the candidate picked wins, then whatever the browser suggests, then the
    rupee. The last step is new: the candidates are Indian, so a browser that
    reports a region we have no rate for is far likelier to be an Indian phone
    set to en-GB than somebody who wants no conversion at all.
  */
  const currency = chosen ?? detectCurrency(language) ?? PRIMARY_INDICATIVE;

  const amount = indicativeAmount(currency);

  return (
    <p className="mt-2.5 mb-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px] leading-[1.6] text-muted">
      <span>
        {fill(s.indicative, {
          amount: `${CURRENCY_SYMBOLS[currency]}${amount.toLocaleString('en-US')}`,
        })}
      </span>
      <label className="inline-flex items-baseline gap-1.5">
        <span className="sr-only">{s.indicativeLabel}</span>
        <select
          value={currency}
          onChange={(event) => setChosen(event.target.value as IndicativeCurrency)}
          className="cursor-pointer rounded-[8px] border border-line-soft bg-surface px-2 py-1 text-[13px] text-ink-2"
        >
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </label>
    </p>
  );
}
