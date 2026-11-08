'use client';

import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Turnstile, TURNSTILE_HEADER, turnstileEnabled } from '@/components/security/Turnstile';
import { IDEMPOTENCY_HEADER, useIdempotencyKey } from '@/components/security/useIdempotencyKey';
import { readVisitorLeadPrefs, writeVisitorLeadPrefs, type VisitorLeadPrefs } from '@/lib/leads/visitor-popup';
import { localHref } from '@/lib/cms/settings';
import type { Locale } from '@/lib/i18n';

function subscribeNothing() {
  return () => undefined;
}

const field =
  't-colors w-full rounded-[8px] border border-[#142438]/18 bg-[#f7f8fa] px-3 py-2 text-[14px] text-[#142438] outline-none placeholder:text-[#142438]/40 focus:border-[var(--color-gold)] focus:bg-white';

/**
 * Compact first-visit modal. Kept short so it fits a laptop viewport; only
 * name plus email or phone are required. Dismiss/submit is remembered.
 */
export function VisitorLeadPopup({ locale }: { locale: Locale }) {
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState<'candidate' | 'employer'>('candidate');
  const [whatsappOk, setWhatsappOk] = useState(false);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [challengeKey, setChallengeKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const idempotency = useIdempotencyKey();

  useEffect(() => {
    if (!mounted) return;
    const prefs = readVisitorLeadPrefs();
    if (prefs.decided) return;
    const timer = window.setTimeout(() => {
      setReady(true);
      setOpen(true);
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [mounted]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      writeVisitorLeadPrefs({ decided: true, submitted: false });
      setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !ready || !open) return null;

  function remember(next: VisitorLeadPrefs) {
    writeVisitorLeadPrefs(next);
  }

  function dismiss(submitted: boolean) {
    remember({ decided: true, submitted });
    setOpen(false);
  }

  const reachable = email.trim() !== '' || phone.trim() !== '';
  const canSubmit = fullName.trim() !== '' && reachable && (!turnstileEnabled || challenge !== null) && !busy;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const body = JSON.stringify({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: '',
      topic,
      whatsappOk,
      note: '',
      locale,
    });
    try {
      const response = await fetch('/api/leads/visitor', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          [IDEMPOTENCY_HEADER]: idempotency.current(body),
          ...(challenge ? { [TURNSTILE_HEADER]: challenge } : {}),
        },
        body,
      });
      idempotency.settle(response);
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(
          data?.error === 'challenge_failed'
            ? 'Please complete the check below and try again.'
            : data?.error === 'validation_failed'
              ? 'Check your name and leave an email or phone number.'
              : 'That did not save. Please try again in a moment.',
        );
        setChallenge(null);
        setChallengeKey((key) => key + 1);
        return;
      }
      setDone(true);
      remember({ decided: true, submitted: true });
      window.setTimeout(() => setOpen(false), 1400);
    } catch {
      setError('That did not save. Please try again in a moment.');
      setChallenge(null);
      setChallengeKey((key) => key + 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        aria-label="Dismiss welcome form"
        className="absolute inset-0 cursor-pointer border-0 bg-[#142438]/45"
        onClick={() => dismiss(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="visitor-lead-title"
        className="relative z-[61] flex max-h-[min(520px,88dvh)] w-full max-w-[380px] flex-col overflow-hidden rounded-[14px] border border-[#142438]/12 bg-white text-[#142438] shadow-[0_20px_50px_rgba(20,36,56,0.3)]"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 bg-[#142438] px-4 py-3 text-white">
          <div className="min-w-0">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#b28a49]">Welcome</p>
            <h2 id="visitor-lead-title" className="m-0 mt-0.5 text-[18px] font-semibold tracking-[-0.02em]">
              Leave your details
            </h2>
          </div>
          <button
            type="button"
            onClick={() => dismiss(false)}
            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-[8px] border-0 bg-white/10 text-[18px] leading-none text-white hover:bg-white/16"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {done ? (
          <div className="px-4 py-6 text-center">
            <p className="m-0 text-[15px] font-semibold">Thank you — we have your details.</p>
            <p className="m-0 mt-1 text-[13px] text-[#5c7084]">A recruiter will follow up when they can.</p>
          </div>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
              <div className="grid grid-cols-2 gap-1 rounded-[8px] border border-[#142438]/12 bg-[#f7f8fa] p-0.5">
                <button
                  type="button"
                  className={`cursor-pointer rounded-[6px] border-0 px-2 py-1.5 text-[12px] font-semibold ${
                    topic === 'candidate' ? 'bg-white text-[#142438] shadow-sm' : 'bg-transparent text-[#5c7084]'
                  }`}
                  onClick={() => setTopic('candidate')}
                >
                  Looking for a job
                </button>
                <button
                  type="button"
                  className={`cursor-pointer rounded-[6px] border-0 px-2 py-1.5 text-[12px] font-semibold ${
                    topic === 'employer' ? 'bg-white text-[#142438] shadow-sm' : 'bg-transparent text-[#5c7084]'
                  }`}
                  onClick={() => setTopic('employer')}
                >
                  Hiring talent
                </button>
              </div>

              <label className="block text-[12px] font-medium text-[#3d4f63]">
                Full name
                <input className={`${field} mt-1`} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required />
              </label>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <label className="block text-[12px] font-medium text-[#3d4f63]">
                  Email
                  <input
                    type="email"
                    className={`${field} mt-1`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </label>
                <label className="block text-[12px] font-medium text-[#3d4f63]">
                  Phone
                  <input
                    className={`${field} mt-1`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="+91…"
                  />
                </label>
              </div>

              <label className="flex items-start gap-2 text-[12px] leading-[1.35] text-[#3d4f63]">
                <input
                  type="checkbox"
                  checked={whatsappOk}
                  onChange={(e) => setWhatsappOk(e.target.checked)}
                  className="mt-0.5 size-3.5 accent-[#b28a49]"
                  disabled={!phone.trim()}
                />
                <span>You may contact me on WhatsApp.</span>
              </label>

              <div className="scale-90 origin-top-left">
                <Turnstile key={challengeKey} onToken={setChallenge} />
              </div>

              {error ? <p className="m-0 text-[12px] text-[#b42318]">{error}</p> : null}
            </div>

            <div className="shrink-0 border-t border-[#142438]/08 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="cursor-pointer rounded-[8px] border-0 bg-[#b28a49] px-4 py-2 text-[13px] font-semibold text-[#142438] hover:bg-[#c49a58] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? 'Sending…' : 'Send my details'}
                </button>
                <button
                  type="button"
                  onClick={() => dismiss(false)}
                  className="cursor-pointer rounded-[8px] border-0 bg-transparent px-2 py-2 text-[13px] font-medium text-[#5c7084] hover:text-[#142438]"
                >
                  Maybe later
                </button>
              </div>
              <p className="m-0 mt-2 text-[11px] leading-[1.4] text-[#5c7084]">
                We store these details to reply.{' '}
                <Link href={localHref(locale, '/privacy')} className="font-semibold text-[#142438] underline-offset-2 hover:underline">
                  Privacy
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
