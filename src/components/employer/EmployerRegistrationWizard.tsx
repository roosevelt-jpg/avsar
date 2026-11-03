'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Turnstile, TURNSTILE_HEADER, turnstileEnabled } from '@/components/security/Turnstile';
import { IDEMPOTENCY_HEADER, useIdempotencyKey } from '@/components/security/useIdempotencyKey';
import type { EmployerRegistrationSettings } from '@/lib/cms/employer-registration';

const field =
  't-colors w-full rounded-[10px] border border-line bg-[#f7f8fa] px-3.5 py-3 text-[15px] text-ink outline-none focus:border-[#0a088f] focus:bg-white';
const labelCls = 'mb-1.5 block text-[13px] font-medium text-ink-2';

type FormState = {
  companyName: string;
  industry: string;
  country: string;
  city: string;
  website: string;
  companySize: string;
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  roleTitle: string;
  openings: string;
  roleCity: string;
  employmentType: string;
  timeline: string;
  notes: string;
};

const EMPTY: FormState = {
  companyName: '',
  industry: '',
  country: 'Portugal',
  city: '',
  website: '',
  companySize: '',
  fullName: '',
  jobTitle: '',
  email: '',
  phone: '',
  roleTitle: '',
  openings: '',
  roleCity: '',
  employmentType: '',
  timeline: '',
  notes: '',
};

