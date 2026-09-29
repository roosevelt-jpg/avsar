'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';

/**
 * Staff sign-in: email and password.
 *
 * Different from the candidate flow on purpose. Staff are a small known set
 * using their own devices, and a password manager handles this better than a
 * code round trip. Having an account is not enough to get in: `requireStaff`
 * checks for a row in `staff_users`, and RLS enforces the same.
 */
export function StaffSignInForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError('Supabase is not configured in this environment.');
      return;
    }

    setBusy(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setBusy(false);
      /* Deliberately one message for both a wrong password and an unknown
         address, so this page cannot be used to enumerate accounts. */
      setError('Those details are not right.');
      return;
    }

    router.refresh();
    router.push(next);
  }

  return (
    <div className="mx-auto w-full max-w-[400px]">
      <h1 className="m-0 text-[clamp(26px,3.4cqi,38px)] font-semibold leading-[1.1] tracking-[-0.03em]">
        Staff sign-in
      </h1>
      <p className="mt-3 mb-7 text-[15px] leading-[1.6] text-ink-2">
        Reviewer access to the talent pool and CV assessments.
      </p>

      <label className="block">
        <span className="mb-2 block text-[15px] font-medium">Email</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          autoComplete="username"
          autoFocus
          className="t-colors w-full rounded-[12px] border border-line-strong bg-surface px-3.5 py-3 text-[16px] outline-none focus:border-employer"
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-2 block text-[15px] font-medium">Password</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && submit()}
          type="password"
          autoComplete="current-password"
          className="t-colors w-full rounded-[12px] border border-line-strong bg-surface px-3.5 py-3 text-[16px] outline-none focus:border-employer"
        />
      </label>

      <button
        type="button"
        onClick={submit}
        disabled={busy || !email || !password}
        className="t-colors mt-6 w-full cursor-pointer rounded-[12px] border-0 bg-employer px-5 py-3 text-[15px] font-medium text-white hover:bg-employer-deep disabled:opacity-40"
      >
        Sign in
      </button>

      {error && <p className="mt-4 mb-0 text-[14px] text-accent-deep">{error}</p>}
    </div>
  );
}
