'use client';

import { useEffect, useState, type FormEvent } from 'react';

type ThreadRow = {
  id: string;
  publicKey: string;
  channel: string;
  agentName: string;
  department: string;
  visitorLabel: string;
  needsHuman: boolean;
  mode: string;
  lastMessageAt: string;
  assigneeUserId: string | null;
};

type Message = {
  id: number;
  role: 'user' | 'assistant' | 'staff';
  body: string;
  senderName?: string;
  createdAt: string;
};

export function LiveChatQueue({ initialThreadId }: { initialThreadId?: string }) {
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [activeId, setActiveId] = useState(initialThreadId || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [label, setLabel] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [onlyNeeds, setOnlyNeeds] = useState(true);

  useEffect(() => {
    let stopped = false;
    async function refresh() {
      if (document.visibilityState !== 'visible') return;
      try {
        const params = new URLSearchParams();
        if (onlyNeeds) params.set('needs_human', '1');
        const response = await fetch(`/api/admin/chat/threads?${params}`);
        const data = (await response.json().catch(() => null)) as { threads?: ThreadRow[] } | null;
        if (!stopped) setThreads(data?.threads ?? []);
      } catch {
        /* next tick retries */
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 8000);
    document.addEventListener('visibilitychange', () => void refresh());
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [onlyNeeds]);

  useEffect(() => {
    if (!activeId) return;
    let stopped = false;
    async function refresh() {
      if (document.visibilityState !== 'visible') return;
      try {
        const response = await fetch(`/api/admin/chat/threads/${activeId}`);
        const data = (await response.json().catch(() => null)) as {
          thread?: { visitorLabel?: string };
          messages?: Message[];
        } | null;
        if (stopped) return;
        setMessages(data?.messages ?? []);
        setLabel(data?.thread?.visitorLabel || '');
      } catch {
        /* next tick retries */
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 4000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [activeId]);

  async function claim() {
    if (!activeId || busy) return;
    setBusy(true);
    await fetch(`/api/admin/chat/threads/${activeId}/claim`, { method: 'POST' });
    setBusy(false);
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = reply.trim();
    if (!activeId || message.length < 1 || busy) return;
    setBusy(true);
    await fetch(`/api/admin/chat/threads/${activeId}/reply`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    setReply('');
    setBusy(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-[12px] border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-3 py-2">
          <p className="m-0 text-[13px] font-semibold text-ink">Threads</p>
          <label className="flex items-center gap-1.5 text-[11px] text-ink-2">
            <input type="checkbox" checked={onlyNeeds} onChange={(event) => setOnlyNeeds(event.target.checked)} />
            Needs human
          </label>
        </div>
        <ul className="m-0 max-h-[70vh] list-none overflow-y-auto p-0">
          {threads.map((thread) => (
            <li key={thread.id}>
              <button
                type="button"
                onClick={() => setActiveId(thread.id)}
                className={`flex w-full flex-col gap-0.5 border-b border-line px-3 py-2.5 text-start ${
                  activeId === thread.id ? 'bg-[#f4f5f7]' : 'bg-white'
                }`}
              >
                <span className="text-[13px] font-semibold text-ink">
                  {thread.visitorLabel || thread.publicKey.slice(0, 8)}
                </span>
                <span className="text-[11px] text-ink-2">
                  {thread.agentName || 'General'} · {thread.channel}
                  {thread.needsHuman ? ' · waiting' : ''}
                </span>
              </button>
            </li>
          ))}
          {threads.length === 0 ? <li className="px-3 py-4 text-[13px] text-muted">No open threads.</li> : null}
        </ul>
      </aside>

      <section className="flex min-h-[420px] flex-col rounded-[12px] border border-line bg-white">
        {activeId ? (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
              <div>
                <p className="m-0 text-[14px] font-semibold text-ink">{label || 'Visitor'}</p>
                <p className="m-0 text-[11px] text-muted">{activeId}</p>
              </div>
              <button
                type="button"
                onClick={() => void claim()}
                disabled={busy}
                className="rounded-[8px] border border-line px-2.5 py-1.5 text-[12px] font-semibold disabled:opacity-50"
              >
                Claim
              </button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
              {messages.map((message) => (
                <div key={message.id} className="text-[13px] leading-[1.45]">
                  <span className="block text-[11px] font-semibold text-[#142438]">
                    {message.role === 'user'
                      ? 'Visitor'
                      : message.role === 'staff'
                        ? message.senderName || 'You'
                        : message.senderName || 'AI'}
                  </span>
                  <p className="m-0 text-ink-2">{message.body}</p>
                </div>
              ))}
            </div>
            <form onSubmit={(event) => void send(event)} className="flex gap-2 border-t border-line p-3">
              <input
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Reply in this window…"
                maxLength={2000}
                className="min-w-0 flex-1 rounded-[8px] border border-line px-2.5 py-2 text-[13px]"
              />
              <button type="submit" disabled={busy} className="btn-gradient rounded-[8px] px-3 py-2 text-[12px] font-semibold disabled:opacity-50">
                Send
              </button>
            </form>
          </>
        ) : (
          <p className="m-auto text-[13px] text-muted">Select a thread.</p>
        )}
      </section>
    </div>
  );
}
