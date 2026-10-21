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
    <div className="flex flex-col gap-3">
      <p className="m-0 text-[15px] font-semibold text-ink">{labels.title}</p>
      {state === 'done' ? (
        <p role="status" className="m-0 text-[14px] text-ink">
          {labels.done}
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
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
            className="min-w-0 flex-1 rounded-full border border-line bg-white px-5 py-3 text-[14px] text-ink placeholder:text-muted focus:border-[#0c7c68] focus:outline-none"
          />
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <button
            type="submit"
            disabled={state === 'sending'}
            className="t-colors rounded-full bg-[#0c7c68] px-6 py-3 text-[14px] font-semibold text-white hover:bg-[#0a6858] disabled:opacity-60"
          >
            {labels.button}
          </button>
        </form>
      )}
      {state === 'error' ? (
        <p role="alert" className="m-0 text-[12.5px] text-ink">
          {labels.error}
        </p>
      ) : null}
      <p className="m-0 text-[12.5px] leading-[1.6] text-muted">{labels.note}</p>
    </div>
  );
}
