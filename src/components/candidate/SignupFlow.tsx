'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Turnstile, TURNSTILE_HEADER } from '@/components/security/Turnstile';
import { PlacePicker } from '@/components/candidate/PlacePicker';
import { Icon } from '@/components/cms/primitives';
import { DIAL_CODES, DEFAULT_COUNTRY } from '@/lib/data/dial-codes';
import { phoneFields } from '@/lib/validation';
import { AREAS, POSITIONS, positionsInArea, type PositionSlug } from '@/lib/data/positions';
import { siteText } from '@/lib/cms/localize';
import { fill, type Dictionary, type Locale, localePath } from '@/lib/i18n';

type Gender = 'male' | 'female' | 'other';
type Errors = Partial<
  Record<
    | 'fullName'
    | 'mobile'
    | 'email'
    | 'password'
    | 'dateOfBirth'
    | 'gender'
    | 'nationality'
    | 'cityState'
    | 'relocate'
    | 'consent'
    | 'form',
    string
  >
>;

const FORM_STEPS = [
  'Personal Details',
  'Professional Details',
  'Documents',
  'Review & Submit',
] as const;

export function SignupFlow({
  locale,
  t,
  initialPosition,
  confirmedReceipt,
}: {
  locale: Locale;
  t: Dictionary;
  initialPosition: PositionSlug;
  confirmedReceipt?: string;
}) {
  const router = useRouter();
  const s = t.signup;
  const tx = (english: string) => siteText(locale, english);

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [receipt] = useState(confirmedReceipt ?? '');

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender | null>('male');
  const [nationality, setNationality] = useState('Indian');
  const [willingToRelocate, setWillingToRelocate] = useState<boolean | null>(true);
  const [hasPassport, setHasPassport] = useState<boolean | null>(null);
  const [registered, setRegistered] = useState(false);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [challengeKey, setChallengeKey] = useState(0);

  const [position, setPosition] = useState<PositionSlug>(initialPosition);
  const [years, setYears] = useState(0);
  const [cityState, setCityState] = useState('');
  const [placeCountry, setPlaceCountry] = useState(DEFAULT_COUNTRY);
  const [consent, setConsent] = useState(false);

  const validateStep = useCallback((): boolean => {
    const next: Errors = {};
    if (step === 0) {
      if (fullName.trim().length < 2) next.fullName = s.errRequired;
      if (!phoneFields.safeParse({ country, mobile }).success) next.mobile = s.errMobile;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) next.email = s.errEmail;
      if (password.length < 8) next.password = s.errPassword;
      if (!dateOfBirth) next.dateOfBirth = s.errRequired;
      if (!gender) next.gender = s.errRequired;
      if (nationality.trim().length < 2) next.nationality = s.errRequired;
      if (cityState.trim().length < 2) next.cityState = s.errRequired;
      if (willingToRelocate === null) next.relocate = s.errRequired;
    }
    if (step === 2 && hasPassport === null) next.form = s.errRequired;
    if (step === 3 && !consent) next.consent = s.errConsent;
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [
    step,
    fullName,
    mobile,
    country,
    email,
    password,
    dateOfBirth,
    gender,
    nationality,
    cityState,
    willingToRelocate,
    hasPassport,
    consent,
    s,
  ]);

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
          cityState: cityState.trim(),
          dateOfBirth,
          gender,
          nationality: nationality.trim(),
          willingToRelocate: willingToRelocate ?? false,
          consent: true,
        }),
      });

      if (!response.ok) throw new Error(`signup ${response.status}`);

      router.refresh();
      router.push(localePath(locale, '/assessment'));
    } catch (error) {
      console.error(error);
      setErrors({ form: s.payFailed });
      setBusy(false);
    }
  }

  async function register() {
    setBusy(true);
    setErrors({});
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-avsar-locale': locale,
          ...(challenge ? { [TURNSTILE_HEADER]: challenge } : {}),
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          country,
          mobile: mobile.replace(/[\s-]/g, ''),
          email: email.trim(),
          password,
          hasPassport: false,
          dateOfBirth,
          gender,
          nationality: nationality.trim(),
          willingToRelocate: willingToRelocate ?? false,
          cityState: cityState.trim(),
        }),
      });

      const data = (await response.json().catch(() => null)) as { status?: string } | null;

      if (data?.status !== 'created') {
        setChallenge(null);
        setChallengeKey((k) => k + 1);
      }

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
      setPlaceCountry(country);
      setStep(1);
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
    if (step === 3) {
      void submitProfile();
      return;
    }
    setStep(step + 1);
  }

  function back() {
    if (step === 0) {
      router.push(localePath(locale, '/'));
      return;
    }
    setStep(step - 1);
  }

  if (receipt) {
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
        <p className="m-0 mb-8 text-[16px] leading-[1.55] text-ink-2">{fill(s.successBody, { receipt })}</p>
        <Link
          href={localePath(locale, '/assessment')}
          className="btn-gradient t-colors inline-block px-5 py-3 text-[15px] font-semibold no-underline"
        >
          {s.successCta} →
        </Link>
      </div>
    );
  }

  const continueLabel =
    step === 0
      ? tx('Continue to Professional Details')
      : step === 1
        ? tx('Continue to Documents')
        : step === 2
          ? tx('Continue to Review')
          : tx('Submit profile');

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <h2 className="display-serif m-0 text-[clamp(26px,3.4cqi,36px)] font-normal leading-[1.12] text-[#142438]">
        {tx('Create Your Free Profile')}
      </h2>
      <p className="m-0 mt-2 text-[14px] leading-[1.55] text-ink-2">
        {tx('Join professionals from India building their careers in Portugal.')}
      </p>

      <ol className="m-0 mt-8 flex list-none gap-2 overflow-x-auto p-0 sm:grid sm:grid-cols-4 sm:gap-x-3 sm:overflow-visible">
        {FORM_STEPS.map((label, index) => {
          const active = index === step;
          const done = index < step;
          return (
            <li key={label} className="relative min-w-[5.5rem] flex-1 text-center sm:min-w-0">
              {index < FORM_STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className={`absolute start-[calc(50%+18px)] top-4 hidden h-px w-[calc(100%-36px)] sm:block ${
                    done ? 'bg-[var(--color-gold)]' : 'bg-line'
                  }`}
                />
              ) : null}
              <span
                className={`relative z-[1] mx-auto grid size-8 place-items-center rounded-full text-[13px] font-bold ${
                  active || done
                    ? 'bg-[var(--color-gold)] text-[#142438]'
                    : 'border border-line-strong bg-white text-muted'
                }`}
              >
                {done ? '✓' : index + 1}
              </span>
              <p
                className={`m-0 mt-2 text-[12px] leading-[1.3] ${
                  active ? 'font-semibold text-[#142438]' : 'font-medium text-muted'
                }`}
              >
                {tx(label)}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="mt-9">
        {step === 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label={tx('Full Name')} requiredMark error={errors.fullName}>
              <InputShell icon="users" error={!!errors.fullName}>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  placeholder={tx('e.g. Rahul Sharma')}
                  className={bareInput}
                />
              </InputShell>
            </Field>

            <Field label={tx('Email Address')} requiredMark error={errors.email}>
              <InputShell icon="chat" error={!!errors.email}>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder={tx('e.g. rahul@email.com')}
                  className={bareInput}
                />
              </InputShell>
            </Field>

            <div className="sm:col-span-2">
            <Field label={tx('Phone Number')} requiredMark error={errors.mobile}>
              <div
                className={`flex items-stretch overflow-hidden rounded-[10px] border bg-white focus-within:border-[#142438] ${
                  errors.mobile ? 'border-accent-deep' : 'border-line-strong'
                }`}
              >
                <select
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  dir="ltr"
                  aria-label={s.countryCode}
                  autoComplete="tel-country-code"
                  className="max-w-[9.5rem] shrink-0 cursor-pointer border-0 border-r border-line-strong bg-[#f7f7fb] py-3 pl-3 pr-2 font-mono text-[13px] text-ink-2 outline-none"
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
                  dir="ltr"
                  inputMode="tel"
                  autoComplete="tel-national"
                  maxLength={20}
                  placeholder="98765 43210"
                  className="w-full border-0 bg-transparent px-3.5 py-3 text-[15px] outline-none"
                />
              </div>
            </Field>
            </div>

            <Field label={tx('Create a password')} requiredMark hint={tx('At least 8 characters')} error={errors.password}>
              <InputShell icon="shield" error={!!errors.password}>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete="new-password"
                  className={bareInput}
                />
              </InputShell>
            </Field>

            <Field label={tx('Date of Birth')} requiredMark error={errors.dateOfBirth}>
              <InputShell icon="clock" error={!!errors.dateOfBirth}>
                <input
                  value={dateOfBirth}
                  onChange={(event) => setDateOfBirth(event.target.value)}
                  type="date"
                  className={bareInput}
                />
              </InputShell>
            </Field>

            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-2.5 p-0 text-[14px] font-medium text-[#142438]">
                {tx('Gender')} <span className="text-accent-deep">*</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { label: tx('Male'), value: 'male' as const },
                    { label: tx('Female'), value: 'female' as const },
                    { label: tx('Other'), value: 'other' as const },
                  ] as const
                ).map((option) => (
                  <RadioChip
                    key={option.value}
                    label={option.label}
                    active={gender === option.value}
                    onClick={() => setGender(option.value)}
                  />
                ))}
              </div>
              {errors.gender ? <p className="m-0 mt-1.5 text-[13px] text-accent-deep">{errors.gender}</p> : null}
            </fieldset>

            <Field label={tx('Nationality')} requiredMark error={errors.nationality}>
              <InputShell icon="globe" error={!!errors.nationality}>
                <input
                  value={nationality}
                  onChange={(event) => setNationality(event.target.value)}
                  className={bareInput}
                />
              </InputShell>
            </Field>

            <div className="sm:col-span-2">
              <PlacePicker
                value={cityState}
                onChange={setCityState}
                country={placeCountry}
                onCountryChange={setPlaceCountry}
                label={`${tx('Current Location')} *`}
                countryLabel={tx('Country')}
                error={errors.cityState}
                inputClassName={inputClass(!!errors.cityState)}
                language={locale}
              />
            </div>

            <fieldset className="m-0 border-0 p-0 sm:col-span-2">
              <legend className="mb-2.5 p-0 text-[14px] font-medium text-[#142438]">
                {tx('Willing to Relocate to Portugal?')} <span className="text-accent-deep">*</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                <RadioChip label={tx('Yes')} active={willingToRelocate === true} onClick={() => setWillingToRelocate(true)} />
                <RadioChip label={tx('No')} active={willingToRelocate === false} onClick={() => setWillingToRelocate(false)} />
              </div>
              {errors.relocate ? <p className="m-0 mt-1.5 text-[13px] text-accent-deep">{errors.relocate}</p> : null}
            </fieldset>

            {!registered ? (
              <div className="sm:col-span-2">
                <Turnstile key={challengeKey} onToken={setChallenge} />
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="flex flex-col gap-6">
            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-2.5 p-0 text-[14px] font-medium text-[#142438]">
                {s.mainSector} <span className="text-accent-deep">*</span>
              </legend>
              <div className="flex flex-col gap-3.5" role="radiogroup" aria-label={s.mainSector}>
                {AREAS.map((area) => {
                  const positions = positionsInArea(area.slug);
                  if (positions.length === 0) return null;
                  return (
                    <div key={area.slug}>
                      <p className="m-0 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                        {area.label}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {positions.map((option) => {
                          const index = POSITIONS.findIndex((item) => item.slug === option.slug);
                          const active = position === option.slug;
                          return (
                            <RadioChip
                              key={option.slug}
                              label={t.sectors[index] ?? option.label}
                              active={active}
                              onClick={() => setPosition(option.slug)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <Field label={s.years} requiredMark>
              <select value={years} onChange={(event) => setYears(Number(event.target.value))} className={inputClass(false)}>
                {s.yearOptions.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-5">
            <p className="m-0 text-[14px] leading-[1.55] text-ink-2">
              {tx('Tell us about your passport. You can upload your CV and other documents from your dashboard after the free skills test.')}
            </p>
            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-2.5 p-0 text-[14px] font-medium text-[#142438]">
                {s.passportQ} <span className="text-accent-deep">*</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                <RadioChip label={s.passportYes} active={hasPassport === true} onClick={() => setHasPassport(true)} />
                <RadioChip label={s.passportNo} active={hasPassport === false} onClick={() => setHasPassport(false)} />
              </div>
            </fieldset>
            {errors.form ? <p className="m-0 text-[13px] text-accent-deep">{errors.form}</p> : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-5">
            <dl className="m-0 grid list-none grid-cols-1 gap-3 rounded-[12px] border border-line bg-[#f7f7fb] p-4 text-[14px] sm:grid-cols-2">
              <ReviewItem label={tx('Full Name')} value={fullName} />
              <ReviewItem label={tx('Email Address')} value={email} />
              <ReviewItem label={tx('Phone Number')} value={`${country} ${mobile}`} />
              <ReviewItem label={tx('Date of Birth')} value={dateOfBirth} />
              <ReviewItem label={tx('Gender')} value={gender ? tx(gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Other') : '—'} />
              <ReviewItem label={tx('Nationality')} value={nationality} />
              <ReviewItem label={tx('Current Location')} value={cityState} />
              <ReviewItem
                label={tx('Willing to Relocate to Portugal?')}
                value={willingToRelocate ? tx('Yes') : tx('No')}
              />
              <ReviewItem
                label={s.mainSector}
                value={t.sectors[POSITIONS.findIndex((item) => item.slug === position)] ?? position}
              />
              <ReviewItem label={s.years} value={s.yearOptions[years] ?? String(years)} />
              <ReviewItem label={s.passportQ} value={hasPassport ? s.passportYes : s.passportNo} />
            </dl>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="sr-only-focusable peer"
                aria-describedby="consent-text"
              />
              <span
                aria-hidden
                className={`mt-0.5 flex size-[20px] shrink-0 items-center justify-center rounded-[5px] border text-[12px] font-semibold ${
                  consent
                    ? 'border-[var(--color-gold)] bg-[var(--color-gold)] text-[#142438]'
                    : 'border-line-strong bg-white text-transparent'
                }`}
              >
                ✓
              </span>
              <span id="consent-text" className="text-[13px] leading-[1.55] text-ink-2">
                {tx('I agree to the')}{' '}
                <Link href={localePath(locale, '/terms')} className="prose-link">
                  {tx('Terms of Service')}
                </Link>{' '}
                {tx('and')}{' '}
                <Link href={localePath(locale, '/privacy')} className="prose-link">
                  {tx('Privacy Policy')}
                </Link>
                . {s.consentNoPlacement}{' '}
                <Link href={localePath(locale, '/selection-rules')} className="prose-link">
                  {s.consentRules}
                </Link>
                .
              </span>
            </label>
            {errors.consent ? <p className="m-0 text-[13px] text-accent-deep">{errors.consent}</p> : null}
            {errors.form ? <p className="m-0 text-[13px] text-accent-deep">{errors.form}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={back}
          className="t-colors order-2 cursor-pointer rounded-[10px] border border-line-strong bg-white px-5 py-3 text-[15px] hover:border-ink sm:order-1"
        >
          {s.back}
        </button>
        <button
          type="button"
          onClick={next}
          disabled={busy || (step === 3 && !consent)}
          className="btn-gradient t-colors order-1 w-full cursor-pointer px-5 py-3.5 text-[15px] font-semibold disabled:cursor-not-allowed disabled:opacity-100 sm:order-2 sm:flex-1"
        >
          {busy ? tx('Please wait…') : (
            <>
              {continueLabel}
              <span aria-hidden> →</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

const bareInput =
  'w-full border-0 bg-transparent px-3.5 py-3 text-[15px] outline-none';

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</dt>
      <dd className="m-0 mt-1 truncate font-medium text-[#142438]">{value || '—'}</dd>
    </div>
  );
}

function RadioChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`t-colors cursor-pointer rounded-full border px-4 py-2.5 text-[14px] font-medium ${
        active
          ? 'border-[var(--color-gold)] bg-[var(--color-gold)] text-[#142438]'
          : 'border-line-strong bg-white text-[#142438] hover:border-[#142438]'
      }`}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  hint,
  error,
  requiredMark,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  requiredMark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[14px] font-medium text-[#142438]">
        {label}
        {requiredMark ? <span className="text-accent-deep"> *</span> : null}
        {hint ? <span className="ml-1.5 font-normal text-muted">({hint})</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1.5 block text-[13px] text-accent-deep">{error}</span> : null}
    </label>
  );
}

function InputShell({
  icon,
  error,
  children,
}: {
  icon: string;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-stretch overflow-hidden rounded-[10px] border bg-white focus-within:border-[#142438] ${
        error ? 'border-accent-deep' : 'border-line-strong'
      }`}
    >
      <span className="grid place-items-center border-r border-line-strong bg-[#f7f7fb] px-3 text-muted">
        <Icon name={icon} className="size-4" />
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function inputClass(hasError: boolean): string {
  return `t-colors w-full rounded-[10px] border bg-white px-3.5 py-3 text-[15px] outline-none ${
    hasError ? 'border-accent-deep' : 'border-line-strong focus:border-[#142438]'
  }`;
}
