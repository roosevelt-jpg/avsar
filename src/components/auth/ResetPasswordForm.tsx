'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { localePath, type Locale } from '@/lib/i18n';

/**
 * Request a reset email, or set a new password after following the recovery link.
 */
export function ResetPasswordForm({
  locale,
  mode,
  next,
}: {
  locale: Locale;
  mode: 'request' | 'set';
  next?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const after =
    next && next.startsWith('/') && !next.startsWith('//') ? next : localePath(locale, '/dashboard');

  async function requestReset() {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), locale, next: after }),
      });
      if (response.status === 429) {
        setBusy(false);
        setError('Too many requests. Please wait a few minutes and try again.');
        return;
      }
    } catch {
      /* Same message either way: do not reveal whether mail left. */
    }
    setBusy(false);
    setSent(true);
  }

  async function savePassword() {
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Those passwords do not match.');
      return;
    }
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError('Something went wrong. Please try again.');
      return;
    }
    setBusy(true);
    setError('');
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setBusy(false);
      setError(updateError.message || 'Could not save that password. Try the reset link again.');
      return;
    }
    router.refresh();
    router.push(after);
  }

  if (mode === 'set') {
    return (
      <div className="mx-auto w-full max-w-[440px]">
        <h1 className="m-0 text-[clamp(28px,4cqi,40px)] font-semibold leading-[1.1] tracking-[-0.03em]">
          Choose a new password
        </h1>
        <p className="mt-3 mb-7 text-[16px] leading-[1.6] text-ink-2">
          Pick a password at least 8 characters long. You will be signed in after you save.
        </p>
        <label className="block">
          <span className="mb-2 block text-[15px] font-medium">New password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="t-colors w-full rounded-[12px] border border-line-strong bg-surface px-3.5 py-3 text-[16px] outline-none focus:border-ink"
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-2 block text-[15px] font-medium">Confirm password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && savePassword()}
            className="t-colors w-full rounded-[12px] border border-line-strong bg-surface px-3.5 py-3 text-[16px] outline-none focus:border-ink"
          />
        </label>
        <button
          type="button"
          onClick={savePassword}
          disabled={busy || !password || !confirm}
          className="t-colors mt-6 w-full cursor-pointer rounded-[12px] border-0 bg-[#0a088f] px-5 py-3 text-[15px] font-medium text-white hover:bg-[#22209a] disabled:cursor-not-allowed disabled:bg-[#0a088f] disabled:text-white disabled:opacity-100"
        >
          Save password
        </button>
        {error ? <p className="mt-4 mb-0 text-[14px] text-accent-deep">{error}</p> : null}
      </div>
    );
  }

  if (sent) {
    return (
      <div className="mx-auto w-full max-w-[440px]">
        <h1 className="m-0 text-[clamp(28px,4cqi,40px)] font-semibold leading-[1.1] tracking-[-0.03em]">
          Check your email
        </h1>
        <p className="mt-3 mb-7 text-[16px] leading-[1.6] text-ink-2">
          If that address has an account, we sent a link to choose a new password. It expires in about an hour.
        </p>
        <Link href={localePath(locale, '/signin')} className="prose-link text-[15px]">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[440px]">
      <h1 className="m-0 text-[clamp(28px,4cqi,40px)] font-semibold leading-[1.1] tracking-[-0.03em]">
        Reset your password
      </h1>
      <p className="mt-3 mb-7 text-[16px] leading-[1.6] text-ink-2">
        Enter the email on your account. We will send a link to choose a new password.
      </p>
      <label className="block">
        <span className="mb-2 block text-[15px] font-medium">Email</span>
        <input
          type="email"
          autoComplete="username"
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && requestReset()}
          className="t-colors w-full rounded-[12px] border border-line-strong bg-surface px-3.5 py-3 text-[16px] outline-none focus:border-ink"
        />
      </label>
      <button
        type="button"
        onClick={requestReset}
        disabled={busy || !email}
        className="t-colors mt-6 w-full cursor-pointer rounded-[12px] border-0 bg-[#0a088f] px-5 py-3 text-[15px] font-medium text-white hover:bg-[#22209a] disabled:cursor-not-allowed disabled:bg-[#0a088f] disabled:text-white disabled:opacity-100"
      >
        Send reset link
      </button>
      {error ? <p className="mt-4 mb-0 text-[14px] text-accent-deep">{error}</p> : null}
      <p className="mt-8 mb-0 border-t border-line pt-6 text-[14px] text-muted">
        <Link href={localePath(locale, '/signin')} className="prose-link">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
