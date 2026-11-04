'use client';

import { useState } from 'react';
import { Turnstile, TURNSTILE_HEADER, turnstileEnabled } from '@/components/security/Turnstile';
import { IDEMPOTENCY_HEADER, useIdempotencyKey } from '@/components/security/useIdempotencyKey';

const field =
  't-colors w-full rounded-[10px] border border-[#142438]/18 bg-[#f7f8fa] px-3.5 py-3 text-[15px] text-[#142438] outline-none placeholder:text-[#142438]/40 focus:border-[var(--color-gold)] focus:bg-white';

type Audience = 'candidate' | 'employer';
type Topic = 'candidate' | 'employer' | 'scam_report' | 'other';

const CANDIDATE_TOPICS: { value: Topic; label: string }[] = [
  { value: 'candidate', label: 'A question about a job or my application' },
  { value: 'scam_report', label: 'Someone asked me for money' },
  { value: 'other', label: 'Something else' },
];

const EMPLOYER_TOPICS: { value: Topic; label: string }[] = [
  { value: 'employer', label: 'I want to hire people' },
  { value: 'other', label: 'Something else about hiring' },
];

/**
 * Contact enquiry form. The contact mockup uses Candidate / Employer tabs;
 * the employers page still uses the employer-only variant with hiring fields.
 */
export function ContactForm({
  variant = 'general',
  locale,
  secureNote,
}: {
  variant?: 'general' | 'employer';
  locale?: string;
  secureNote?: string;
}) {
  const employerOnly = variant === 'employer';
  const [audience, setAudience] = useState<Audience>(employerOnly ? 'employer' : 'candidate');
  const [topic, setTopic] = useState<Topic>(employerOnly ? 'employer' : 'candidate');
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

  const employer = employerOnly || audience === 'employer';
  const anonymousAllowed = topic === 'scam_report';
  const reachable = email.trim() !== '' || phone.trim() !== '';
  const ready =
    fullName.trim() !== '' &&
    message.trim() !== '' &&
    (reachable || anonymousAllowed) &&
    (!employer || company.trim() !== '' || !employerOnly) &&
    (!turnstileEnabled || challenge !== null);

  function switchAudience(next: Audience) {
    setAudience(next);
    setTopic(next === 'employer' ? 'employer' : 'candidate');
    setStatus(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    const body = JSON.stringify({
      fullName,
      email,
      phone,
      whatsappOk,
      topic: employer && topic !== 'other' ? 'employer' : topic,
      message,
      company: employer ? company : '',
      position: employer ? position : '',
      city: employer ? city : '',
      openings: employer && Number.parseInt(openings, 10) > 0 ? Number.parseInt(openings, 10) : null,
      source: employerOnly ? 'employers_page' : 'contact_form',
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
          data?.error === 'not_configured'
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

  const topics = employer ? EMPLOYER_TOPICS : CANDIDATE_TOPICS;

  return (
    <form onSubmit={(e) => void submit(e)} className="not-prose grid gap-4" noValidate>
      {!employerOnly ? (
        <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Enquiry type">
          {(
            [
              { id: 'candidate', label: 'Candidate Enquiry', icon: 'users' },
              { id: 'employer', label: 'Employer Enquiry', icon: 'briefcase' },
            ] as const
          ).map((tab) => {
            const active = audience === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchAudience(tab.id)}
                className={`t-colors inline-flex items-center justify-center gap-2 rounded-[10px] border px-3 py-2.5 text-[13px] font-semibold ${
                  active
                    ? 'border-[var(--color-gold)] bg-[var(--color-gold)] text-[#142438]'
                    : 'border-[#142438]/18 bg-white text-[#142438] hover:border-[var(--color-gold)]'
                }`}
              >
                <TabIcon name={tab.icon} />
                {tab.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {employer && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[13px] font-semibold text-[#142438]">Company</span>
            <input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={160} autoComplete="organization" placeholder="Company name" className={field} />
          </label>
          {employerOnly ? (
            <>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-[#142438]">Role you need</span>
                <input value={position} onChange={(e) => setPosition(e.target.value)} maxLength={120} placeholder="Line cook" className={field} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-[#142438]">How many people</span>
                <input value={openings} onChange={(e) => setOpenings(e.target.value)} inputMode="numeric" className={field} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[13px] font-semibold text-[#142438]">Where in Portugal</span>
                <input value={city} onChange={(e) => setCity(e.target.value)} maxLength={120} placeholder="Albufeira" className={field} />
              </label>
            </>
          ) : null}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-[#142438]">
            {anonymousAllowed ? 'Your name (any name is fine)' : 'Full Name'}
          </span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={120}
            autoComplete="name"
            placeholder="e.g. Rahul Sharma"
            className={field}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-[#142438]">Email Address</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            autoComplete="email"
            placeholder="you@email.com"
            className={field}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-[#142438]">Phone Number</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={32}
            placeholder="+91 98123 45678"
            autoComplete="tel"
            className={field}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-[#142438]">Enquiry Topic</span>
          <select value={topic} onChange={(e) => setTopic(e.target.value as Topic)} className={field}>
            {topics.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="m-0 -mt-2 text-[13px] text-muted">
        {anonymousAllowed
          ? 'Optional. Leave email and phone empty to report without being contacted.'
          : 'Leave an email or a phone number so we can answer you.'}
      </p>

      {phone.trim() !== '' && (
        <label className="flex items-start gap-2.5">
          <input type="checkbox" checked={whatsappOk} onChange={(e) => setWhatsappOk(e.target.checked)} className="mt-1 size-4" />
          <span className="text-[14px] leading-[1.5]">You may answer me on WhatsApp at this number.</span>
        </label>
      )}

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-[#142438]">
          {topic === 'scam_report'
            ? 'What happened? Who asked, how much, and where (WhatsApp, Facebook, in person)?'
            : 'Your Message'}
        </span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={4000}
          rows={5}
          placeholder="Tell us how we can help…"
          className={field}
        />
      </label>

      <Turnstile key={challengeKey} onToken={setChallenge} />

      <button
        type="submit"
        disabled={busy || !ready}
        className="btn-gradient t-colors inline-flex w-full cursor-pointer items-center justify-center gap-2 border-0 px-5 py-3.5 text-[15px] font-semibold disabled:opacity-40"
      >
        {busy ? 'Sending…' : 'Send Enquiry'}
        <span aria-hidden>✈</span>
      </button>

      {secureNote ? (
        <p className="m-0 flex items-start gap-2 text-[12px] leading-[1.45] text-muted">
          <LockIcon />
          <span>{secureNote}</span>
        </p>
      ) : null}

      {status && (
        <p role="status" className={`m-0 text-[14px] leading-[1.55] ${status.ok ? 'text-ink-2' : 'text-accent-deep'}`}>
          {status.text}
        </p>
      )}
    </form>
  );
}

function TabIcon({ name }: { name: 'users' | 'briefcase' }) {
  if (name === 'briefcase') {
    return (
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
        <path d="M4 8h16v11H4z M9 8V5h6v3 M4 13h16" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
      <path d="M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7z M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M16 4.5a3.5 3.5 0 010 6.5 M18 14c2 .8 3 2.8 3 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 size-3.5 shrink-0 text-[var(--color-gold)]" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" strokeLinecap="round" />
    </svg>
  );
}
