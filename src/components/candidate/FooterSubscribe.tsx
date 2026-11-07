'use client';

import { useState, type FormEvent } from 'react';
import type { Locale } from '@/lib/i18n';

type Labels = { title: string; note: string; placeholder: string; button: string; done: string; error: string };

/**
 * Footer newsletter box. Labels arrive translated from the server. The hidden
 * "website" field is a bot trap: people never see it, scripts fill it in.
 * Layout matches the HTML-44 stacked input + button form.
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
    <div className="flex w-full flex-col items-stretch gap-2.5">
      {state === 'done' ? (
        <p role="status" className="m-0 text-[14px] leading-[1.5] text-white">
          {labels.done}
        </p>
      ) : (
        <form onSubmit={submit} className="flex w-full max-w-[320px] flex-col gap-2.5">
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
            className="w-full rounded-[6px] border border-white/25 bg-white/5 px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/45 focus:border-white/55 focus:outline-none"
          />
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <button
            type="submit"
            disabled={state === 'sending'}
            className="t-colors inline-flex h-10 items-center justify-center rounded-[6px] border-0 bg-[#b28a49] px-4 text-[14px] font-semibold text-[#142438] disabled:opacity-60 hover:bg-[#9a743c]"
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
