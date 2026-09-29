'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Mono } from '@/components/ui/Mono';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { fill, type Dictionary, type Locale } from '@/lib/i18n';

/**
 * Candidate sign-in by one-time code to the registered email address.
 *
 * Email rather than SMS for now, deliberately. The right channel for this
 * audience is WhatsApp or SMS on the mobile number they registered, which also
 * verifies it, but sending SMS to Indian numbers needs DLT registration with
 * TRAI and a contracted provider. Email works today with nothing configured;
 * `docs/auth.md` has what changes when the provider is in place.
 *
 * `shouldCreateUser: false` matters: an address that never registered and paid
 * must not be able to conjure an account by asking for a code.
 */
export function SignInForm({
  locale,
  t,
  next,
}: {
  locale: Locale;
  t: Dictionary;
  next: string;
}) {
  const router = useRouter();
  const a = t.auth;

  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function sendCode() {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError(a.errEmail);
      return;
    }
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError(a.errGeneric);
      return;
    }

    setBusy(true);
    setError('');
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
    setBusy(false);

    /* The message is the same whether the address exists or not: a different
       response here would turn sign-in into a way to test who has registered. */
    if (sendError) console.error('[signin] otp send failed', sendError);
    setStage('code');
  }

  async function verify() {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError(a.errGeneric);
      return;
    }

    setBusy(true);
    setError('');
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });

    if (verifyError) {
      setBusy(false);
      setError(a.errCode);
      return;
    }

    /* refresh() so the Server Components re-run with the new session cookie
       before the redirect lands. */
    router.refresh();
    router.push(next);
  }

  return (
    <div className="mx-auto w-full max-w-[440px]">
      <h1 className="m-0 text-[clamp(28px,4cqi,44px)] font-semibold leading-[1.1] tracking-[-0.03em]">
        {a.title}
      </h1>

      {stage === 'email' ? (
        <>
          <p className="mt-3 mb-7 text-[16px] leading-[1.6] text-ink-2">{a.lead}</p>

          <label className="block">
            <span className="mb-2 block text-[15px] font-medium">{a.emailLabel}</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && sendCode()}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              className="t-colors w-full rounded-[12px] border border-line-strong bg-surface px-3.5 py-3 text-[16px] outline-none focus:border-ink"
            />
          </label>

          <button
            type="button"
            onClick={sendCode}
            disabled={busy}
            className="t-colors mt-5 w-full cursor-pointer rounded-[12px] border-0 bg-ink px-5 py-3 text-[15px] font-medium text-white hover:bg-accent disabled:opacity-50"
          >
            {a.sendCode}
          </button>
        </>
      ) : (
        <>
          <p className="mt-3 mb-7 text-[16px] leading-[1.6] text-ink-2">
            {fill(a.codeSent, { email: email.trim() })}
          </p>

          <label className="block">
            <span className="mb-2 block text-[15px] font-medium">{a.codeLabel}</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
              onKeyDown={(event) => event.key === 'Enter' && verify()}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              className="t-colors w-full rounded-[12px] border border-line-strong bg-surface px-3.5 py-3 font-mono text-[22px] tracking-[0.3em] outline-none focus:border-ink"
            />
          </label>

          <button
            type="button"
            onClick={verify}
            disabled={busy || code.length !== 6}
            className="t-colors mt-5 w-full cursor-pointer rounded-[12px] border-0 bg-ink px-5 py-3 text-[15px] font-medium text-white hover:bg-accent disabled:opacity-40"
          >
            {a.verify}
          </button>

          <button
            type="button"
            onClick={() => {
              setStage('email');
              setCode('');
              setError('');
            }}
            className="t-colors mt-3 w-full cursor-pointer border-0 bg-transparent py-2 text-[14px] text-muted hover:text-ink"
          >
            {a.resend}
          </button>
        </>
      )}

      {error && <p className="mt-4 mb-0 text-[14px] text-accent-deep">{error}</p>}

      <p className="mt-8 mb-0 border-t border-line pt-6 text-[14px] leading-[1.6] text-muted">
        {a.notRegistered}{' '}
        <Link href={`/${locale}/signup`} className="prose-link">
          {a.registerCta}
        </Link>
      </p>

      <Mono className="mt-5 block leading-[1.6] text-muted">{a.phoneSoon}</Mono>
    </div>
  );
}
