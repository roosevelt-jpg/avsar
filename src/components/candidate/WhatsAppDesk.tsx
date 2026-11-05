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
        aria-label="Chat"
        title="Chat"
        className="btn-gradient fixed bottom-[max(1rem,env(safe-area-inset-bottom))] end-[max(1rem,env(safe-area-inset-right))] z-50 inline-flex size-11 items-center justify-center rounded-[10px] p-0 shadow-[0_10px_24px_-12px_rgba(20,36,56,0.55)]"
        onClick={() => dialog.current?.showModal()}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path d="M5 6.5A2.5 2.5 0 017.5 4h9A2.5 2.5 0 0119 6.5V13a2.5 2.5 0 01-2.5 2.5H10l-4.2 3.2c-.5.4-1.3 0-1.3-.6V6.5z" strokeLinejoin="round" />
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
