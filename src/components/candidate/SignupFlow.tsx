'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { Mono } from '@/components/ui/Mono';
import { ENTITY, PLACEMENT_FEE, PLACEMENT_FEE_UNDISCLOSED } from '@/lib/data/brand';
import { DIAL_CODES, DEFAULT_COUNTRY } from '@/lib/data/dial-codes';
import { phoneFields } from '@/lib/validation';
import { AREAS, POSITIONS, positionsInArea, type PositionSlug } from '@/lib/data/positions';
import { formatAed, activePrice } from '@/lib/data/cohort';
import { fill, type Dictionary, type Locale } from '@/lib/i18n';

type Errors = Partial<
  Record<'fullName' | 'mobile' | 'email' | 'password' | 'cityState' | 'consent' | 'form', string>
>;

export function SignupFlow({
  locale,
  t,
  initialPosition,
  /** Set when the browser has come back from Checkout with a confirmed payment. */
  confirmedReceipt,
}: {
  locale: Locale;
  t: Dictionary;
  initialPosition: PositionSlug;
  confirmedReceipt?: string;
}) {
  const router = useRouter();
  const s = t.signup;
  const price = activePrice();

  const [step, setStep] = useState(confirmedReceipt ? 3 : 0);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [receipt] = useState(confirmedReceipt ?? '');

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hasPassport, setHasPassport] = useState<boolean | null>(null);
  /* Set once the account exists, so Continue cannot open a second one if the
     candidate steps back to the first screen and forward again. */
  const [registered, setRegistered] = useState(false);

  const [position, setPosition] = useState<PositionSlug>(initialPosition);
  const [years, setYears] = useState(0);
  const [englishSelf, setEnglishSelf] = useState(0);
  const [cityState, setCityState] = useState('');

  const [consent, setConsent] = useState(false);

  const titles = useMemo(() => [s.title0, s.title1], [s.title0, s.title1]);

  const validateStep = useCallback((): boolean => {
    const next: Errors = {};
    if (step === 0) {
      if (fullName.trim().length < 2) next.fullName = s.errRequired;
      /* The same library the server validates with, so the form cannot pass
         something the API will then refuse, or refuse something it would take. */
      if (!phoneFields.safeParse({ country, mobile }).success) next.mobile = s.errMobile;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) next.email = s.errEmail;
      if (password.length < 8) next.password = s.errPassword;
    }
    if (step === 1 && cityState.trim().length < 2) next.cityState = s.errRequired;
    if (step === 1 && !consent) next.consent = s.errConsent;
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [step, fullName, mobile, country, email, password, cityState, consent, s]);

  /**
   * Saves the profile and sends them into the assessment.
   *
   * Nothing is charged here any more. The fee is collected afterwards, from the
   * dashboard, once there is a report to unlock; this step ends with the one
   * thing the candidate came to do.
   */
  async function submitProfile() {
    setBusy(true);
    setErrors({});
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-avsar-locale': locale },
        body: JSON.stringify({
          fullName: fullName.trim(),
          country,
          mobile: mobile.replace(/[\s-]/g, ''),
          email: email.trim(),
          hasPassport: hasPassport ?? false,
          position,
          yearsExperience: years,
          englishSelf,
          cityState: cityState.trim(),
          consent: true,
        }),
      });

      if (!response.ok) throw new Error(`signup ${response.status}`);

      router.refresh();
      router.push(`/${locale}/assessment`);
    } catch (error) {
      console.error(error);
      setErrors({ form: s.payFailed });
      setBusy(false);
    }
  }

  /**
   * Opens the account, and starts the session, at the first step.
   *
   * Everything after this runs signed in, so an abandoned application can be
   * resumed instead of restarted, and so nothing waits for an email to arrive.
   * The address is proved later; see /api/auth/register.
   */
  async function register() {
    setBusy(true);
    setErrors({});
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-avsar-locale': locale },
        body: JSON.stringify({
          fullName: fullName.trim(),
          country,
          mobile: mobile.replace(/[\s-]/g, ''),
          email: email.trim(),
          password,
          hasPassport: hasPassport ?? false,
        }),
      });

      const data = (await response.json().catch(() => null)) as { status?: string } | null;

      /* Supabase will not tell the browser that an address is taken, so the
         server answers instead. Without this the candidate would be shown
         "check your email" for an account they already have. */
      if (data?.status === 'account_exists') {
        setBusy(false);
        setErrors({ email: s.errAccountExists });
        return;
      }

      if (data?.status === 'phone_taken') {
        setBusy(false);
        setErrors({ mobile: s.errPhoneTaken });
        return;
      }

      if (!response.ok || data?.status !== 'created') {
        setBusy(false);
        setErrors({ email: s.errGeneric });
        return;
      }

      setRegistered(true);
      setBusy(false);
      setStep(1);
      /* The layout reads the session server side, so the header and the
         account menu are stale until this runs. */
      router.refresh();
    } catch (error) {
      console.error('[signup] register failed', error);
      setBusy(false);
      setErrors({ email: s.errGeneric });
    }
  }

  function next() {
    if (!validateStep()) return;
    if (step === 0 && !registered) {
      void register();
      return;
    }
    if (step === 1) {
      void submitProfile();
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
      <ol className="m-0 mb-9 grid list-none grid-cols-2 gap-3 p-0">
        {[s.stepAccount, s.stepProfile].map((label, index) => (
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

          {/*
            Country and number, as one control.

            It was a fixed `+91` with ten digits beside it, which told anybody
            outside India that the form was not for them. A native `<select>`
            rather than a styled listbox: on a phone it opens the system picker,
            which is searchable, scrollable to two hundred and forty-five
            entries, and already works with a screen reader.
          */}
          <Field label={s.mobile} error={errors.mobile}>
            <div className="flex items-stretch overflow-hidden rounded-[12px] border border-line-strong bg-surface focus-within:border-ink t-colors">
              <select
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                aria-label={s.countryCode}
                autoComplete="tel-country-code"
                className="max-w-[9.5rem] shrink-0 cursor-pointer border-0 border-r border-line-strong bg-surface-subtle py-3 pl-3.5 pr-2 font-mono text-[14px] text-ink-2 outline-none"
              >
                {DIAL_CODES.map((entry) => (
                  <option key={entry.country} value={entry.country}>
                    {entry.country} +{entry.dial}
                  </option>
                ))}
              </select>
              <input
                value={mobile}
                onChange={(event) => setMobile(event.target.value.replace(/[^\d\s-]/g, ''))}
                inputMode="tel"
                autoComplete="tel-national"
                maxLength={20}
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

          <Field label={s.passwordLabel} hint={s.passwordHint} error={errors.password}>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              /* Tells a password manager to offer to save it. Without it many
                 of them stay silent on a field they read as a login. */
              autoComplete="new-password"
              className={inputClass(!!errors.password)}
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

          {/*
            The disclosure, at the end of signup rather than at a checkout.

            The fee moved to the end of the flow, so a checkout no longer
            stands between a candidate and ninety minutes of answering. Left
            where it was, the odds and the placement fee would reach someone
            only after the work was done, which is the wrong order in which
            to learn what you are in for.
          */}
          {/*
            The placement fee, before the assessment fee is taken rather than
            after it. They are two different amounts with two different
            conditions, and a candidate who learns about the second one later
            has been treated badly whatever the paperwork says. It sits above
            the consent box deliberately: the box is the record that it was
            shown.
          */}
          {PLACEMENT_FEE.visibleToCandidates && (
            <p className="m-0 rounded-[12px] border border-accent bg-accent-tint px-4 py-3.5 text-[14px] leading-[1.6] text-ink">
              {fill(t.placementFee, {
                eur: PLACEMENT_FEE.eur.toLocaleString('en-GB'),
                price: formatAed(price.totalFils),
              })}
            </p>
          )}

          {/*
            The registered company is not the name on the door. Someone who
            pays S&A Recruitment and then sees an unfamiliar company debit
            their account reports it as fraud, and a UPI dispute cannot be
            contested: the money leaves immediately. Cheaper to say it here.
          */}
          <p className="m-0 text-[13px] leading-[1.55] text-muted">
            The charge appears as{' '}
            <span className="font-mono text-[12px] text-ink-2">{ENTITY.statementDescriptor}</span>{' '}
            on your statement. {ENTITY.tradingAs} is a trading name of {ENTITY.legalName}.
          </p>

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
              {/* The box is a record of what somebody agreed to, so it cannot
                  name an amount the site is not showing them. */}
              {PLACEMENT_FEE_UNDISCLOSED ? s.consentNoPlacement : s.consent}{' '}
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
          disabled={busy || (step === 1 && !consent)}
          className="t-colors cursor-pointer rounded-[12px] border-0 bg-ink px-5 py-3 text-[15px] font-medium text-white hover:bg-accent disabled:cursor-not-allowed"
          style={{ opacity: step === 1 && !consent ? 0.35 : 1 }}
        >
          {step === 1 ? s.startAssessment : s.continue}
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
