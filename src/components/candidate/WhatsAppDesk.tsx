'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { BrandLogo } from '@/components/ui/BrandLogo';

/**
 * Floating desk: pick an AI department persona (or a live recruiter), then
 * talk in one transcript. Human mode polls the same thread until staff reply.
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

type AgentCard = {
  id: string;
  slug: string;
  displayName: string;
  title: string;
  department: string;
  avatarPath: string;
};

type StaffCard = {
  userId: string;
  displayName: string;
  avatarUrl: string;
};

type PersonalCard = {
  userId: string;
  displayName: string;
  title: string;
  whatsapp: string;
  avatarUrl: string;
};

type Turn = {
  id?: number;
  role: 'user' | 'assistant' | 'staff';
  text: string;
  sources: string[];
  senderName?: string;
  senderAvatar?: string;
};

type Selection =
  | { kind: 'agent'; agent: AgentCard }
  | { kind: 'personal'; personal: PersonalCard }
  | { kind: 'staff'; staff: StaffCard }
  | null;

export function WhatsAppDesk({ phone, copy, locale }: { phone: string; copy: WhatsAppDeskCopy; locale: string }) {
  const companyDigits = phone.replace(/[^\d]/g, '');
  const dialog = useRef<HTMLDialogElement>(null);
  const threadRef = useRef('');
  const cursorRef = useRef(0);
  const [selection, setSelection] = useState<Selection>(null);
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [personal, setPersonal] = useState<PersonalCard[]>([]);
  const [staff, setStaff] = useState<StaffCard[]>([]);
  const [question, setQuestion] = useState('');
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<'ai' | 'human' | 'closed'>('ai');
  const [waiting, setWaiting] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/assistant')
      .then((response) => response.json())
      .then((data: { agents?: AgentCard[]; personal?: PersonalCard[]; staff?: StaffCard[] }) => {
        if (cancelled) return;
        setAgents(data.agents ?? []);
        setPersonal(data.personal ?? []);
        setStaff(data.staff ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mode !== 'human' || !selection) return;
    const key = threadKey();
    const tick = async () => {
      try {
        const response = await fetch(`/api/assistant/thread?key=${encodeURIComponent(key)}&after=${cursorRef.current}`);
        const data = (await response.json().catch(() => null)) as {
          mode?: 'ai' | 'human' | 'closed';
          messages?: {
            id: number;
            role: 'user' | 'assistant' | 'staff';
            body: string;
            sources?: string[];
            senderName?: string;
            senderAvatar?: string;
          }[];
        } | null;
        if (!data) return;
        if (data.mode) setMode(data.mode);
        const incoming = data.messages ?? [];
        if (incoming.length === 0) return;
        cursorRef.current = Math.max(cursorRef.current, ...incoming.map((item) => item.id));
        setTurns((current) => {
          const known = new Set(current.map((turn) => turn.id).filter(Boolean));
          const next = incoming
            .filter((item) => !known.has(item.id))
            .map((item) => ({
              id: item.id,
              role: item.role,
              text: item.body,
              sources: item.sources ?? [],
              senderName: item.senderName,
              senderAvatar: item.senderAvatar,
            }));
          return next.length ? [...current, ...next] : current;
        });
        if (incoming.some((item) => item.role === 'staff')) setWaiting(false);
      } catch {
        /* poll quietly */
      }
    };
    void tick();
    const timer = window.setInterval(() => void tick(), 3000);
    return () => window.clearInterval(timer);
  }, [mode, selection]);

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
    if (message.length < 2 || pending || !selection) return;
    setQuestion('');
    setPending(true);
    setTurns((current) => [...current, { role: 'user', text: message, sources: [] }]);
    try {
      const body: Record<string, string> = { message, thread: threadKey(), locale };
      if (selection.kind === 'agent') body.agent = selection.agent.slug;
      if (selection.kind === 'personal') body.personal = selection.personal.userId;
      if (selection.kind === 'staff') body.staff = selection.staff.userId;
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => null)) as {
        reply?: string;
        sources?: string[];
        mode?: 'ai' | 'human' | 'closed';
        escalated?: boolean;
      } | null;
      const text = data?.reply || copy.intro;
      if (data?.mode) setMode(data.mode);
      if (data?.mode === 'human' || data?.escalated) setWaiting(true);
      const senderName =
        selection.kind === 'agent'
          ? selection.agent.displayName
          : selection.kind === 'personal'
            ? `${selection.personal.displayName}'s assistant`
            : 'Assistant';
      setTurns((current) => [
        ...current,
        {
          role: 'assistant',
          text,
          sources: data?.sources ?? [],
          senderName,
        },
      ]);
    } catch {
      setTurns((current) => [...current, { role: 'assistant', text: copy.intro, sources: [] }]);
    }
    setPending(false);
  }

  const waText =
    selection?.kind === 'agent'
      ? copy.desks.find((desk) => desk.id === (selection.agent.slug === 'payments' ? 'pay' : selection.agent.slug))?.text ||
        copy.intro
      : copy.intro;
  const personalDigits =
    selection?.kind === 'personal' ? selection.personal.whatsapp.replace(/[^\d]/g, '') : '';
  const waDigits = personalDigits || companyDigits;
  const waLink = waDigits ? `https://wa.me/${waDigits}?text=${encodeURIComponent(waText)}` : '';

  /* Company WhatsApp or at least one personal assistant unlocks the floating desk. */
  if (!companyDigits && personal.length === 0) return null;

  return (
    <>
      <button
        type="button"
        aria-label="WhatsApp chat"
        title="WhatsApp"
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-50 inline-flex size-14 items-center justify-center rounded-full border-0 bg-[#25D366] p-0 text-white shadow-[0_12px_28px_-8px_rgba(18,140,70,0.65)] hover:bg-[#1ebe57]"
        onClick={() => dialog.current?.showModal()}
      >
        <svg viewBox="0 0 24 24" className="size-7" fill="currentColor" aria-hidden>
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 1.82c4.46 0 8.09 3.63 8.09 8.09 0 4.46-3.63 8.09-8.09 8.09-1.42 0-2.8-.37-4.01-1.07l-.29-.17-3.12.82.83-3.04-.19-.31a8.03 8.03 0 01-1.22-4.32c0-4.46 3.63-8.09 8.09-8.09zm4.63 10.41c-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.56.12-.17.25-.64.81-.79.98-.14.16-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.09-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74 2.49 1.08 2.49.72 2.94.67.45-.04 1.45-.59 1.65-1.16.21-.57.21-1.06.14-1.16-.06-.11-.23-.17-.48-.29z" />
        </svg>
      </button>

      <dialog
        ref={dialog}
        className="wa-panel"
        aria-labelledby="wa-desk-title"
        onClose={() => undefined}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-line px-3 py-2.5">
          <div className="min-w-0">
            <BrandLogo size={28} tone="light" />
            <p id="wa-desk-title" className="m-0 mt-1.5 text-[13px] font-semibold text-ink">
              {selection
                ? selection.kind === 'agent'
                  ? selection.agent.displayName
                  : selection.kind === 'personal'
                    ? selection.personal.displayName
                    : selection.staff.displayName
                : copy.title}
            </p>
            {selection ? (
              <p className="m-0 mt-0.5 line-clamp-2 text-[11px] leading-[1.35] text-ink-2">
                {selection.kind === 'agent'
                  ? `${selection.agent.title} · AI · Online`
                  : selection.kind === 'personal'
                    ? `${selection.personal.title} · Personal AI`
                    : 'Live recruiter'}
              </p>
            ) : null}
          </div>
          <form method="dialog">
            <button
              type="submit"
              className="grid size-7 shrink-0 place-items-center rounded-[8px] border border-line text-[16px] leading-none text-ink"
              aria-label={copy.close}
            >
              ×
            </button>
          </form>
        </div>

        {selection ? (
          <div className="wa-panel-body flex flex-col px-3 py-2.5">
            <button
              type="button"
              className="mb-2 self-start text-[12px] font-semibold text-[#142438]"
              onClick={() => {
                setSelection(null);
                setTurns([]);
                setMode('ai');
                setWaiting(false);
                cursorRef.current = 0;
              }}
            >
              {copy.allDesks}
            </button>

            <div className="mb-2 max-h-[220px] flex-1 space-y-2 overflow-y-auto">
              {turns.map((turn, index) => (
                <div
                  key={turn.id ?? `${turn.role}-${index}`}
                  className={`text-[13px] leading-[1.45] ${turn.role === 'user' ? 'text-ink' : 'text-ink-2'}`}
                >
                  {turn.role === 'staff' || (turn.role === 'assistant' && turn.senderName) ? (
                    <span className="mb-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#142438]">
                      {turn.senderAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={turn.senderAvatar} alt="" className="size-4 rounded-full object-cover" />
                      ) : null}
                      {turn.senderName || 'Recruiter'}
                    </span>
                  ) : null}
                  <p className="m-0">{turn.text}</p>
                  {turn.sources.length > 0 ? (
                    <span className="mt-1 block text-[11px] text-muted">
                      {copy.fromNotes}: {turn.sources.join(', ')}
                    </span>
                  ) : null}
                </div>
              ))}
              {waiting && mode === 'human' ? (
                <p className="m-0 text-[12px] text-muted">Waiting for a recruiter…</p>
              ) : null}
            </div>

            <form className="flex gap-1.5" onSubmit={(event) => void ask(event)}>
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={copy.ask}
                maxLength={500}
                className="min-w-0 flex-1 rounded-[8px] border border-line bg-white px-2.5 py-1.5 text-[13px]"
              />
              <button type="submit" disabled={pending} className="btn-gradient rounded-[8px] px-2.5 py-1.5 text-[12px] font-semibold disabled:opacity-50">
                {copy.send}
              </button>
            </form>

            {waLink ? (
              <a href={waLink} target="_blank" rel="noreferrer" className="mt-2 text-center text-[11px] font-semibold text-[#142438] no-underline">
                {copy.continue}
              </a>
            ) : null}
          </div>
        ) : (
          <div className="wa-panel-body">
            <ul className="m-0 flex list-none flex-col gap-1.5 p-3">
              {personal.map((person) => (
                <li key={`personal-${person.userId}`}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-2.5 rounded-[10px] border border-line bg-white px-2.5 py-2 text-start hover:border-[#b28a49]"
                    onClick={() => setSelection({ kind: 'personal', personal: person })}
                  >
                    <Avatar path={person.avatarUrl} name={person.displayName} />
                    <span>
                      <span className="block text-[13px] font-semibold text-ink">{person.displayName}</span>
                      <span className="mt-0.5 block text-[11px] leading-[1.4] text-ink-2">
                        {person.title} · Personal AI
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              {agents.map((agent) => (
                <li key={agent.id}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-2.5 rounded-[10px] border border-line bg-white px-2.5 py-2 text-start hover:border-[#b28a49]"
                    onClick={() => setSelection({ kind: 'agent', agent })}
                  >
                    <Avatar path={agent.avatarPath} name={agent.displayName} />
                    <span>
                      <span className="block text-[13px] font-semibold text-ink">{agent.displayName}</span>
                      <span className="mt-0.5 block text-[11px] leading-[1.4] text-ink-2">
                        {agent.title} · AI · Online
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              {staff.map((person) => (
                <li key={person.userId}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-2.5 rounded-[10px] border border-line bg-white px-2.5 py-2 text-start hover:border-[#b28a49]"
                    onClick={() => {
                      setSelection({ kind: 'staff', staff: person });
                      setMode('human');
                      setWaiting(true);
                    }}
                  >
                    <Avatar path={person.avatarUrl} name={person.displayName} />
                    <span>
                      <span className="block text-[13px] font-semibold text-ink">{person.displayName}</span>
                      <span className="mt-0.5 block text-[11px] leading-[1.4] text-[#b28a49]">Live now</span>
                    </span>
                  </button>
                </li>
              ))}
              {agents.length === 0 && staff.length === 0 && personal.length === 0
                ? copy.desks.map((item, index) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="flex w-full items-start gap-2.5 rounded-[10px] border border-line bg-white px-2.5 py-2 text-start hover:border-[#b28a49]"
                        onClick={() =>
                          setSelection({
                            kind: 'agent',
                            agent: {
                              id: item.id,
                              slug: item.id === 'pay' ? 'payments' : item.id,
                              displayName: item.title,
                              title: item.title,
                              department: item.title,
                              avatarPath: '',
                            },
                          })
                        }
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-[8px] border border-[#b28a49]/40 font-mono text-[11px] font-semibold text-[#142438]">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span>
                          <span className="block text-[13px] font-semibold text-ink">{item.title}</span>
                          <span className="mt-0.5 block text-[11px] leading-[1.4] text-ink-2">{item.body}</span>
                        </span>
                      </button>
                    </li>
                  ))
                : null}
            </ul>
          </div>
        )}

      </dialog>
    </>
  );
}

function Avatar({ path, name }: { path: string; name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  if (path) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={path} alt="" className="size-8 shrink-0 rounded-[8px] object-cover" />
    );
  }
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-[8px] border border-[#b28a49]/40 font-mono text-[11px] font-semibold text-[#142438]">
      {initials || '?'}
    </span>
  );
}
