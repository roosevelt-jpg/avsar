'use client';

import { useState } from 'react';
import { Mono } from '@/components/ui/Mono';
import { IDEMPOTENCY_HEADER, useIdempotencyKey } from '@/components/security/useIdempotencyKey';
import { IndicativePrice } from '@/components/candidate/IndicativePrice';
import { PackagePaywallCopy } from '@/components/candidate/PackagePaywallCopy';
import { loadEximpe } from '@/lib/payments/eximpe-client';
import { loadCashfree } from '@/lib/payments/cashfree-client';
import { openRazorpayCheckout } from '@/lib/payments/razorpay-client';
import { openPaytmCheckout, parsePaytmClientToken } from '@/lib/payments/paytm-client';
import type { HiringSettings, PricingSettings } from '@/lib/company/config';
import type { ConversionSettings } from '@/lib/cms/settings';
import { siteText } from '@/lib/cms/localize';
import { fill, type Dictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
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
  locale,
  price,
  methods,
  provider,
  providerMode,
  country,
  pricing,
  conversion,
  hiring,
}: {
  t: Dictionary;
  locale: Locale;
  /** Formatted, from the server, so it matches every other place it appears. */
  price: string;
  pricing: PricingSettings;
  conversion: ConversionSettings;
  hiring: HiringSettings;
  methods: PaymentMethodHint[];
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
  const shortlistLabel = `${(hiring.shortlistMinScore / 10).toFixed(hiring.shortlistMinScore % 10 === 0 ? 0 : 1)} out of 10`;

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

      if (provider === 'razorpay' && data.clientToken) {
        try {
          await openRazorpayCheckout({
            orderId: data.clientToken,
            name: s.unlockEyebrow,
            description: siteText(locale, s.unlockTitle),
          });
        } catch (err) {
          if (err instanceof Error && err.message === 'razorpay_dismissed') {
            setBusy(false);
            return;
          }
          throw err;
        }
        return;
      }

      if (provider === 'paytm' && data.clientToken) {
        const payload = parsePaytmClientToken(data.clientToken);
        if (!payload) throw new Error('paytm_token_invalid');
        await openPaytmCheckout(payload, providerMode);
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
    <section id="package" className="mb-8 scroll-mt-24 rounded-[16px] border border-accent bg-accent-tint p-[clamp(20px,3cqi,32px)]">
      <Mono className="text-accent-deep">{s.unlockEyebrow}</Mono>
      <h2 className="mt-2.5 mb-2 text-[clamp(20px,2.6cqi,26px)] font-semibold leading-[1.15]">
        {siteText(locale, s.unlockTitle)}
      </h2>
      <p className="m-0 max-w-[62ch] text-[15px] leading-[1.6] text-ink-2">
        {fill(s.unlockBody, { price })}
      </p>
      <IndicativePrice t={t} country={country} pricing={pricing} />

      <PackagePaywallCopy locale={locale} conversion={conversion} hiring={hiring} shortlistLabel={shortlistLabel} />

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
