'use client';

import { useState } from 'react';
import { Mono } from '@/components/ui/Mono';
import { IDEMPOTENCY_HEADER, useIdempotencyKey } from '@/components/security/useIdempotencyKey';
import { IndicativePrice } from '@/components/candidate/IndicativePrice';
import { loadEximpe } from '@/lib/payments/eximpe-client';
import { loadCashfree } from '@/lib/payments/cashfree-client';
import type { PricingSettings } from '@/lib/company/config';
import { fill, type Dictionary } from '@/lib/i18n';
import type { PaymentMethodHint, PaymentProvider } from '@/lib/payments/types';

/**
 * Asks for the fee, once the assessment is done.
 *
 * The fee moved to the end of the flow, so this is where it is collected. The
 * candidate has already answered everything and their score is on the screen
 * above this panel, and they are already in the recruitment database for free:
 * what is being bought is the package deliverables, and the copy says exactly
 * that rather than implying the score or the database is behind the wall.
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
  country,
  pricing,
}: {
  t: Dictionary;
  /** Formatted, from the server, so it matches every other place it appears. */
  price: string;
  pricing: PricingSettings;
  methods: PaymentMethodHint[];
  /* Taken from the interface rather than copied. The list was duplicated here
     and went stale the moment a fifth rail was added. */
  provider: PaymentProvider['name'];
  providerMode: 'sandbox' | 'production';
  /** From `x-vercel-ip-country`, read on the server. Display only. */
  country?: string | null;
}) {
  const s = t.status;
  const [method, setMethod] = useState<PaymentMethodHint>(methods[0] ?? 'card');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const idempotency = useIdempotencyKey();

  async function pay() {
    setBusy(true);
    setError('');
    try {
      const body = JSON.stringify({ method });
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json', [IDEMPOTENCY_HEADER]: idempotency.current(body) },
        body,
      });
      idempotency.settle(response);

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

      /* A rail's sandbox mode with no hosted page. The webhook will not arrive,
         so the page is reloaded to pick up the status the server already set. */
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
      <IndicativePrice t={t} country={country} pricing={pricing} />

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
              style={{ border: active ? '2px solid var(--color-ink)' : '1px solid var(--color-line-strong)' }}
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
        className="t-colors mt-5 cursor-pointer rounded-[12px] border-0 bg-ink px-5 py-3 text-[15px] font-medium text-paper hover:bg-ink-hover disabled:opacity-40"
      >
        {fill(s.unlockCta, { price })}
      </button>

      <p className="mt-4 mb-0 max-w-[62ch] text-[13px] leading-[1.6] text-muted">{s.unlockFine}</p>

      {/* A card-only rail abroad is an international payment for an Indian card,
          and many banks switch that off by default. Saying so first saves a
          declined payment the candidate would read as a problem with us. */}
      {!methods.includes('upi') && (
        <p className="mt-2.5 mb-0 max-w-[62ch] text-[13px] leading-[1.6] text-muted">
          This is an international card payment to our UAE company, so your bank converts it to rupees. If your
          card is declined, turn on international online payments in your bank app and try again.
        </p>
      )}

      {error && <p className="mt-3 mb-0 text-[14px] text-accent-deep">{error}</p>}
    </section>
  );
}
