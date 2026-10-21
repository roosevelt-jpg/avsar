'use client';

import { useState } from 'react';
import { Mono } from '@/components/ui/Mono';
import { IDEMPOTENCY_HEADER, useIdempotencyKey } from '@/components/security/useIdempotencyKey';
import { CheckoutTrust } from '@/components/candidate/CheckoutTrust';
import { PackagePaywallCopy } from '@/components/candidate/PackagePaywallCopy';
import { loadEximpe } from '@/lib/payments/eximpe-client';
import { loadCashfree } from '@/lib/payments/cashfree-client';
import { openRazorpayCheckout } from '@/lib/payments/razorpay-client';
import { openPaytmCheckout, parsePaytmClientToken } from '@/lib/payments/paytm-client';
import type { CompanySettings, HiringSettings } from '@/lib/company/config';
import type { ConversionSettings } from '@/lib/cms/settings';
import { siteText } from '@/lib/cms/localize';
import { fill, type Dictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import type { CheckoutProduct } from '@/lib/company/config';
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
  prices,
  owns,
  methods,
  provider,
  providerMode,
  conversion,
  hiring,
  company,
  whatsapp,
  supportEmail,
  preferUpi = false,
}: {
  t: Dictionary;
  locale: Locale;
  /** Formatted on the server. The browser never decides an amount. */
  prices: { skills: string; visa: string; bundle: string; separate: string };
  owns: { skills: boolean; visa: boolean };
  conversion: ConversionSettings;
  hiring: HiringSettings;
  company: CompanySettings;
  whatsapp: string;
  supportEmail: string;
  /** After a cancelled checkout, UPI is the method most Indian cards were blocking. */
  preferUpi?: boolean;
  methods: PaymentMethodHint[];
  provider: PaymentProvider['name'];
  providerMode: 'sandbox' | 'production';
}) {
  const s = t.status;
  const [method, setMethod] = useState<PaymentMethodHint>(
    preferUpi && methods.includes('upi') ? 'upi' : (methods[0] ?? 'card'),
  );
  const digits = whatsapp.replace(/[^\d]/g, '');
  const talkText =
    locale === 'hi'
      ? 'नमस्ते, मैं मुफ़्त मूल्यांकन पूरा कर चुका/चुकी हूँ और रिपोर्ट खरीदने से पहले बात करना चाहता/चाहती हूँ।'
      : 'Hello, I finished the free assessment and want to talk before I buy a report.';
  const choices: { id: CheckoutProduct; title: string; price: string; note: string }[] = [
    !owns.skills && !owns.visa
      ? {
          id: 'bundle',
          title: siteText(locale, 'Both reports'),
          price: prices.bundle,
          note: siteText(locale, 'Offered together here, instead of the two prices added up.'),
        }
      : null,
    !owns.skills
      ? {
          id: 'skills_report',
          title: siteText(locale, 'Skills report'),
          price: prices.skills,
          note: siteText(locale, 'A PDF that leads with the field you scored highest in, so an employer sees that first.'),
        }
      : null,
    !owns.visa
      ? {
          id: 'visa_requirements',
          title: siteText(locale, 'Visa requirements'),
          price: prices.visa,
          note: siteText(locale, 'What is missing for the visa, document by document. Not a visa decision.'),
        }
      : null,
  ].filter((choice): choice is { id: CheckoutProduct; title: string; price: string; note: string } => choice !== null);

  const [product, setProduct] = useState<CheckoutProduct>(choices[0]?.id ?? 'bundle');
  const selected = choices.find((choice) => choice.id === product) ?? choices[0];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const idempotency = useIdempotencyKey();
  const shortlistLabel = `${(hiring.shortlistMinScore / 10).toFixed(hiring.shortlistMinScore % 10 === 0 ? 0 : 1)} out of 10`;

  async function pay() {
    setBusy(true);
    setError('');
    try {
      const body = JSON.stringify({ method, product: selected?.id ?? product });
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
        window.location.assign(data.redirectUrl);
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
        {siteText(
          locale,
          'You only pay for these documents. The account, the rewritten CV, the test and your score are free. Interviews are free. A contract, housing, the flight and legal support come after a successful offer. The employer pays the placement fee.',
        )}
      </p>
      {!owns.skills && !owns.visa ? (
        <p className="m-0 mt-2 max-w-[62ch] text-[14px] leading-[1.6] text-ink-2">
          {siteText(locale, 'Bought separately they add up to')} {prices.separate}.{' '}
          {siteText(locale, 'Together they are')} {prices.bundle}.
        </p>
      ) : null}

      {choices.length > 0 && selected ? (
        <div role="radiogroup" aria-label={siteText(locale, 'What you are buying')} className="mt-5 flex flex-col gap-2.5">
          {choices.map((choice) => {
            const active = choice.id === selected.id;
            return (
              <button
                key={choice.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setProduct(choice.id)}
                className="t-colors cursor-pointer rounded-[12px] bg-surface px-4 py-3 text-left"
                style={{ border: active ? '2px solid var(--color-ink)' : '1px solid var(--color-line-strong)' }}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-medium">{choice.title}</span>
                  <span className="font-mono text-[14px]">{choice.price}</span>
                </span>
                <span className="mt-1 block text-[13px] leading-[1.5] text-ink-2">{choice.note}</span>
              </button>
            );
          })}
        </div>
      ) : null}

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

      <div className="mt-5 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => void pay()}
          disabled={busy}
          className="t-colors cursor-pointer rounded-[12px] border-0 bg-ink px-5 py-3 text-[15px] font-medium text-paper hover:bg-ink-hover disabled:opacity-40"
        >
          {fill(siteText(locale, 'Pay {price}'), { price: selected?.price ?? '' })}
        </button>
        {digits ? (
          <a
            href={`https://wa.me/${digits}?text=${encodeURIComponent(talkText)}`}
            target="_blank"
            rel="noreferrer"
            className="t-colors inline-flex items-center rounded-[12px] border border-line-strong bg-surface px-5 py-3 text-[15px] font-medium text-ink no-underline hover:border-ink"
          >
            {siteText(locale, 'Talk before you pay')}
          </a>
        ) : null}
      </div>

      {/* A card-only rail abroad is an international payment for an Indian card,
          and many banks switch that off by default. Saying so first saves a
          declined payment the candidate would read as a problem with us. */}
      {!methods.includes('upi') && (
        <p className="mt-2.5 mb-0 max-w-[62ch] text-[13px] leading-[1.6] text-muted">
          This is an international card payment to our UAE company, so your bank converts it to rupees. If your
          card is declined, turn on international online payments in your bank app and try again.
        </p>
      )}

      <CheckoutTrust locale={locale} company={company} whatsapp={whatsapp} supportEmail={supportEmail} />

      {error && <p className="mt-3 mb-0 text-[14px] text-accent-deep">{error}</p>}
    </section>
  );
}
