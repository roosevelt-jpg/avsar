'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FamilyLink } from '@/lib/relocation/data';

/**
 * Share progress with family. The link is shown once, right after it is made,
 * because only its fingerprint is kept; if it is lost, make another and switch
 * the old one off.
 */
export function FamilyLinks({ links }: { links: FamilyLink[] }) {
  const router = useRouter();
  const [label, setLabel] = useState('');
  const [consent, setConsent] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const active = links.filter((l) => !l.revokedAt);

  async function create() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/relocation/family-links', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label, consent }),
      });
      const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (data?.url) {
        setCreated(data.url);
        setLabel('');
        setConsent(false);
        router.refresh();
      } else {
        setMessage(data?.error === 'not_configured' ? 'The database is not connected, so nothing was saved.' : data?.error === 'too_many_links' ? 'You have five links already. Switch one off first.' : 'The link could not be created.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    await fetch('/api/relocation/family-links', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) });
    router.refresh();
  }

  return (
    <section aria-labelledby="family" className="rounded-[20px] border border-line bg-surface p-[clamp(18px,2.4cqi,26px)]">
      <h2 id="family" className="m-0 text-[19px] font-semibold">Share your progress with family</h2>
      <p className="mt-2 mb-0 max-w-[62ch] text-[15px] leading-[1.6] text-ink-2">
        A private page your family can open to see your job, the city and how far your visa and travel have got. It does not show your
        salary, your employer, your documents or how to contact you. You can switch it off at any time.
      </p>

      {created && (
        <div className="mt-4 rounded-[12px] border border-line bg-paper p-4">
          <p className="m-0 text-[14px] font-medium">Copy this link now. For your safety it is not shown again.</p>
          <p className="mt-2 mb-0 break-all font-mono text-[13px]">{created}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => void navigator.clipboard?.writeText(created)} className="cursor-pointer rounded-full border border-line-strong bg-surface px-3 py-1.5 text-[13px]">Copy</button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`My Portugal move progress: ${created}`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full border border-line-strong bg-surface px-3 py-1.5 text-[13px] text-ink no-underline"
            >
              Share on WhatsApp
            </a>
          </div>
        </div>
      )}

      {active.length > 0 && (
        <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
          {active.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-3 text-[14px]">
              <span className="font-medium">{l.label}</span>
              <span className="text-muted">opened {l.viewCount} {l.viewCount === 1 ? 'time' : 'times'}</span>
              <button type="button" onClick={() => void revoke(l.id)} className="ms-auto cursor-pointer rounded-full border border-line-strong bg-paper px-3 py-1 text-[13px]">Switch off</button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex max-w-[560px] flex-col gap-3">
        <label className="block">
          <span className="mb-1.5 block text-[14px]">Who is it for?</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} placeholder="My parents" className="w-full rounded-[12px] border border-line-strong bg-paper px-3.5 py-2.5 text-[16px]" />
        </label>
        <label className="flex items-start gap-2.5">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 size-4" />
          <span className="text-[14px] leading-[1.5]">I agree that anyone with this link can see my first name, job, city and the progress of my move.</span>
        </label>
        <div>
          <button type="button" disabled={busy || !label.trim() || !consent} onClick={() => void create()} className="cursor-pointer rounded-full border-0 bg-ink px-4 py-2 text-[14px] text-paper disabled:opacity-40">
            Create link
          </button>
        </div>
      </div>
      {message && <p role="status" className="mt-3 mb-0 text-[14px] text-accent-deep">{message}</p>}
    </section>
  );
}
