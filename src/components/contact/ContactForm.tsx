'use client';

import { useState } from 'react';
import { Turnstile, TURNSTILE_HEADER, turnstileEnabled } from '@/components/security/Turnstile';
import { IDEMPOTENCY_HEADER, useIdempotencyKey } from '@/components/security/useIdempotencyKey';

const field =
  't-colors w-full rounded-[12px] border border-line-strong bg-paper px-3.5 py-3 text-[16px] outline-none focus:border-ink';

type Topic = 'candidate' | 'employer' | 'scam_report' | 'other';

const TOPICS: { value: Topic; label: string }[] = [
  { value: 'candidate', label: 'A question about a job or my application' },
  { value: 'scam_report', label: 'Someone asked me for money' },
  { value: 'employer', label: 'I want to hire people' },
  { value: 'other', label: 'Something else' },
];

/**
 * One form for writing to us. The employers page uses the same form with the
 * questions a recruiter needs before a first call (company, role, how many,
 * where), so an enquiry arrives answerable rather than as "please call me".
 *
 * A fee report may be anonymous: the name can be anything and no way back is
 * required, because the point is to hear about it, not to identify who said it.
 */
export function ContactForm({ variant = 'general', locale }: { variant?: 'general' | 'employer'; locale?: string }) {
  const employer = variant === 'employer';
  const [topic, setTopic] = useState<Topic>(employer ? 'employer' : 'candidate');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappOk, setWhatsappOk] = useState(false);
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [city, setCity] = useState('');
  const [openings, setOpenings] = useState('');
  const [message, setMessage] = useState('');
  const [challenge, setChallenge] = useState<string | null>(null);
  const [challengeKey, setChallengeKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const idempotency = useIdempotencyKey();

  const anonymousAllowed = topic === 'scam_report';
  const reachable = email.trim() !== '' || phone.trim() !== '';
  const ready =
    fullName.trim() !== '' &&
    message.trim() !== '' &&
    (reachable || anonymousAllowed) &&
    (!employer || company.trim() !== '') &&
    (!turnstileEnabled || challenge !== null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    const body = JSON.stringify({
      fullName,
      email,
      phone,
      whatsappOk,
      topic,
      message,
      company: employer ? company : '',
      position: employer ? position : '',
      city: employer ? city : '',
      openings: employer && Number.parseInt(openings, 10) > 0 ? Number.parseInt(openings, 10) : null,
      source: employer ? 'employers_page' : 'contact_form',
      locale,
    });
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          [IDEMPOTENCY_HEADER]: idempotency.current(body),
          ...(challenge ? { [TURNSTILE_HEADER]: challenge } : {}),
        },
        body,
      });
      idempotency.settle(response);
      const data = (await response.json().catch(() => null)) as { error?: string; issues?: Record<string, string[]> } | null;

      if (response.ok) {
        setStatus({
          ok: true,
          text: employer
            ? 'Thank you. A recruiter will reply within two working days, usually with a call to go through the roles.'
            : topic === 'scam_report'
              ? 'Thank you for telling us. We look into every report. You do not need to do anything else.'
              : 'Thank you. We answer within two working days.',
        });
        setMessage('');
        return;
      }

      setChallenge(null);
      setChallengeKey((k) => k + 1);
      const issues = data?.issues ?? {};
      setStatus({
        ok: false,
        text:
          data?.error === 'demo_mode'
            ? 'This is a preview: nothing is saved until the platform is connected to its database.'
            : data?.error === 'rate_limited'
              ? 'Too many messages from this connection. Please wait a few minutes and try again.'
              : data?.error === 'challenge_failed'
                ? 'The "are you a person" check did not pass. Please try again.'
                : issues.phone
                  ? 'That phone number could not be read. Include the country code, for example +91 98123 45678.'
                  : issues.email
                    ? 'Please leave an email address or a phone number so we can answer you.'
                    : 'The message could not be sent. Please try again in a moment.',
      });
    } catch {
      setStatus({ ok: false, text: 'The connection dropped. Press Send again: your message will not be sent twice.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="not-prose mt-6 grid max-w-[640px] gap-4" noValidate>
      {!employer && (
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium">What is it about?</span>
          <select value={topic} onChange={(e) => setTopic(e.target.value as Topic)} className={field}>
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
      )}

      {employer && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[14px] font-medium">Company</span>
            <input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={160} autoComplete="organization" className={field} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-medium">Role you need</span>
            <input value={position} onChange={(e) => setPosition(e.target.value)} maxLength={120} placeholder="Line cook" className={field} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-medium">How many people</span>
            <input value={openings} onChange={(e) => setOpenings(e.target.value)} inputMode="numeric" className={field} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[14px] font-medium">Where in Portugal</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} maxLength={120} placeholder="Albufeira" className={field} />
          </label>
        </div>
      )}

      <label className="block">
        <span className="mb-1.5 block text-[14px] font-medium">{anonymousAllowed ? 'Your name (any name is fine)' : 'Your name'}</span>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} autoComplete="name" className={field} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} autoComplete="email" className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium">Phone, with country code</span>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={32} placeholder="+91 98123 45678" autoComplete="tel" className={field} />
        </label>
      </div>
      <p className="m-0 -mt-2 text-[13px] text-muted">
        {anonymousAllowed ? 'Optional. Leave both empty to report without being contacted.' : 'One of the two, so we can answer you.'}
      </p>

      {phone.trim() !== '' && (
        <label className="flex items-start gap-2.5">
          <input type="checkbox" checked={whatsappOk} onChange={(e) => setWhatsappOk(e.target.checked)} className="mt-1 size-4" />
          <span className="text-[14px] leading-[1.5]">You may answer me on WhatsApp at this number.</span>
        </label>
      )}

      <label className="block">
        <span className="mb-1.5 block text-[14px] font-medium">
          {topic === 'scam_report' ? 'What happened? Who asked, how much, and where (WhatsApp, Facebook, in person)?' : 'Your message'}
        </span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={4000} rows={6} className={field} />
      </label>

      <Turnstile key={challengeKey} onToken={setChallenge} />

      <div>
        <button
          type="submit"
          disabled={busy || !ready}
          className="t-colors cursor-pointer rounded-[12px] border-0 bg-ink px-5 py-3 text-[15px] font-medium text-paper hover:bg-accent disabled:opacity-40"
        >
          {busy ? 'Sending…' : 'Send'}
        </button>
      </div>

      {status && (
        <p role="status" className={`m-0 text-[14px] leading-[1.55] ${status.ok ? 'text-ink-2' : 'text-accent-deep'}`}>
          {status.text}
        </p>
      )}
    </form>
  );
}
