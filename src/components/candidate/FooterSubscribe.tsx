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
    <div className="flex w-full max-w-[420px] flex-col items-end gap-3 text-end">
      <p className="m-0 text-[15px] font-semibold text-[#f4f8fb]">{labels.title}</p>
      {state === 'done' ? (
        <p role="status" className="m-0 text-[14px] text-[#f4f8fb]">
          {labels.done}
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col items-end gap-2 sm:flex-row">
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
            className="w-full max-w-[220px] rounded-full border border-[#2a4a66] bg-white/10 px-4 py-2.5 text-[14px] text-[#f4f8fb] placeholder:text-[#b7c9d8] focus:border-[#c96a4b] focus:outline-none"
          />
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <button
            type="submit"
            disabled={state === 'sending'}
            className="t-colors rounded-[14px] bg-[#f4f8fb] px-6 py-3 text-[14px] font-semibold text-[#16324f] disabled:opacity-60"
          >
            {labels.button}
          </button>
        </form>
      )}
      {state === 'error' ? (
        <p role="alert" className="m-0 text-[12.5px] text-[#f4f8fb]">
          {labels.error}
        </p>
      ) : null}
      <p className="m-0 text-[12.5px] leading-[1.6] text-[#b7c9d8]">{labels.note}</p>
    </div>
  );
}
