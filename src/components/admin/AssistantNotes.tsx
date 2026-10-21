'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Note = { id: string; title: string; audience: string; updatedAt: string };

/**
 * The assistant's notes. A typed note and an uploaded Markdown file are the
 * same thing once saved: a title, a body, and who may hear it.
 */
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

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const documents: { filename: string; title: string; body: string }[] = [];
    const skipped: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith('.md') || file.name.includes('/') || file.name.includes('\\')) {
        skipped.push(file.name);
        continue;
      }
      const text = (await file.text()).replace(/^\uFEFF/, '').trim();
      if (!text || text.includes('\0') || text.length > 100_000) {
        skipped.push(file.name);
        continue;
      }
      const heading = text.match(/^#\s+(\S.*)$/m);
      const fromName = file.name.replace(/\.md$/i, '').replace(/[-_]+/g, ' ').trim();
      documents.push({
        filename: file.name,
        title: (heading?.[1] ?? fromName).trim().slice(0, 200),
        body: text.slice(0, 100_000),
      });
    }
    if (documents.length === 0) {
      setMessage('No Markdown file was saved. Use a .md file.');
      return;
    }
    setBusy(true);
    setMessage(null);
    const response = await fetch('/api/admin/assistant/documents', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ audience, documents }),
    });
    setBusy(false);
    if (!response.ok) {
      setMessage('Those files were not saved.');
      return;
    }
    const skippedNote = skipped.length > 0 ? ` Skipped ${skipped.join(', ')}.` : '';
    setMessage(`Saved ${documents.length} ${documents.length === 1 ? 'file' : 'files'}.${skippedNote}`);
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
          <span className="block font-medium">Markdown files</span>
          <input
            type="file"
            accept=".md,text/markdown"
            multiple
            disabled={busy}
            onChange={(event) => {
              const chosen = event.target.files;
              event.target.value = '';
              void upload(chosen);
            }}
            className="mt-1 block w-full text-[14px]"
          />
          <span className="mt-1 block text-[12px] text-muted">One .md file is one note. The first heading becomes the title. These are what the assistant quotes when the model is unavailable.</span>
        </label>
        <label className="text-[14px]">
          <span className="block font-medium">Or type a note</span>
          <textarea value={body} onChange={(event) => setBody(event.target.value)} required rows={12} maxLength={100000} className="mt-1 w-full rounded-[10px] border border-line-strong bg-paper px-3 py-2 text-[14px]" />
        </label>
        <button type="submit" disabled={busy} className="w-fit cursor-pointer rounded-full bg-ink px-4 py-2 text-[14px] text-paper disabled:opacity-40">
          Save note
        </button>
        {message ? <p className="m-0 text-[13px] text-ink-2">{message}</p> : null}
      </form>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {notes.length === 0 ? <li className="text-[14px] text-muted">No documents yet. Until there are public notes, the assistant uses site settings and the FAQ, and says so when it does not know.</li> : null}
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
