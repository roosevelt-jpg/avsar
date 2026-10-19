'use client';

import { useState } from 'react';
import { fill, type Dictionary } from '@/lib/i18n';

/**
 * The nudge to prove the address.
 *
 * It is a notice and not a wall, on purpose. Nothing in the application waits
 * for this: the candidate can finish the assessment, see their profile and
 * come back whenever. The report is the one thing held back, because the
 * report is delivered to this address, so the notice says what is actually at
 * stake rather than scolding.
 *
 * It disappears on its own: the dashboard only renders it while
 * `email_verified_at` is null.
 */
export function VerifyEmailBanner({ email, t }: { email: string; t: Dictionary }) {
  const d = t.dash;
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'limited' | 'failed'>('idle');

  async function resend() {
    setState('busy');
    try {
      const response = await fetch('/api/auth/resend-verification', { method: 'POST' });
      if (response.status === 429) return setState('limited');
      if (!response.ok) return setState('failed');
      setState('sent');
    } catch (error) {
      console.error('[verify] resend failed', error);
      setState('failed');
    }
  }

  return (
    <aside className="mb-8 rounded-[14px] border border-accent bg-accent-tint px-5 py-4">
      <p className="m-0 text-[15px] font-semibold">{d.verifyTitle}</p>
      <p className="mt-1.5 mb-0 text-[14px] leading-[1.6] text-ink-2">
        {fill(d.verifyBody, { email })}
      </p>

      {state === 'sent' ? (
        <p className="mt-3 mb-0 text-[14px] text-ink-2">{fill(d.verifySent, { email })}</p>
      ) : (
        <button
          type="button"
          onClick={resend}
          disabled={state === 'busy'}
          className="t-colors mt-3.5 cursor-pointer rounded-[10px] border-0 bg-ink px-4 py-2.5 text-[14px] font-medium text-paper hover:bg-ink-hover disabled:opacity-40"
        >
          {d.verifyCta}
        </button>
      )}

      {state === 'limited' && (
        <p className="mt-3 mb-0 text-[14px] text-accent-deep">{d.verifyRateLimited}</p>
      )}
      {state === 'failed' && (
        <p className="mt-3 mb-0 text-[14px] text-accent-deep">{d.verifyFailed}</p>
      )}
    </aside>
  );
}
