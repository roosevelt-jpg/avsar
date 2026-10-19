'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Adds an employer and its first contact, which is what makes it reachable. */
export function AddEmployer() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('PT');
  const [vatNumber, setVatNumber] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);

  async function submit() {
    setBusy(true);
    setMessage('');
    setFailed(false);
    try {
      const response = await fetch('/api/admin/employers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, country, vatNumber, contactEmail }),
      });
      const data = (await response.json().catch(() => null)) as {
        status?: string;
        invited?: boolean;
      } | null;

      if (data?.status === 'email_is_candidate') {
        setFailed(true);
        setMessage('That address already belongs to a candidate. Use a different one.');
        return;
      }
      if (!response.ok || data?.status !== 'created') {
        setFailed(true);
        setMessage('Could not add the employer.');
        return;
      }

      /* Said plainly, because an invitation that silently failed is how an
         employer waits a week for an email nobody sent. */
      setMessage(
        data.invited
          ? `Added. ${contactEmail} has been sent a link to set a password.`
          : `Added, but the invitation could not be sent. ${contactEmail} will need a password reset once email is working.`,
      );
      setFailed(!data.invited);
      setName('');
      setVatNumber('');
      setContactEmail('');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const field =
    't-colors w-full rounded-[10px] border border-line-strong bg-surface px-3 py-2.5 text-[15px] outline-none focus:border-ink';

  return (
    <div className="mt-7 max-w-[640px] rounded-[14px] border border-line bg-surface-subtle p-5">
      <p className="m-0 mb-4 text-[15px] font-semibold">Add an employer</p>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[14px]">Company name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px]">Country</span>
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
            maxLength={2}
            className={field}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px]">VAT number (optional)</span>
          <input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px]">Contact email</span>
          <input
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            type="email"
            autoComplete="off"
            className={field}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => void submit()}
        disabled={busy || name.trim().length < 2 || !contactEmail.includes('@')}
        className="t-colors mt-4 cursor-pointer rounded-[10px] border-0 bg-ink px-4 py-2.5 text-[14px] font-medium text-paper hover:bg-ink-hover disabled:opacity-40"
      >
        Add employer
      </button>

      {message && (
        <p className={`mt-3 mb-0 text-[14px] ${failed ? 'text-accent-deep' : 'text-ink-2'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