/** Three-step employer enquiry card matching the registration mockup. */
export function EmployerRegistrationWizard({ copy }: { copy: EmployerRegistrationSettings }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [challengeKey, setChallengeKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotency = useIdempotencyKey();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const step1Ready =
    form.companyName.trim() !== '' && form.fullName.trim() !== '' && form.email.trim() !== '';
  const step2Ready = form.roleTitle.trim() !== '';

  async function submit() {
    setBusy(true);
    setError(null);
    const openings = Number.parseInt(form.openings, 10);
    const body = JSON.stringify({
      companyName: form.companyName,
      industry: form.industry,
      country: form.country,
      city: form.city,
      website: form.website,
      companySize: form.companySize,
      fullName: form.fullName,
      jobTitle: form.jobTitle,
      email: form.email,
      phone: form.phone,
      whatsappOk: false,
      roleTitle: form.roleTitle,
      openings: Number.isFinite(openings) && openings > 0 ? openings : null,
      roleCity: form.roleCity,
      employmentType: form.employmentType,
      timeline: form.timeline,
      notes: form.notes,
      locale: 'en',
    });
    try {
      const response = await fetch('/api/employer/intake', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          [IDEMPOTENCY_HEADER]: idempotency.current(body),
          ...(challenge ? { [TURNSTILE_HEADER]: challenge } : {}),
        },
        body,
      });
      idempotency.settle(response);
      if (response.ok) {
        setDone(true);
        return;
      }
      setChallenge(null);
      setChallengeKey((k) => k + 1);
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(
        data?.error === 'challenge_failed'
          ? 'Please complete the security check and try again.'
          : 'We could not save this just now. Please try again in a moment.',
      );
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-[18px] border border-line bg-white p-8 text-center shadow-[0_18px_40px_-24px_rgba(10,8,143,0.4)]">
        <h3 className="display-serif m-0 text-[28px] text-[#0a088f]">{copy.successTitle}</h3>
        <p className="m-0 mt-3 text-[15px] leading-[1.55] text-ink-2">{copy.successBody}</p>
      </div>
    );
  }

  const steps = [
    { n: 1, label: copy.step1Label },
    { n: 2, label: copy.step2Label },
    { n: 3, label: copy.step3Label },
  ];

  return (
    <div className="rounded-[18px] border border-line bg-white p-5 shadow-[0_18px_40px_-24px_rgba(10,8,143,0.4)] sm:p-7">
      <h2 className="display-serif m-0 text-[clamp(22px,2.6cqi,28px)] font-normal text-[#0a088f]">{copy.formTitle}</h2>
      <p className="m-0 mt-2 text-[14px] leading-[1.5] text-ink-2">{copy.formIntro}</p>

      <ol className="m-0 mt-6 flex list-none items-center gap-0 p-0">
        {steps.map((item, index) => {
          const active = step === item.n;
          const doneStep = step > item.n;
          return (
            <li key={item.n} className="flex min-w-0 flex-1 items-center">
              <div className="flex min-w-0 flex-col items-center gap-1.5">
                <span
                  className={`grid size-8 place-items-center rounded-full text-[13px] font-semibold ${
                    active || doneStep ? 'bg-[var(--color-gold)] text-[#0a088f]' : 'border border-line bg-paper text-muted'
                  }`}
                >
                  {item.n}
                </span>
                <span className={`hidden text-center text-[11px] font-medium sm:block ${active ? 'text-[#0a088f]' : 'text-muted'}`}>
                  {item.label}
                </span>
              </div>
              {index < steps.length - 1 ? (
                <span aria-hidden className={`mx-1 mb-5 hidden h-px flex-1 sm:block ${doneStep ? 'bg-[var(--color-gold)]' : 'bg-line'}`} />
              ) : null}
            </li>
          );
        })}
      </ol>

      <form
        className="mt-7"
        onSubmit={(event) => {
          event.preventDefault();
          if (step === 1 && step1Ready) setStep(2);
          else if (step === 2 && step2Ready) setStep(3);
          else if (step === 3) void submit();
        }}
      >
        {step === 1 ? (
          <div className="flex flex-col gap-6">
            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-3 text-[14px] font-semibold text-[#0a088f]">{copy.companySectionTitle}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="companyName">
                    {copy.companyNameLabel} <span className="text-[#c96a4b]">*</span>
                  </label>
                  <input id="companyName" className={field} required value={form.companyName} placeholder={copy.companyNamePlaceholder} onChange={(e) => set('companyName', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="industry">
                    {copy.industryLabel}
                  </label>
                  <select id="industry" className={field} value={form.industry} onChange={(e) => set('industry', e.target.value)}>
                    <option value="">Select</option>
                    {copy.industryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="country">
                    {copy.countryLabel}
                  </label>
                  <select id="country" className={field} value={form.country} onChange={(e) => set('country', e.target.value)}>
                    {copy.countryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="city">
                    {copy.cityLabel}
                  </label>
                  <input id="city" className={field} value={form.city} placeholder={copy.cityPlaceholder} onChange={(e) => set('city', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="website">
                    {copy.websiteLabel}
                  </label>
                  <input id="website" className={field} value={form.website} placeholder={copy.websitePlaceholder} onChange={(e) => set('website', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="companySize">
                    {copy.companySizeLabel}
                  </label>
                  <select id="companySize" className={field} value={form.companySize} onChange={(e) => set('companySize', e.target.value)}>
                    <option value="">Select</option>
                    {copy.companySizeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>

            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-3 text-[14px] font-semibold text-[#0a088f]">{copy.contactSectionTitle}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls} htmlFor="fullName">
                    {copy.fullNameLabel} <span className="text-[#c96a4b]">*</span>
                  </label>
                  <input id="fullName" className={field} required value={form.fullName} placeholder={copy.fullNamePlaceholder} onChange={(e) => set('fullName', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="jobTitle">
                    {copy.jobTitleLabel}
                  </label>
                  <input id="jobTitle" className={field} value={form.jobTitle} placeholder={copy.jobTitlePlaceholder} onChange={(e) => set('jobTitle', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="email">
                    {copy.emailLabel} <span className="text-[#c96a4b]">*</span>
                  </label>
                  <input id="email" type="email" className={field} required value={form.email} placeholder={copy.emailPlaceholder} onChange={(e) => set('email', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="phone">
                    {copy.phoneLabel}
                  </label>
                  <input id="phone" className={field} value={form.phone} placeholder={copy.phonePlaceholder} onChange={(e) => set('phone', e.target.value)} />
                </div>
              </div>
            </fieldset>
          </div>
        ) : null}

        {step === 2 ? (
          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-3 text-[14px] font-semibold text-[#0a088f]">{copy.hiringSectionTitle}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="roleTitle">
                  {copy.roleTitleLabel} <span className="text-[#c96a4b]">*</span>
                </label>
                <input id="roleTitle" className={field} required value={form.roleTitle} placeholder={copy.roleTitlePlaceholder} onChange={(e) => set('roleTitle', e.target.value)} />
              </div>
              <div>
                <label className={labelCls} htmlFor="openings">
                  {copy.openingsLabel}
                </label>
                <input id="openings" type="number" min={1} max={500} className={field} value={form.openings} placeholder={copy.openingsPlaceholder} onChange={(e) => set('openings', e.target.value)} />
              </div>
              <div>
                <label className={labelCls} htmlFor="roleCity">
                  {copy.roleCityLabel}
                </label>
                <input id="roleCity" className={field} value={form.roleCity} placeholder={copy.roleCityPlaceholder} onChange={(e) => set('roleCity', e.target.value)} />
              </div>
              <div>
                <label className={labelCls} htmlFor="employmentType">
                  {copy.employmentLabel}
                </label>
                <select id="employmentType" className={field} value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)}>
                  <option value="">Select</option>
                  {copy.employmentOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="timeline">
                  {copy.timelineLabel}
                </label>
                <select id="timeline" className={field} value={form.timeline} onChange={(e) => set('timeline', e.target.value)}>
                  <option value="">Select</option>
                  {copy.timelineOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="notes">
                  {copy.notesLabel}
                </label>
                <textarea id="notes" rows={4} className={field} value={form.notes} placeholder={copy.notesPlaceholder} onChange={(e) => set('notes', e.target.value)} />
              </div>
            </div>
          </fieldset>
        ) : null}

        {step === 3 ? (
          <div>
            <h3 className="m-0 text-[14px] font-semibold text-[#0a088f]">{copy.reviewSectionTitle}</h3>
            <dl className="m-0 mt-4 grid gap-3 text-[14px] sm:grid-cols-2">
              {[
                [copy.companyNameLabel, form.companyName],
                [copy.industryLabel, form.industry],
                [copy.countryLabel, form.country],
                [copy.cityLabel, form.city],
                [copy.fullNameLabel, form.fullName],
                [copy.emailLabel, form.email],
                [copy.phoneLabel, form.phone],
                [copy.roleTitleLabel, form.roleTitle],
                [copy.openingsLabel, form.openings],
                [copy.roleCityLabel, form.roleCity],
                [copy.employmentLabel, form.employmentType],
                [copy.timelineLabel, form.timeline],
              ]
                .filter(([, value]) => Boolean(value))
                .map(([label, value]) => (
                  <div key={label} className="rounded-[10px] border border-line bg-[#f7f8fa] px-3 py-2.5">
                    <dt className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt>
                    <dd className="m-0 mt-1 text-ink">{value}</dd>
                  </div>
                ))}
            </dl>
            {form.notes ? (
              <p className="m-0 mt-3 rounded-[10px] border border-line bg-[#f7f8fa] px-3 py-2.5 text-[14px] text-ink-2">
                <span className="font-semibold text-[#0a088f]">{copy.notesLabel}: </span>
                {form.notes}
              </p>
            ) : null}
            <div className="mt-5">
              <Turnstile key={challengeKey} onToken={setChallenge} />
            </div>
          </div>
        ) : null}

        {error ? <p className="m-0 mt-4 text-[14px] text-[#b42318]">{error}</p> : null}

        <div className="mt-6 flex flex-col gap-3">
          {step > 1 ? (
            <button type="button" className="rounded-full border border-line bg-white px-4 py-3 text-[14px] font-semibold text-[#0a088f]" onClick={() => setStep((s) => s - 1)}>
              {copy.backLabel}
            </button>
          ) : null}
          <button
            type="submit"
            disabled={
              busy ||
              (step === 1 && !step1Ready) ||
              (step === 2 && !step2Ready) ||
              (step === 3 && turnstileEnabled && !challenge)
            }
            className="btn-gradient t-colors inline-flex w-full cursor-pointer items-center justify-center gap-2 px-5 py-3.5 text-[15px] font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {step === 1 ? copy.continueToHiring : step === 2 ? copy.continueToReview : copy.submitLabel}
            <span aria-hidden>→</span>
          </button>
          {step === 1 ? (
            <Link
              href={copy.bookConsultationHref}
              className="t-colors inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#0a088f]/20 bg-white px-5 py-3 text-[14px] font-semibold text-[#0a088f] no-underline"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                <rect x="4" y="5" width="16" height="15" rx="2" />
                <path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" />
              </svg>
              {copy.bookConsultationLabel}
            </Link>
          ) : null}
        </div>

        <p className="m-0 mt-5 flex items-start gap-2 text-[12px] leading-[1.45] text-muted">
          <svg viewBox="0 0 24 24" className="mt-0.5 size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 018 0v3" strokeLinecap="round" />
          </svg>
          {copy.privacyNote}
        </p>
      </form>
    </div>
  );
}
