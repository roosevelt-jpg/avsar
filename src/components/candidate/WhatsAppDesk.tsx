'use client';

import { useRef, useState, type FormEvent } from 'react';

/**
 * The floating WhatsApp control opens a window of desks, then hands the
 * visitor to the company's real WhatsApp number. The desks are topics, not
 * named people: inventing a face and a name would pretend someone works here.
 *
 * Copy arrives already translated for the page language, including the draft
 * that WhatsApp opens with. Questions are answered from company notes. The
 * desks still hand the visitor to a person. The button stays "WhatsApp".
 */
export type WhatsAppDeskCopy = {
  title: string;
  intro: string;
  ask: string;
  send: string;
  fromNotes: string;
  close: string;
  allDesks: string;
  continue: string;
  desks: { id: 'jobs' | 'visa' | 'pay'; title: string; body: string; text: string }[];
};

export function WhatsAppDesk({ phone, hours, copy }: { phone: string; hours: string; copy: WhatsAppDeskCopy }) {
  const digits = phone.replace(/[^\d]/g, '');
  const dialog = useRef<HTMLDialogElement>(null);
  const [deskId, setDeskId] = useState<WhatsAppDeskCopy['desks'][number]['id'] | null>(null);
  const [question, setQuestion] = useState('');
  const [pending, setPending] = useState(false);
  const threadRef = useRef('');
  const [turns, setTurns] = useState<{ role: 'user' | 'assistant'; text: string; sources: string[] }[]>([]);
  if (!digits) return null;

  function threadKey() {
    if (threadRef.current) return threadRef.current;
    const stored = window.sessionStorage.getItem('assistant-thread');
    const key = stored && /^[a-zA-Z0-9-]{8,80}$/.test(stored) ? stored : crypto.randomUUID();
    window.sessionStorage.setItem('assistant-thread', key);
    threadRef.current = key;
    return key;
  }

  async function ask(event: FormEvent) {
    event.preventDefault();
    const message = question.trim();
    if (message.length < 2 || pending) return;
    setQuestion('');
    setPending(true);
    setTurns((current) => [...current, { role: 'user', text: message, sources: [] }]);
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message, thread: threadKey() }),
      });
      const data = (await response.json().catch(() => null)) as { reply?: string; sources?: string[] } | null;
      const text = data?.reply || copy.intro;
      setTurns((current) => [...current, { role: 'assistant', text, sources: data?.sources ?? [] }]);
    } catch {
      setTurns((current) => [...current, { role: 'assistant', text: copy.intro, sources: [] }]);
    }
    setPending(false);
  }

  const desk = copy.desks.find((item) => item.id === deskId) ?? null;
  const thread = desk ? `https://wa.me/${digits}?text=${encodeURIComponent(desk.text)}` : `https://wa.me/${digits}`;

  return (
    <>
      <button
        type="button"
        className="btn-gradient fixed bottom-5 end-5 z-50 inline-flex items-center gap-2 px-4 py-3 text-[15px] font-semibold text-white"
        onClick={() => dialog.current?.showModal()}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path d="M5 6.5A2.5 2.5 0 017.5 4h9A2.5 2.5 0 0119 6.5V13a2.5 2.5 0 01-2.5 2.5H10l-4.2 3.2c-.5.4-1.3 0-1.3-.6V6.5z" strokeLinejoin="round" />
        </svg>
        WhatsApp
      </button>

      <dialog
        ref={dialog}
        className="wa-panel"
        aria-labelledby="wa-desk-title"
        onClose={() => setDeskId(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p id="wa-desk-title" className="m-0 text-[17px] font-semibold text-ink">
              {copy.title}
            </p>
            <p className="m-0 mt-1 text-[13px] leading-[1.45] text-ink-2">{copy.intro}</p>
          </div>
          <form method="dialog">
            <button type="submit" className="grid size-9 place-items-center rounded-full border border-line text-ink" aria-label={copy.close}>
              ×
            </button>
          </form>
        </div>

        {desk ? (
          <div className="px-5 py-4">
            <button type="button" className="mb-3 text-[13px] font-semibold text-accent-deep" onClick={() => setDeskId(null)}>
              {copy.allDesks}
            </button>
            <div className="rounded-[20px] bg-tint-clay px-4 py-3">
              <p className="m-0 text-[13px] font-semibold uppercase tracking-[0.08em] text-accent-deep">{desk.title}</p>
              <p className="m-0 mt-1 text-[15px] leading-[1.5] text-ink">{desk.body}</p>
            </div>
            <a
              href={thread}
              target="_blank"
              rel="noreferrer"
              className="btn-gradient mt-4 flex justify-center rounded-[16px] px-4 py-3 text-[15px] font-semibold text-white no-underline"
            >
              {copy.continue}
            </a>
          </div>
        ) : (
          <>
          <div className="border-b border-line px-4 py-4">
            {turns.map((turn, index) => (
              <p key={index} className={`m-0 mb-3 text-[14px] leading-[1.5] ${turn.role === 'user' ? 'text-ink' : 'text-ink-2'}`}>
                {turn.text}
                {turn.sources.length > 0 ? (
                  <span className="mt-1 block text-[12px] text-muted">
                    {copy.fromNotes}: {turn.sources.join(', ')}
                  </span>
                ) : null}
              </p>
            ))}
            <form className="flex gap-2" onSubmit={(event) => void ask(event)}>
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={copy.ask}
                maxLength={500}
                className="min-w-0 flex-1 rounded-[8px] border border-line bg-surface px-3 py-2 text-[14px]"
              />
              <button type="submit" disabled={pending} className="btn-gradient rounded-[8px] px-3 py-2 text-[14px] font-semibold text-white disabled:opacity-50">
                {copy.send}
              </button>
            </form>
          </div>
          <ul className="m-0 flex list-none flex-col gap-2 p-4">
            {copy.desks.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 rounded-[20px] border border-line bg-surface px-3 py-3 text-start hover:border-accent"
                  onClick={() => setDeskId(item.id)}
                >
                  <span className="icon-gem grid size-11 shrink-0 place-items-center font-mono text-[13px] font-semibold">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold text-ink">{item.title}</span>
                    <span className="mt-0.5 block text-[13px] leading-[1.45] text-ink-2">{item.body}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          </>
        )}

        <p className="m-0 border-t border-line px-5 py-3 text-[12px] leading-[1.45] text-muted">
          {hours ? <span className="block">{hours}</span> : null}
          <span dir="ltr" className="mt-1 block font-mono">
            {phone}
          </span>
        </p>
      </dialog>
    </>
  );
}
