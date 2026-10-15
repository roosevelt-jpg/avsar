'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Story } from '@/lib/relocation/data';

const STATUS_TEXT: Record<Story['status'], string> = {
  submitted: 'Thank you. We are reading it and will let you know before anything is published.',
  approved: 'Published on our website. You can take it down at any time.',
  rejected: 'We could not publish this one. You are welcome to write a new version.',
  withdrawn: '',
};

/**
 * For placed candidates: a few sentences for people in India considering
 * the same move. Their words, the name they choose, read by staff before it
 * appears, and withdrawable whenever they like.
 */
export function StoryForm({ story, demo }: { story: Story | null; demo: boolean }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(story?.displayName ?? '');
  const [roleLabel, setRoleLabel] = useState(story?.roleLabel ?? '');
  const [cityLabel, setCityLabel] = useState(story?.cityLabel ?? '');
  const [quote, setQuote] = useState(story?.quote ?? '');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function send(method: 'POST' | 'DELETE') {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/relocation/story', {
        method,
        headers: { 'content-type': 'application/json' },
        body: method === 'POST' ? JSON.stringify({ displayName, roleLabel, cityLabel, quote, consent }) : undefined,
      });
      if (response.ok) {
        setMessage(method === 'POST' ? 'Sent for review.' : 'Taken down.');
        router.refresh();
      } else {
        setMessage(response.status === 503 ? 'This is a preview: nothing is saved.' : 'That did not work. Check the fields and try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  const field = 'w-full rounded-[12px] border border-line-strong bg-paper px-3.5 py-2.5 text-[16px]';
  return (
    <section aria-labelledby="story" className="rounded-[20px] border border-line bg-surface p-[clamp(18px,2.4cqi,26px)]">
      <h2 id="story" className="m-0 text-[19px] font-semibold">Tell others how it went</h2>
      <p className="mt-2 mb-0 max-w-[62ch] text-[15px] leading-[1.6] text-ink-2">
        People in India deciding whether to trust a recruiter abroad listen to someone who has done it. If you would like to, write a few
        honest sentences. We publish only what you write, under the name you choose, after reading it.
      </p>
      {story && story.status !== 'withdrawn' && <p className="mt-3 mb-0 text-[14px] font-medium">{STATUS_TEXT[story.status]}</p>}

      <div className="mt-4 grid max-w-[640px] gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[14px]">Name to show</span>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} placeholder="Arjun, Kochi" className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px]">Your job</span>
          <input value={roleLabel} onChange={(e) => setRoleLabel(e.target.value)} maxLength={80} placeholder="Line cook" className={field} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-[14px]">Where you work now (optional)</span>
          <input value={cityLabel} onChange={(e) => setCityLabel(e.target.value)} maxLength={80} placeholder="Albufeira" className={field} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-[14px]">Your words (20 to 600 characters)</span>
          <textarea value={quote} onChange={(e) => setQuote(e.target.value)} maxLength={600} rows={4} className={field} />
        </label>
        <label className="flex items-start gap-2.5 sm:col-span-2">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 size-4" />
          <span className="text-[14px] leading-[1.5]">You may publish this on your website with the name above. I can ask you to take it down at any time.</span>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={busy || demo || !consent || quote.trim().length < 20 || !displayName.trim() || !roleLabel.trim()} onClick={() => void send('POST')} className="cursor-pointer rounded-full border-0 bg-ink px-4 py-2 text-[14px] text-paper disabled:opacity-40">
          Send for review
        </button>
        {story && story.status !== 'withdrawn' && (
          <button type="button" disabled={busy} onClick={() => void send('DELETE')} className="cursor-pointer rounded-full border border-line-strong bg-paper px-4 py-2 text-[14px]">Take it down</button>
        )}
      </div>
      {message && <p role="status" className="mt-3 mb-0 text-[14px] text-ink-2">{message}</p>}
    </section>
  );
}
