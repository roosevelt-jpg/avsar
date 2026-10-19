'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';

type State =
  | { step: 'loading' }
  | { step: 'none' }
  | { step: 'enrolling'; factorId: string; qr: string; secret: string }
  | { step: 'verify'; factorId: string }
  | { step: 'done'; factorId: string };

/**
 * Authenticator-app enrolment and step-up, through Supabase Auth's TOTP
 * factors. This runs in the browser because the auth session it upgrades
 * lives in the browser's cookies; the server only reads the resulting
 * assurance level.
 */
export function TwoFactorSetup({ enforced, returnTo }: { enforced: boolean; returnTo: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ step: 'loading' });
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    void (async () => {
      const [{ data: factors }, { data: level }] = await Promise.all([supabase.auth.mfa.listFactors(), supabase.auth.mfa.getAuthenticatorAssuranceLevel()]);
      const verified = factors?.totp.find((f) => f.status === 'verified');
      if (!verified) setState({ step: 'none' });
      else setState(level?.currentLevel === 'aal2' ? { step: 'done', factorId: verified.id } : { step: 'verify', factorId: verified.id });
    })();
  }, []);

  async function enroll() {
    const supabase = getBrowserSupabase();
    if (!supabase) return setError('This is a preview: there is no account to protect.');
    setBusy(true);
    setError(null);
    /* A half-finished enrolment from an earlier visit blocks a new one with the same name. */
    const { data: existing } = await supabase.auth.mfa.listFactors();
    for (const factor of existing?.all ?? []) {
      if (factor.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}` });
    setBusy(false);
    if (enrollError || !data) return setError('Could not start. Refresh the page and try again.');
    setState({ step: 'enrolling', factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function verify(factorId: string) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    setBusy(false);
    if (verifyError) return setError('That code did not match. Codes change every 30 seconds; check the phone clock is set automatically.');
    setCode('');
    setState({ step: 'done', factorId });
    router.refresh();
  }

  async function remove(factorId: string) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    if (enforced && !window.confirm('Two-factor sign-in is required here. Removing your app means setting up a new one before you can use the console again. Continue?')) return;
    const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId });
    if (removeError) return setError('Could not remove it. Enter a current code first, then try again.');
    setState({ step: 'none' });
    router.refresh();
  }

  const button = 'cursor-pointer rounded-full border-0 bg-ink px-4 py-2 text-[14px] text-paper disabled:opacity-40';
  const codeInput = (
    <input
      value={code}
      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
      inputMode="numeric"
      autoComplete="one-time-code"
      placeholder="123456"
      aria-label="Six-digit code"
      className="w-[140px] rounded-[12px] border border-line-strong bg-paper px-3.5 py-2.5 font-mono text-[18px] tracking-[0.2em]"
    />
  );

  return (
    <div className="rounded-[16px] border border-line bg-surface p-5 text-[15px]">
      {state.step === 'loading' && <p className="m-0 text-muted">Checking…</p>}

      {state.step === 'none' && (
        <>
          <p className="m-0">No authenticator app is set up for this account.</p>
          <button type="button" disabled={busy} onClick={() => void enroll()} className={`${button} mt-4`}>Set up an authenticator app</button>
        </>
      )}

      {state.step === 'enrolling' && (
        <>
          <p className="m-0">Scan this with your authenticator app, then enter the six-digit code it shows.</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- an inline SVG data URL from Supabase, not a remote image */}
          <img src={state.qr} alt="QR code for your authenticator app" width={180} height={180} className="mt-4 rounded-[8px] bg-white p-2" />
          <p className="mt-3 mb-0 text-[13px] text-muted">
            Cannot scan? Enter this key by hand: <span className="break-all font-mono text-ink">{state.secret}</span>
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {codeInput}
            <button type="button" disabled={busy || code.length !== 6} onClick={() => void verify(state.factorId)} className={button}>Confirm</button>
          </div>
        </>
      )}

      {state.step === 'verify' && (
        <>
          <p className="m-0">Enter the current code from your authenticator app.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {codeInput}
            <button type="button" disabled={busy || code.length !== 6} onClick={() => void verify(state.factorId)} className={button}>Continue</button>
          </div>
          <p className="mt-3 mb-0 text-[13px] text-muted">Lost your phone? Ask a super admin to reset your second factor in Supabase.</p>
        </>
      )}

      {state.step === 'done' && (
        <>
          <p className="m-0">Your authenticator app is set up and this session has passed it.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => router.push(returnTo)} className={button}>Continue to the console</button>
            <button type="button" onClick={() => void remove(state.factorId)} className="cursor-pointer rounded-full border border-line-strong bg-paper px-4 py-2 text-[14px]">Remove this app</button>
          </div>
        </>
      )}

      {error && <p role="alert" className="mt-3 mb-0 text-[14px] text-accent-deep">{error}</p>}
    </div>
  );
}
