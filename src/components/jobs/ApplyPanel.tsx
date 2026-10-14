'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DIAL_CODES } from '@/lib/data/dial-codes';
import type { ScreeningQuestion } from '@/lib/jobs/types';
import type { Locale } from '@/lib/i18n';

/**
 * Applying, in one place, with as little in the way as possible.
 *
 * Three cases:
 *  - signed-in candidate: answer the job's questions (if any) and press Apply.
 *  - visitor: one form that creates the account and applies in the same
 *    submit. No separate sign-up flow to finish first, no email to confirm
 *    before the application counts. Verification follows later, from the
 *    dashboard, for the things that genuinely need it.
 *  - staff or employer: told they cannot apply from a staff account.
 */

export type ApplyViewer =
  | { kind: 'anonymous' }
  | { kind: 'registered' }
  | { kind: 'staff' }
  | {
      kind: 'candidate';
      firstName: string;
      paid: boolean;
      existing: { reference: string; status: string; label: string } | null;
    };

type JobSummary = { id: string; slug: string; title: string; questions: ScreeningQuestion[]; open: boolean };

const INPUT = 'w-full rounded-[12px] border border-line bg-paper px-3.5 py-3 text-[16px] outline-none focus:border-ink';

export function ApplyPanel({
  locale,
  job,
  viewer,
  allowQuickApply,
  requirePaidAssessment,
  salary,
}: {
  locale: Locale;
  job: JobSummary;
  viewer: ApplyViewer;
  allowQuickApply: boolean;
  requirePaidAssessment: boolean;
  salary: string | null;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [account, setAccount] = useState({ fullName: '', email: '', country: 'IN', mobile: '', password: '' });
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ reference: string } | null>(null);

  const next = `/${locale}/jobs/${job.slug}`;
  const signInHref = `/${locale}/signin?next=${encodeURIComponent(next)}`;

  function missingRequired(): boolean {
    return job.questions.some((q) => q.required && !answers[q.id]?.trim());
  }

  async function apply(): Promise<boolean> {
    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jobId: job.id, coverNote: note.trim() || null, answers, source: 'job_page' }),
    });
    const data = (await response.json().catch(() => null)) as { reference?: string; error?: string } | null;
    if (response.ok && data?.reference) {
      setDone({ reference: data.reference });
      router.refresh();
      return true;
    }
    const messages: Record<string, string> = {
      job_not_open: 'This job has just closed. Have a look at similar jobs below.',
      payment_required: 'This employer asks for a completed assessment before applying. Finish it from your dashboard, then come back.',
      unauthorized: 'Please sign in again to apply.',
      no_candidate: 'Your account is not set up as a candidate. Please contact us.',
    };
    setError(messages[data?.error ?? ''] ?? 'Something went wrong. Please try again in a moment.');
    return false;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (missingRequired()) {
      setError('Please answer the required questions.');
      return;
    }

    setBusy(true);
    try {
      if (viewer.kind === 'anonymous') {
        if (!consent) {
          setError('Please accept the terms and privacy policy to continue.');
          return;
        }
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-avsar-locale': locale },
          body: JSON.stringify({
            fullName: account.fullName.trim(),
            email: account.email.trim(),
            country: account.country,
            mobile: account.mobile.replace(/[\s-]/g, ''),
            password: account.password,
            hasPassport: false,
          }),
        });
        const data = (await response.json().catch(() => null)) as { status?: string; issues?: Record<string, string[]> } | null;
        if (data?.status === 'account_exists') {
          setError('You already have an account with this email. Sign in to apply.');
          return;
        }
        if (data?.status === 'phone_taken') {
          setError('This mobile number is already registered to another account.');
          return;
        }
        if (data?.issues) {
          const field = Object.keys(data.issues)[0];
          const labels: Record<string, string> = {
            fullName: 'Please enter your full name.',
            email: 'Please check your email address.',
            mobile: 'Please check your mobile number.',
            password: 'Your password needs at least 8 characters.',
          };
          setError(labels[field ?? ''] ?? 'Please check your details.');
          return;
        }
        if (!response.ok || data?.status !== 'created') {
          setError(response.status === 503 ? 'Applications are not available on this demo deployment.' : 'We could not create your account. Please try again.');
          return;
        }
      }
      await apply();
    } finally {
      setBusy(false);
    }
  }

  const card = 'rounded-[24px] border border-line bg-surface p-6 shadow-[0_24px_60px_-36px_rgba(27,26,23,0.45)]';

  if (done || (viewer.kind === 'candidate' && viewer.existing)) {
    const reference = done?.reference ?? (viewer.kind === 'candidate' ? viewer.existing?.reference : '');
    return (
      <div className={card}>
        <span className="grid size-12 place-items-center rounded-full bg-success/15 text-success">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h2 className="m-0 mt-4 text-[22px] font-semibold tracking-[-0.02em]">{done ? 'Application sent' : 'You have applied'}</h2>
        <p className="m-0 mt-2 text-[15px] leading-[1.6] text-ink-2">
          {done
            ? 'We have your application. Follow every step from your dashboard; we will also email you when it moves.'
            : `Status: ${viewer.kind === 'candidate' ? viewer.existing?.label : ''}.`}
        </p>
        <p className="m-0 mt-3 font-mono text-[13px] text-muted">Reference {reference}</p>
        <Link href={`/${locale}/dashboard/applications`} className="mt-5 flex justify-center rounded-full bg-ink px-5 py-3 text-[15px] font-medium text-paper no-underline">
          Track my application
        </Link>
        {done && (
          <p className="m-0 mt-4 text-[14px] leading-[1.55] text-muted">
            Stand out: a completed skills assessment is shown to the employer with your application.{' '}
            <Link href={`/${locale}/assessment`} className="prose-link">Take it now</Link>.
          </p>
        )}
      </div>
    );
  }

  if (!job.open) {
    return (
      <div className={card}>
        <h2 className="m-0 text-[20px] font-semibold">Applications closed</h2>
        <p className="m-0 mt-2 text-[15px] text-ink-2">This job is no longer accepting applications.</p>
        <Link href={`/${locale}/jobs`} className="mt-5 flex justify-center rounded-full bg-ink px-5 py-3 text-[15px] text-paper no-underline">See open jobs</Link>
      </div>
    );
  }

  if (viewer.kind === 'staff') {
    return (
      <div className={card}>
        <h2 className="m-0 text-[20px] font-semibold">Signed in as staff</h2>
        <p className="m-0 mt-2 text-[15px] text-ink-2">Candidates apply from their own accounts. Manage this job in the console.</p>
        <Link href="/admin/jobs" className="mt-5 flex justify-center rounded-full bg-ink px-5 py-3 text-[15px] text-paper no-underline">Open the console</Link>
      </div>
    );
  }

  if (viewer.kind === 'registered') {
    return (
      <div className={card}>
        <h2 className="m-0 text-[20px] font-semibold">Finish your profile to apply</h2>
        <p className="m-0 mt-2 text-[15px] text-ink-2">Your account needs a candidate profile first. It takes a minute.</p>
        <Link href={`/${locale}/signup`} className="mt-5 flex justify-center rounded-full bg-accent px-5 py-3 text-[15px] text-white no-underline">Complete my profile</Link>
      </div>
    );
  }

  const anonymous = viewer.kind === 'anonymous';

  if (anonymous && !allowQuickApply) {
    return (
      <div className={card}>
        <h2 className="m-0 text-[22px] font-semibold tracking-[-0.02em]">Apply for this job</h2>
        <p className="m-0 mt-2 text-[15px] text-ink-2">Create a free profile or sign in to apply.</p>
        <Link href={`/${locale}/signup`} className="mt-5 flex justify-center rounded-full bg-accent px-5 py-3 text-[15px] font-medium text-white no-underline">Create my profile</Link>
        <Link href={signInHref} className="mt-3 flex justify-center rounded-full border border-line-strong px-5 py-3 text-[15px] text-ink no-underline">Sign in</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={card} noValidate>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-[22px] font-semibold tracking-[-0.02em]">
            {anonymous ? 'Apply in one minute' : `Apply, ${viewer.kind === 'candidate' ? viewer.firstName : ''}`}
          </h2>
          <p className="m-0 mt-1 text-[14px] text-muted">Free · no placement fee{salary ? ` · ${salary}` : ''}</p>
        </div>
      </div>

      {viewer.kind === 'candidate' && requirePaidAssessment && !viewer.paid && (
        <p className="m-0 mt-4 rounded-[12px] bg-accent-tint px-4 py-3 text-[14px] text-ink">
          A completed assessment is needed to apply. <Link href={`/${locale}/dashboard`} className="prose-link">Go to my dashboard</Link>
        </p>
      )}

      {anonymous && (
        <div className="mt-5 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-[14px] font-medium">
            Full name
            <input className={INPUT} autoComplete="name" value={account.fullName} onChange={(e) => setAccount({ ...account, fullName: e.target.value })} required />
          </label>
          <label className="flex flex-col gap-1.5 text-[14px] font-medium">
            Email
            <input className={INPUT} type="email" autoComplete="email" inputMode="email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} required />
          </label>
          <div className="flex flex-col gap-1.5 text-[14px] font-medium">
            <span>Mobile (WhatsApp)</span>
            <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
              <select aria-label="Country code" className={INPUT} value={account.country} onChange={(e) => setAccount({ ...account, country: e.target.value })}>
                {DIAL_CODES.map((code) => (
                  <option key={code.country} value={code.country}>
                    {code.country} +{code.dial}
                  </option>
                ))}
              </select>
              <input aria-label="Mobile number" className={INPUT} type="tel" autoComplete="tel-national" inputMode="tel" value={account.mobile} onChange={(e) => setAccount({ ...account, mobile: e.target.value })} required />
            </div>
          </div>
          <label className="flex flex-col gap-1.5 text-[14px] font-medium">
            Create a password
            <input className={INPUT} type="password" autoComplete="new-password" minLength={8} value={account.password} onChange={(e) => setAccount({ ...account, password: e.target.value })} required />
            <span className="text-[12px] font-normal text-muted">At least 8 characters. You will use it to track your application.</span>
          </label>
        </div>
      )}

      {job.questions.length > 0 && (
        <fieldset className="m-0 mt-5 flex flex-col gap-3 border-0 border-t border-line p-0 pt-5">
          <legend className="sr-only">Questions from the employer</legend>
          {job.questions.map((question) => (
            <div key={question.id} className="flex flex-col gap-1.5 text-[14px] font-medium">
              <span>
                {question.label}
                {question.required ? <span className="text-accent"> *</span> : null}
              </span>
              {question.type === 'yesno' ? (
                <div className="flex gap-2">
                  {['yes', 'no'].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAnswers({ ...answers, [question.id]: value })}
                      aria-pressed={answers[question.id] === value}
                      className={`t-colors flex-1 cursor-pointer rounded-[12px] border px-4 py-2.5 text-[15px] capitalize ${
                        answers[question.id] === value ? 'border-ink bg-ink text-paper' : 'border-line bg-paper text-ink'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              ) : question.type === 'select' ? (
                <select className={INPUT} value={answers[question.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}>
                  <option value="">Choose…</option>
                  {(question.options ?? []).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input className={INPUT} value={answers[question.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })} />
              )}
            </div>
          ))}
        </fieldset>
      )}

      <details className="mt-5 border-t border-line pt-4">
        <summary className="cursor-pointer text-[14px] text-ink-2">Add a short note to the employer (optional)</summary>
        <textarea className={`${INPUT} mt-3 min-h-[96px]`} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Your experience in one or two sentences" />
      </details>

      {anonymous && (
        <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-[13px] leading-[1.5] text-ink-2">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 accent-[oklch(0.56_0.14_40)]" />
          <span>
            I agree to the <Link href={`/${locale}/terms`} className="prose-link">terms</Link> and{' '}
            <Link href={`/${locale}/privacy`} className="prose-link">privacy policy</Link>, and to be contacted about this application by email and WhatsApp.
          </span>
        </label>
      )}

      {error && (
        <p role="alert" className="m-0 mt-4 rounded-[12px] bg-accent-tint px-4 py-3 text-[14px] text-ink">
          {error}{' '}
          {error.includes('Sign in') && <Link href={signInHref} className="prose-link">Sign in</Link>}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="t-colors mt-5 w-full cursor-pointer rounded-full border-0 bg-accent px-5 py-3.5 text-[16px] font-semibold text-white hover:bg-accent-deep disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? 'Sending…' : anonymous ? 'Create account and apply' : 'Apply now'}
      </button>

      {anonymous && (
        <p className="m-0 mt-4 text-center text-[14px] text-muted">
          Already registered? <Link href={signInHref} className="prose-link">Sign in</Link>
        </p>
      )}
    </form>
  );
}
