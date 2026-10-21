'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Note = { id: string; title: string; audience: string; updatedAt: string };

/** Add or remove a company note. The assistant answers only from published notes. */
export function AssistantNotes({ notes }: { notes: Note[] }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<'public' | 'staff'>('public');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setMessage(null);
    const response = await fetch('/api/admin/assistant/documents', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, body, audience }),
    });
    setBusy(false);
    if (!response.ok) {
      setMessage('That note was not saved.');
      return;
    }
    setTitle('');
    setBody('');
    setMessage('Saved. The assistant can use it now.');
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm('Remove this note? The assistant will stop using it.')) return;
    const response = await fetch(`/api/admin/assistant/documents?id=${id}`, { method: 'DELETE' });
    if (response.ok) router.refresh();
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <label className="text-[14px]">
          <span className="block font-medium">Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={200} className="mt-1 w-full rounded-[10px] border border-line-strong bg-paper px-3 py-2" />
        </label>
        <label className="text-[14px]">
          <span className="block font-medium">Who can hear it</span>
          <select value={audience} onChange={(event) => setAudience(event.target.value === 'staff' ? 'staff' : 'public')} className="mt-1 w-full rounded-[10px] border border-line-strong bg-paper px-3 py-2">
            <option value="public">Visitors, on the site and on WhatsApp</option>
            <option value="staff">Staff only, for the legal review draft</option>
          </select>
        </label>
        <label className="text-[14px]">
          <span className="block font-medium">The note</span>
          <textarea value={body} onChange={(event) => setBody(event.target.value)} required rows={12} maxLength={100000} className="mt-1 w-full rounded-[10px] border border-line-strong bg-paper px-3 py-2 text-[14px]" />
        </label>
        <button type="submit" disabled={busy} className="w-fit cursor-pointer rounded-full bg-ink px-4 py-2 text-[14px] text-paper disabled:opacity-40">
          Save note
        </button>
        {message ? <p className="m-0 text-[13px] text-ink-2">{message}</p> : null}
      </form>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {notes.length === 0 ? <li className="text-[14px] text-muted">No notes yet. Until there are public notes, the assistant answers only from site settings, and says so when it does not know.</li> : null}
        {notes.map((note) => (
          <li key={note.id} className="rounded-[12px] border border-line bg-surface px-3 py-3">
            <p className="m-0 font-medium">{note.title}</p>
            <p className="m-0 mt-1 text-[12px] text-muted">{note.audience === 'staff' ? 'Staff only' : 'Public'} · {note.updatedAt}</p>
            <button type="button" onClick={() => void remove(note.id)} className="mt-2 cursor-pointer text-[13px] text-ink-2 underline">
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
