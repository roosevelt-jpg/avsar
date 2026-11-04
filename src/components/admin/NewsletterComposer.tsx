'use client';

import { useState, type FormEvent } from 'react';

/**
 * Staff compose a News & Insights letter and send it through Resend to every
 * active footer subscriber. The same edition appears on the public page.
 */
export function NewsletterComposer({ subscriberCount }: { subscriberCount: number }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const confirmed = window.confirm(
      subscriberCount === 0
        ? 'There are no active subscribers. Publish this edition on the site only?'
        : `Send this letter to ${subscriberCount} subscriber${subscriberCount === 1 ? '' : 's'} via Resend?`,
    );
    if (!confirmed) return;

    setBusy(true);
    setNote(null);
    setError(null);
    try {
      const response = await fetch('/api/admin/newsletters', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      const data = (await response.json().catch(() => null)) as {
        ok?: boolean;
        sent?: number;
        failed?: number;
        considered?: number;
        mailer?: string;
        error?: string;
      } | null;
      if (!response.ok || !data?.ok) {
        setError(data?.error === 'validation_failed' ? 'Title or body is too short.' : 'Send failed. Check Resend in Integrations.');
        return;
      }
      setTitle('');
      setBody('');
      setNote(
        `Published. Sent ${data.sent ?? 0} of ${data.considered ?? 0}` +
          (data.failed ? ` (${data.failed} failed)` : '') +
          (data.mailer ? ` via ${data.mailer}` : '') +
          '.',
      );
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mt-7 rounded-[16px] border border-line bg-surface p-5">
      <h2 className="m-0 text-[18px] font-semibold text-ink">Send a News & Insights letter</h2>
      <p className="mt-1.5 text-[14px] leading-[1.5] text-ink-2">
        Goes to every active footer subscriber through Resend, and appears on the public News & Insights page.
        {subscriberCount > 0 ? ` ${subscriberCount} subscribed now.` : ' No active subscribers yet — the edition still publishes on the site.'}
      </p>

      <label className="mt-4 block text-[13px] font-medium text-ink">
        Subject / title
        <input
          className="mt-1.5 w-full rounded-[10px] border border-line bg-white px-3 py-2 text-[14px]"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          required
          minLength={3}
          placeholder="Hiring demand in hospitality this spring"
        />
      </label>

      <label className="mt-3 block text-[13px] font-medium text-ink">
        Body
        <textarea
          className="mt-1.5 w-full rounded-[10px] border border-line bg-white px-3 py-2 text-[14px] leading-[1.5]"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={8}
          maxLength={8000}
          required
          minLength={20}
          placeholder="Plain text. Blank line between paragraphs. Be specific: salary bands, cities, what changed."
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="btn-gradient rounded-[10px] px-4 py-2 text-[13px] font-semibold disabled:opacity-50">
          {busy ? 'Sending…' : 'Publish and send'}
        </button>
        {note ? <p className="m-0 text-[13px] text-[#1f6b3a]">{note}</p> : null}
        {error ? <p className="m-0 text-[13px] text-[#9b2c2c]">{error}</p> : null}
      </div>
    </form>
  );
}
