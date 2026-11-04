'use client';

import { useState, type FormEvent } from 'react';
import type { Locale } from '@/lib/i18n';

type Labels = { title: string; note: string; placeholder: string; button: string; done: string; error: string };

/**
 * The footer's email box. Labels arrive translated from the server footer, so
 * this component only handles typing and sending. The hidden "website" field
 * is a bot trap: people never see it, scripts fill it in.
 */
export function FooterSubscribe({ locale, labels }: { locale: Locale; labels: Labels }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState('sending');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: String(form.get('email') ?? ''), locale, website: String(form.get('website') ?? '') }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  return (
    <div className="flex w-full flex-col items-start gap-3">
      {state === 'done' ? (
        <p role="status" className="m-0 text-[15px] leading-[1.5] text-white">
          {labels.done}
        </p>
      ) : (
        <form onSubmit={submit} className="flex w-full max-w-[360px] items-stretch gap-0">
          <label className="sr-only" htmlFor="footer-subscribe-email">
            {labels.placeholder}
          </label>
          <input
            id="footer-subscribe-email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            inputMode="email"
            dir="ltr"
            placeholder={labels.placeholder}
            className="min-w-0 flex-1 rounded-s-[8px] border border-white/55 border-e-0 bg-[#142438]/55 px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/55 focus:border-[var(--color-gold)] focus:outline-none"
          />
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <button
            type="submit"
            disabled={state === 'sending'}
            aria-label={labels.button}
            className="t-colors grid size-[46px] shrink-0 place-items-center rounded-e-[8px] border-0 bg-[#b28a49] text-[#142438] disabled:opacity-60 hover:bg-[#9a743c]"
          >
            <span aria-hidden className="text-[18px] font-bold leading-none rtl:-scale-x-100">
              →
            </span>
          </button>
        </form>
      )}
      {state === 'error' ? (
        <p role="alert" className="m-0 text-[13px] text-white">
          {labels.error}
        </p>
      ) : null}
    </div>
  );
}
