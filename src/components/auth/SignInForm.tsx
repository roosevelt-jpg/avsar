'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Mono } from '@/components/ui/Mono';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { fill, type Dictionary, type Locale, localePath } from '@/lib/i18n';

/**
 * Sign-in form used by the shared `/signin` page and by audience-specific
 * routes such as `/applicant/signin`.
 *
 * Both mechanisms live on the same form rather than the page asking for an
 * email first and then choosing. Choosing would mean the page revealing whether
 * an address belongs to staff before anyone has proved who they are, which
 * turns sign-in into a directory of who works here.
 *
 * Candidates often use a code, because they registered once and come back
 * weeks later; they also have a password from registration. Employers and
 * staff use a password.
 *
 * Where each one lands is decided server side by `/auth/route`, from the
 * session, never from anything this form sends.
 */
export function SignInForm({
  locale,
  t,
  next,
  note,
}: {
  locale: Locale;
  t: Dictionary;
  next?: string;
  /** Overrides the shared staff/employer note on dedicated audience pages. */
  note?: string;
}) {
  const router = useRouter();
  const a = t.auth;

  const [mode, setMode] = useState<'password' | 'code'>('password');
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const destination = next ? `/auth/route?next=${encodeURIComponent(next)}` : '/auth/route';

  function fail(message: string) {
    setBusy(false);
    setError(message);
  }

  async function signInWithPassword() {
    const supabase = getBrowserSupabase();
    if (!supabase) return fail(a.errGeneric);

    setBusy(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    /* One message for a wrong password and for an unknown address alike, so
       this cannot be used to enumerate accounts. */
    if (signInError) return fail(a.errCredentials);

    router.refresh();
    router.push(destination);
  }

  async function sendCode() {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError(a.errEmail);

    setBusy(true);
    setError('');

    /* Sent server side. Whether an address may receive a code depends on
       whether it belongs to a registered candidate, which needs the service
       role to answer, and the answer must not reach the browser. */
    try {
      const response = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), next, locale }),
      });

      if (response.status === 429) {
        /* Say so rather than claiming a code is on its way. Otherwise they
           wait, try again, and burn the next allowance too. */
        return fail(a.errRateLimited);
      }
    } catch (sendError) {
      console.error('[signin] request-code failed', sendError);
    }

    setBusy(false);
    setSent(true);
  }

  async function verifyCode() {
    const supabase = getBrowserSupabase();
    if (!supabase) return fail(a.errGeneric);

    setBusy(true);
    setError('');
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });

    if (verifyError) return fail(a.errCode);

    router.refresh();
    router.push(destination);
  }

  return (
    <div className="mx-auto w-full max-w-[440px]">
      <h1 className="m-0 text-[clamp(28px,4cqi,44px)] font-semibold leading-[1.1] tracking-[-0.03em]">
        {a.title}
      </h1>

      {sent ? (
        <>
          <p className="mt-3 mb-7 text-[16px] leading-[1.6] text-ink-2">
            {fill(a.codeSent, { email: email.trim() })}
          </p>

          <label className="block">
            <span className="mb-2 block text-[15px] font-medium">{a.codeLabel}</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
              onKeyDown={(event) => event.key === 'Enter' && verifyCode()}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              className="t-colors w-full rounded-[12px] border border-line-strong bg-surface px-3.5 py-3 font-mono text-[22px] tracking-[0.3em] outline-none focus:border-ink"
            />
          </label>

          <button
            type="button"
            onClick={verifyCode}
            disabled={busy || code.length !== 6}
            className="t-colors mt-5 w-full cursor-pointer rounded-[12px] border-0 bg-ink px-5 py-3 text-[15px] font-medium text-paper hover:bg-ink-hover disabled:opacity-40"
          >
            {a.verify}
          </button>

          <button
            type="button"
            onClick={() => {
              setSent(false);
              setCode('');
              setError('');
            }}
            className="t-colors mt-3 w-full cursor-pointer border-0 bg-transparent py-2 text-[14px] text-muted hover:text-ink"
          >
            {a.resend}
          </button>
        </>
      ) : (
        <>
          <p className="mt-3 mb-7 text-[16px] leading-[1.6] text-ink-2">{note ?? a.staffNote}</p>

          <label className="block">
            <span className="mb-2 block text-[15px] font-medium">{a.emailLabel}</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) =>
                event.key === 'Enter' && (mode === 'password' ? signInWithPassword() : sendCode())
              }
              type="email"
              inputMode="email"
              autoComplete="username"
              autoFocus
              className="t-colors w-full rounded-[12px] border border-line-strong bg-surface px-3.5 py-3 text-[16px] outline-none focus:border-ink"
            />
          </label>

          {mode === 'password' && (
            <label className="mt-4 block">
              <span className="mb-2 block text-[15px] font-medium">{a.passwordLabel}</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && signInWithPassword()}
                type="password"
                autoComplete="current-password"
                className="t-colors w-full rounded-[12px] border border-line-strong bg-surface px-3.5 py-3 text-[16px] outline-none focus:border-ink"
              />
            </label>
          )}

          <button
            type="button"
            onClick={mode === 'password' ? signInWithPassword : sendCode}
            disabled={busy || !email || (mode === 'password' && !password)}
            className="t-colors mt-6 w-full cursor-pointer rounded-[12px] border-0 bg-ink px-5 py-3 text-[15px] font-medium text-paper hover:bg-ink-hover disabled:opacity-40"
          >
            {mode === 'password' ? a.signInWithPassword : a.sendCode}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'password' ? 'code' : 'password');
              setError('');
            }}
            className="t-colors mt-3 w-full cursor-pointer border-0 bg-transparent py-2 text-[14px] text-muted hover:text-ink"
          >
            {mode === 'password' ? a.useCodeInstead : a.usePasswordInstead}
          </button>
        </>
      )}

      {error && <p className="mt-4 mb-0 text-[14px] text-accent-deep">{error}</p>}

      <p className="mt-8 mb-0 border-t border-line pt-6 text-[14px] leading-[1.6] text-muted">
        {a.notRegistered}{' '}
        <Link href={localePath(locale, '/signup')} className="prose-link">
          {a.registerCta}
        </Link>
      </p>

      <Mono className="mt-5 block leading-[1.6] text-muted">{a.phoneSoon}</Mono>
    </div>
  );
}
