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
    <div className="flex w-full flex-col items-start gap-4">
      {state === 'done' ? (
        <p role="status" className="m-0 text-[15px] leading-[1.5] text-white">
          {labels.done}
        </p>
      ) : (
        <form onSubmit={submit} className="flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center">
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
            className="w-full border border-white/70 bg-transparent px-4 py-2 text-[14px] text-white placeholder:text-white/60 focus:border-white focus:outline-none sm:max-w-[240px]"
          />
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <button
            type="submit"
            disabled={state === 'sending'}
            className="t-colors inline-flex items-center rounded-full border border-[#c96a4b] bg-[#0a088f] px-6 py-2 text-[14px] font-bold uppercase tracking-[0.04em] text-white disabled:opacity-60 hover:bg-[#22209a]"
          >
            {labels.button}
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
