'use client';

import { useEffect, useRef, useState } from 'react';
import { uploadMedia } from './upload';

type Item = { id: string; kind: 'image' | 'video' | 'document'; url: string; fileName: string; alt: string };

const INPUT = 'w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[14px] outline-none focus:border-ink';

/**
 * A field that holds a media URL: a preview, the URL itself (so an editor can
 * paste a YouTube link or an external image), and a library browser with
 * upload.
 */
export function MediaField({
  value,
  onChange,
  accept,
  label,
}: {
  value: string;
  onChange: (url: string) => void;
  accept: 'image' | 'video' | 'any';
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const isVideo = /\.(mp4|webm)(\?|$)/i.test(value);
  const isYouTube = /youtu(\.be|be\.com)/i.test(value);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-ink-2">{label}</span>
      <div className="flex items-start gap-3">
        <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-[10px] border border-line bg-canvas">
          {value && !isVideo && !isYouTube ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-full object-cover" />
          ) : value ? (
            <span className="font-mono text-[10px] text-muted">{isYouTube ? 'YouTube' : 'VIDEO'}</span>
          ) : (
            <span className="font-mono text-[10px] text-muted">NONE</span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input className={INPUT} value={value} onChange={(e) => onChange(e.target.value)} placeholder={accept === 'video' ? '/video/intro.mp4 or a YouTube link' : '/images/... or https://...'} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(true)} className="cursor-pointer rounded-full border border-line-strong bg-surface px-3 py-1.5 text-[13px] hover:border-ink">
              Choose from library
            </button>
            {value && (
              <button type="button" onClick={() => onChange('')} className="cursor-pointer rounded-full border-0 bg-transparent px-2 py-1.5 text-[13px] text-muted hover:text-ink">
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
      {open && <MediaDialog accept={accept} onClose={() => setOpen(false)} onPick={(url) => { onChange(url); setOpen(false); }} />}
    </div>
  );
}

export function MediaDialog({
  accept,
  onClose,
  onPick,
}: {
  accept: 'image' | 'video' | 'any';
  onClose: () => void;
  onPick: (url: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dialog.current?.showModal();
    const kind = accept === 'any' ? '' : `?kind=${accept}`;
    fetch(`/api/admin/cms/media${kind}`)
      .then((response) => response.json())
      .then((data: { items?: Item[] }) => setItems(data.items ?? []))
      .catch(() => setItems([]));
  }, [accept]);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const uploaded = await uploadMedia(file);
      onPick(uploaded.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  const filtered = (items ?? []).filter((item) => !query || item.fileName.toLowerCase().includes(query.toLowerCase()));
  const acceptAttr = accept === 'image' ? 'image/*' : accept === 'video' ? 'video/mp4,video/webm' : 'image/*,video/mp4,video/webm,application/pdf';

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      className="m-auto w-[min(92vw,880px)] rounded-[22px] border border-line bg-paper p-0 text-ink backdrop:bg-ink/50"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="m-0 text-[18px] font-semibold">Media library</h2>
        <button type="button" onClick={() => dialog.current?.close()} className="cursor-pointer rounded-full border border-line bg-surface px-3 py-1 text-[13px]">
          Close
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <input className={`${INPUT} max-w-[280px]`} placeholder="Search by file name" value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="cursor-pointer rounded-full bg-ink px-4 py-2 text-[13px] text-paper">
          {busy ? 'Uploading…' : 'Upload new'}
          <input type="file" accept={acceptAttr} className="sr-only" onChange={onFile} disabled={busy} />
        </label>
        {error && <span className="text-[13px] text-accent-deep">{error}</span>}
      </div>
      <div className="max-h-[60vh] overflow-y-auto px-5 pb-5">
        {items === null ? (
          <p className="text-[14px] text-muted">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-[14px] text-muted">Nothing here yet. Upload a file to start the library.</p>
        ) : (
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4">
            {filtered.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onPick(item.url)}
                  className="group block w-full cursor-pointer overflow-hidden rounded-[12px] border border-line bg-surface p-0 text-start hover:border-ink"
                >
                  <span className="relative block aspect-[4/3] bg-canvas">
                    {item.kind === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt={item.alt} loading="lazy" className="size-full object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center font-mono text-[11px] uppercase text-muted">{item.kind}</span>
                    )}
                  </span>
                  <span className="block truncate px-2 py-1.5 text-[12px] text-ink-2">{item.fileName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </dialog>
  );
}
