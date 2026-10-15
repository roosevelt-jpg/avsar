'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LEAD_STATUS_LABELS, LEAD_STATUSES, type LeadStatus } from '@/lib/leads/types';

type Channel = 'email' | 'whatsapp' | 'note';

const ERRORS: Record<string, string> = {
  demo_mode: 'Demo mode: nothing is sent or saved.',
  no_email: 'There is no email address on this lead.',
  no_whatsapp_consent: 'This person has not said WhatsApp is fine.',
  whatsapp_unconfigured: 'WhatsApp is not connected on this deployment.',
  send_failed: 'The message could not be sent. Nothing was recorded; try again.',
  forbidden: 'Your role cannot answer the inbox.',
};

/**
 * Answer, note, move, take. The reply box says which channel it will use and
 * only offers the ones this person can be reached on with their consent.
 */
export function LeadActions({
  leadId,
  status,
  canEmail,
  canWhatsApp,
  whatsAppConfigured,
  assignedToMe,
}: {
  leadId: string;
  status: LeadStatus;
  canEmail: boolean;
  canWhatsApp: boolean;
  whatsAppConfigured: boolean;
  assignedToMe: boolean;
}) {
  const router = useRouter();
  const channels: { value: Channel; label: string }[] = [
    ...(canEmail ? [{ value: 'email' as const, label: 'Email' }] : []),
    ...(canWhatsApp && whatsAppConfigured ? [{ value: 'whatsapp' as const, label: 'WhatsApp' }] : []),
    { value: 'note', label: 'Internal note' },
  ];
  const [channel, setChannel] = useState<Channel>(channels[0]!.value);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function call(url: string, method: 'POST' | 'PATCH', payload: unknown, done: string) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (response.ok) {
        setMessage({ ok: true, text: done });
        router.refresh();
        return true;
      }
      setMessage({ ok: false, text: ERRORS[data?.error ?? ''] ?? 'That did not work. Try again.' });
      return false;
    } catch {
      setMessage({ ok: false, text: 'The connection dropped. Check the history before sending again.' });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const ok = await call(`/api/admin/leads/${leadId}/events`, 'POST', { kind: channel, body }, channel === 'note' ? 'Note saved.' : 'Sent.');
    if (ok) setBody('');
  }

  return (
    <section className="rounded-[16px] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        {channels.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setChannel(c.value)}
            aria-pressed={channel === c.value}
            className={`cursor-pointer rounded-full border px-3 py-1 text-[13px] ${channel === c.value ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink-2'}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <label className="mt-3 block">
        <span className="sr-only">Message</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          maxLength={channel === 'whatsapp' ? 300 : 4000}
          placeholder={
            channel === 'note'
              ? 'Only staff see this.'
              : channel === 'whatsapp'
                ? 'One line, sent inside the approved follow-up template after "Hello <first name>".'
                : 'Written as you would to the person. "Hello <first name>," is added for you.'
          }
          className="w-full rounded-[12px] border border-line-strong bg-paper px-3.5 py-3 text-[15px] outline-none focus:border-ink"
        />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy || body.trim() === ''}
          onClick={() => void send()}
          className="cursor-pointer rounded-full border-0 bg-ink px-4 py-2 text-[14px] text-paper disabled:opacity-40"
        >
          {channel === 'note' ? 'Save note' : channel === 'email' ? 'Send email' : 'Send WhatsApp'}
        </button>
        <span className="ms-auto flex flex-wrap items-center gap-2">
          <label className="text-[13px] text-muted">
            Status{' '}
            <select
              value={status}
              disabled={busy}
              onChange={(e) => void call(`/api/admin/leads/${leadId}`, 'PATCH', { status: e.target.value }, 'Status changed.')}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] text-ink"
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => void call(`/api/admin/leads/${leadId}`, 'PATCH', { assign: assignedToMe ? 'nobody' : 'me' }, assignedToMe ? 'Released.' : 'Assigned to you.')}
            className="cursor-pointer rounded-full border border-line-strong bg-surface px-3 py-1.5 text-[13px]"
          >
            {assignedToMe ? 'Release' : 'Take it'}
          </button>
        </span>
      </div>
      {message && (
        <p role="status" className={`mt-3 mb-0 text-[14px] ${message.ok ? 'text-ink-2' : 'text-accent-deep'}`}>{message.text}</p>
      )}
    </section>
  );
}
