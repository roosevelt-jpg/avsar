'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { Mono } from '@/components/ui/Mono';
import { AREAS, POSITIONS, positionsInArea, type PositionSlug } from '@/lib/data/positions';
import { formatInr, activePrice } from '@/lib/data/cohort';
import { fill, type Dictionary, type Locale } from '@/lib/i18n';
import { loadCashfree } from '@/lib/payments/cashfree-client';

type Method = 'upi' | 'card' | 'netbanking';

const METHODS: readonly { id: Method; subKey: 0 | 1 | 2 }[] = [
  { id: 'upi', subKey: 0 },
  { id: 'card', subKey: 1 },
  { id: 'netbanking', subKey: 2 },
];

/** Payment-method copy that stays in English: these are brand names. */
const METHOD_SUBS = [
  'Google Pay, PhonePe, Paytm, BHIM',
  'Visa, Mastercard, RuPay',
  'All major Indian banks',
] as const;

const METHOD_LABELS_EN = ['UPI', 'Debit or credit card', 'Net banking'] as const;

type Errors = Partial<Record<'fullName' | 'mobile' | 'email' | 'cityState' | 'consent' | 'form', string>>;

export function SignupFlow({
  locale,
  t,
  initialPosition,
  /** Set when the browser has come back from Checkout with a confirmed payment. */
  confirmedReceipt,
  /**
   * Methods the active rail can actually charge. On Stripe outside India this is
   * cards only, so UPI and net banking are shown disabled rather than promised
   * and then missing from the provider's page.
   */
  availableMethods,
  /** Which rail is active, so the client knows how to open checkout. */
  provider,
  /** Sandbox or production, for the provider's browser SDK. */
  providerMode,
}: {
  locale: Locale;
  t: Dictionary;
  initialPosition: PositionSlug;
  confirmedReceipt?: string;
  availableMethods: readonly Method[];
  provider: 'stripe' | 'razorpay' | 'cashfree';
  providerMode: 'sandbox' | 'production';
}) {
  const router = useRouter();
  const s = t.signup;
  const price = activePrice();

  const [step, setStep] = useState(confirmedReceipt ? 3 : 0);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(confirmedReceipt ?? '');

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [hasPassport, setHasPassport] = useState<boolean | null>(null);

  const [position, setPosition] = useState<PositionSlug>(initialPosition);
  const [years, setYears] = useState(0);
  const [englishSelf, setEnglishSelf] = useState(0);
  const [cityState, setCityState] = useState('');

  const [method, setMethod] = useState<Method>(availableMethods[0] ?? 'card');
  const [consent, setConsent] = useState(false);

  const titles = useMemo(() => [s.title0, s.title1, s.title2], [s.title0, s.title1, s.title2]);

  const validateStep = useCallback((): boolean => {
    const next: Errors = {};
    if (step === 0) {
      if (fullName.trim().length < 2) next.fullName = s.errRequired;
      if (!/^[6-9]\d{9}$/.test(mobile.replace(/[\s-]/g, ''))) next.mobile = s.errMobile;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) next.email = s.errEmail;
    }
    if (step === 1 && cityState.trim().length < 2) next.cityState = s.errRequired;
    if (step === 2 && !consent) next.consent = s.errConsent;
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [step, fullName, mobile, email, cityState, consent, s]);

  async function submitPayment() {
    setBusy(true);
    setErrors({});
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-avsar-locale': locale },
        body: JSON.stringify({
          fullName: fullName.trim(),
          mobile: mobile.replace(/[\s-]/g, ''),
          email: email.trim(),
          hasPassport: hasPassport ?? false,
          position,
          yearsExperience: years,
          englishSelf,
          cityState: cityState.trim(),
          method,
          consent: true,
        }),
      });

      if (!response.ok) throw new Error(`signup ${response.status}`);
      const data = (await response.json()) as {
        receipt: string;
        redirectUrl: string | null;
        clientToken: string | null;
        simulated: boolean;
      };

      setReceipt(data.receipt);

      /* Cashfree opens its own checkout from the page instead of handing back
         a URL, which is also what puts UPI in front of the candidate. */
      if (provider === 'cashfree' && data.clientToken) {
        const cashfree = await loadCashfree(providerMode);
        const result = await cashfree.checkout({
          paymentSessionId: data.clientToken,
          redirectTarget: '_self',
        });
        if (result.error) throw new Error(result.error.message ?? 'checkout_failed');
        return;
      }

      /* Hosted Checkout: hand the browser over to the provider. The success URL
         brings it back and the server confirms the session before this component
         is rendered again. */
      if (data.redirectUrl) {
        window.location.assign(data.redirectUrl);
        return;
      }

      /* No keys in this environment. Nothing was charged; show the success
         screen so the flow stays reviewable. */
      if (data.simulated) {
        setStep(3);
        return;
      }

      throw new Error('no_redirect_url');
    } catch (error) {
      console.error(error);
      setErrors({ form: s.payFailed });
      setBusy(false);
    }
  }

  function next() {
    if (!validateStep()) return;
    if (step === 2) {
      void submitPayment();
      return;
    }
    setStep(step + 1);
  }

  function back() {
    if (step === 0) {
      router.push(`/${locale}`);
      return;
    }
    setStep(step - 1);
  }

  /* --------------------------------------------------------------- success */
  if (step === 3) {
    return (
      <div className="max-w-[620px]">
        <span
          aria-hidden
          className="flex size-[52px] items-center justify-center rounded-full bg-accent-tint text-[24px] text-success"
        >
          ✓
        </span>
        <h1 className="mt-6 mb-3 text-[clamp(26px,3.4cqi,38px)] font-semibold leading-[1.1] tracking-[-0.03em]">
          {s.successTitle}
        </h1>
        <p className="m-0 mb-8 text-[16px] leading-[1.55] text-ink-2">
          {fill(s.successBody, { receipt })}
        </p>
        <Link
          href={`/${locale}/assessment`}
          className="t-colors inline-block rounded-[12px] bg-ink px-5 py-3 text-[15px] font-medium text-white no-underline hover:bg-accent"
        >
          {s.successCta} →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[620px] flex-1">
      {/* stepper */}
      <ol className="m-0 mb-9 grid list-none grid-cols-3 gap-3 p-0">
        {[s.stepAccount, s.stepProfile, s.stepPayment].map((label, index) => (
          <li key={label}>
            <div
              className={`h-1 rounded-full ${index <= step ? 'bg-ink' : 'bg-line'}`}
              aria-hidden
            />
            <Mono className={`mt-2.5 block ${index <= step ? 'text-ink' : 'text-muted'}`}>
              {index + 1}. {label}
            </Mono>
          </li>
        ))}
      </ol>

      <h1 className="m-0 mb-7 text-[clamp(26px,3.4cqi,38px)] font-semibold leading-[1.1] tracking-[-0.03em]">
        {titles[step]}
      </h1>

      {/* ------------------------------------------------------- step 1 account */}
      {step === 0 && (
        <div className="flex flex-col gap-5">
          <Field label={s.fullName} hint={s.fullNameHint} error={errors.fullName}>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              className={inputClass(!!errors.fullName)}
            />
          </Field>

          <Field label={s.mobile} error={errors.mobile}>
            <div className="flex items-stretch overflow-hidden rounded-[12px] border border-line-strong bg-surface focus-within:border-ink t-colors">
              <span className="flex items-center border-r border-line-strong bg-surface-subtle px-3.5 font-mono text-[14px] text-muted">
                +91
              </span>
              <input
                value={mobile}
                onChange={(event) => setMobile(event.target.value.replace(/[^\d\s-]/g, ''))}
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={13}
                className="w-full border-0 bg-transparent px-3.5 py-3 text-[16px] outline-none"
              />
            </div>
          </Field>

          <Field label={s.email} error={errors.email}>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              inputMode="email"
              autoComplete="email"
              className={inputClass(!!errors.email)}
            />
          </Field>

          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-2.5 p-0 text-[15px] font-medium">{s.passportQ}</legend>
            <div className="flex gap-2">
              {[
                { label: s.passportYes, value: true },
                { label: s.passportNo, value: false },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={hasPassport === option.value}
                  onClick={() => setHasPassport(option.value)}
                  className={`t-colors cursor-pointer rounded-full border px-[18px] py-2.5 text-[14px] ${
                    hasPassport === option.value
                      ? 'border-ink bg-ink text-white'
                      : 'border-line-strong bg-surface text-ink hover:border-ink'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {/* ------------------------------------------------------- step 2 profile */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-2.5 p-0 text-[15px] font-medium">{s.mainSector}</legend>
            <div className="flex flex-col gap-3.5" role="radiogroup" aria-label={s.mainSector}>
              {AREAS.map((area) => {
                const positions = positionsInArea(area.slug);
                if (positions.length === 0) return null;
                return (
                  <div key={area.slug}>
                    <Mono className="mb-1.5 block text-muted">{area.label.toUpperCase()}</Mono>
                    <div className="flex flex-wrap gap-2">
                      {positions.map((option) => {
                        const index = POSITIONS.findIndex((item) => item.slug === option.slug);
                        const active = position === option.slug;
                        return (
                          <button
                            key={option.slug}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setPosition(option.slug)}
                            className={`t-colors cursor-pointer rounded-full border px-[14px] py-2 text-[14px] ${
                              active
                                ? 'border-ink bg-ink text-white'
                                : 'border-line-strong bg-surface text-ink hover:border-ink'
                            }`}
                          >
                            {t.sectors[index] ?? option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <Field label={s.years}>
            <select
              value={years}
              onChange={(event) => setYears(Number(event.target.value))}
              className={inputClass(false)}
            >
              {s.yearOptions.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label={s.englishSelf}>
            <select
              value={englishSelf}
              onChange={(event) => setEnglishSelf(Number(event.target.value))}
              className={inputClass(false)}
            >
              {s.englishOptions.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label={s.cityState} error={errors.cityState}>
            <input
              value={cityState}
              onChange={(event) => setCityState(event.target.value)}
              autoComplete="address-level2"
              className={inputClass(!!errors.cityState)}
            />
          </Field>
        </div>
      )}

      {/* ------------------------------------------------------- step 3 payment */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div role="radiogroup" aria-label={s.title2} className="flex flex-col gap-2.5">
            {METHODS.map(({ id, subKey }) => {
              const active = method === id;
              const available = availableMethods.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-disabled={!available}
                  disabled={!available}
                  onClick={() => setMethod(id)}
                  className={`t-colors flex items-center gap-3.5 rounded-[12px] bg-surface p-4 text-left ${
                    available ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  }`}
                  style={{ border: active ? '2px solid #1b1a17' : '1px solid #d9d4c8' }}
                >
                  <span
                    aria-hidden
                    className="size-[18px] shrink-0 rounded-full"
                    style={{ border: active ? '6px solid #1b1a17' : '1.5px solid #b8b2a5' }}
                  />
                  <span>
                    <span className="block text-[15px] font-medium">{METHOD_LABELS_EN[subKey]}</span>
                    <span className="block text-[13px] text-muted">
                      {available ? METHOD_SUBS[subKey] : 'Not available yet'}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mandatory odds disclosure. The button stays disabled until it is checked. */}
          <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-[12px] border border-line bg-surface-subtle p-4">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="sr-only-focusable peer"
              aria-describedby="consent-text"
            />
            <span
              aria-hidden
              className="mt-px flex size-[20px] shrink-0 items-center justify-center rounded-[6px] border border-line-strong text-[13px] font-semibold text-white peer-checked:border-ink peer-checked:bg-ink"
              style={consent ? { background: '#1b1a17', borderColor: '#1b1a17' } : undefined}
            >
              {consent ? '✓' : ''}
            </span>
            <span id="consent-text" className="text-[13px] leading-[1.55] text-ink-2">
              {s.consent}{' '}
              <Link href={`/${locale}/selection-rules`} className="prose-link">
                {s.consentRules}
              </Link>{' '}
              &amp;{' '}
              <Link href={`/${locale}/refund-policy`} className="prose-link">
                {s.consentRefund}
              </Link>{' '}
              &amp;{' '}
              <Link href={`/${locale}/terms`} className="prose-link">
                {t.footerTerms}
              </Link>
              .
            </span>
          </label>

          {errors.consent && <p className="m-0 text-[13px] text-accent-deep">{errors.consent}</p>}
          {errors.form && <p className="m-0 text-[13px] text-accent-deep">{errors.form}</p>}
        </div>
      )}

      {/* navigation */}
      <div className="mt-9 flex items-center gap-3">
        <button
          type="button"
          onClick={back}
          className="t-colors cursor-pointer rounded-[12px] border border-line-strong bg-surface px-5 py-3 text-[15px] hover:border-ink"
        >
          {s.back}
        </button>
        <button
          type="button"
          onClick={next}
          disabled={busy || (step === 2 && !consent)}
          className="t-colors cursor-pointer rounded-[12px] border-0 bg-ink px-5 py-3 text-[15px] font-medium text-white hover:bg-accent disabled:cursor-not-allowed"
          style={{ opacity: step === 2 && !consent ? 0.35 : 1 }}
        >
          {step === 2 ? `${s.pay.replace('₹1,999', formatInr(price.totalPaise))}` : s.continue}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[15px] font-medium">
        {label}
        {hint ? <span className="ml-1.5 font-normal text-muted">({hint})</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1.5 block text-[13px] text-accent-deep">{error}</span> : null}
    </label>
  );
}

function inputClass(hasError: boolean): string {
  return `t-colors w-full rounded-[12px] border bg-surface px-3.5 py-3 text-[16px] outline-none ${
    hasError ? 'border-accent-deep' : 'border-line-strong focus:border-ink'
  }`;
}
