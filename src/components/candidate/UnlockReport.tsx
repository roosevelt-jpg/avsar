'use client';

import { useState } from 'react';
import { Mono } from '@/components/ui/Mono';
import { loadEximpe } from '@/lib/payments/eximpe-client';
import { loadCashfree } from '@/lib/payments/cashfree-client';
import { PLACEMENT_FEE } from '@/lib/data/brand';
import { fill, type Dictionary } from '@/lib/i18n';
import type { PaymentMethodHint, PaymentProvider } from '@/lib/payments/types';

/**
 * Asks for the fee, once the assessment is done.
 *
 * The fee moved to the end of the flow, so this is where it is collected. The
 * candidate has already answered everything and their score is on the screen
 * above this panel: what is being bought is the documents they take away and
 * the place in the talent pool, and the copy says exactly that rather than
 * implying the score itself is behind the wall.
 *
 * The placement fee is repeated here too. It was disclosed at the end of
 * signup, before the assessment, but this is the moment money actually moves
 * and nobody should be reminded of a second fee only after paying the first.
 */

const METHOD_LABELS: Record<PaymentMethodHint, string> = {
  upi: 'UPI',
  card: 'Debit or credit card',
  netbanking: 'Net banking',
};

export function UnlockReport({
  t,
  price,
  methods,
  provider,
  providerMode,
}: {
  t: Dictionary;
  /** Formatted, from the server, so it matches every other place it appears. */
  price: string;
  methods: PaymentMethodHint[];
  /* Taken from the interface rather than copied. The list was duplicated here
     and went stale the moment a fifth rail was added. */
  provider: PaymentProvider['name'];
  providerMode: 'sandbox' | 'production';
}) {
  const s = t.status;
  const [method, setMethod] = useState<PaymentMethodHint>(methods[0] ?? 'card');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function pay() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ method }),
      });

      if (!response.ok) {
        setBusy(false);
        setError(t.auth.errGeneric);
        return;
      }

      const data = (await response.json()) as {
        redirectUrl: string | null;
        clientToken: string | null;
        simulated: boolean;
      };

      if (provider === 'eximpe' && data.clientToken) {
        const eximpe = await loadEximpe(providerMode);
        await eximpe.checkout({ sessionId: data.clientToken, redirectTarget: '_self' });
        return;
      }

      if (provider === 'cashfree' && data.clientToken) {
        const cashfree = await loadCashfree(providerMode);
        const result = await cashfree.checkout({
          paymentSessionId: data.clientToken,
          redirectTarget: '_self',
        });
        if (result.error) throw new Error(result.error.message ?? 'checkout_failed');
        return;
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      /* Simulated, in a demo environment. The webhook will not arrive, so the
         page is reloaded to pick up the status the server already set. */
      if (data.simulated) {
        window.location.reload();
        return;
      }

      setBusy(false);
      setError(t.auth.errGeneric);
    } catch (caught) {
      console.error('[unlock] checkout failed', caught);
      setBusy(false);
      setError(t.auth.errGeneric);
    }
  }

  return (
    <section className="mb-8 rounded-[16px] border border-accent bg-accent-tint p-[clamp(20px,3cqi,32px)]">
      <Mono className="text-accent-deep">{s.unlockEyebrow}</Mono>
      <h2 className="mt-2.5 mb-2 text-[clamp(20px,2.6cqi,26px)] font-semibold leading-[1.15]">
        {s.unlockTitle}
      </h2>
      <p className="m-0 max-w-[62ch] text-[15px] leading-[1.6] text-ink-2">
        {fill(s.unlockBody, { price })}
      </p>

      <div role="radiogroup" aria-label={s.unlockTitle} className="mt-5 flex flex-wrap gap-2.5">
        {methods.map((option) => {
          const active = method === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMethod(option)}
              className="t-colors cursor-pointer rounded-[10px] bg-surface px-4 py-2.5 text-[14px]"
              style={{ border: active ? '2px solid #1b1a17' : '1px solid #d9d4c8' }}
            >
              {METHOD_LABELS[option]}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => void pay()}
        disabled={busy}
        className="t-colors mt-5 cursor-pointer rounded-[12px] border-0 bg-ink px-5 py-3 text-[15px] font-medium text-white hover:bg-accent disabled:opacity-40"
      >
        {fill(s.unlockCta, { price })}
      </button>

      <p className="mt-4 mb-0 max-w-[62ch] text-[13px] leading-[1.6] text-muted">{s.unlockFine}</p>

      {PLACEMENT_FEE.visibleToCandidates && (
        <p className="mt-2.5 mb-0 max-w-[62ch] text-[13px] leading-[1.6] text-muted">
          {fill(t.placementFeeShort, { eur: PLACEMENT_FEE.eur.toLocaleString('en-GB') })}
        </p>
      )}

      {error && <p className="mt-3 mb-0 text-[14px] text-accent-deep">{error}</p>}
    </section>
  );
}
