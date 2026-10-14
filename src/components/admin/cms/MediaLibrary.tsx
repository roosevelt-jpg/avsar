'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { uploadMedia } from '../upload';

type Item = { id: string; kind: 'image' | 'video' | 'document'; url: string; fileName: string; alt: string; bytes: number; createdAt: string };

function size(bytes: number) {
  if (!bytes) return '';
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/**
 * The media library: drop files in, describe them, copy their address,
 * delete what is no longer used. Built-in files from the repository are shown
 * too, read-only, so editors can reuse the photography that ships with the site.
 */
export function MediaLibrary({ items, canManage }: { items: Item[]; canManage: boolean }) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [uploading, setUploading] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    for (const file of Array.from(files)) {
      setUploading((list) => [...list, file.name]);
      try {
        await uploadMedia(file);
      } catch (e) {
        setError(`${file.name}: ${e instanceof Error ? e.message : 'upload failed'}`);
      } finally {
        setUploading((list) => list.filter((name) => name !== file.name));
      }
    }
    router.refresh();
  }

  async function saveAlt(id: string, alt: string) {
    await fetch(`/api/admin/cms/media/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ alt }) });
  }

  async function remove(id: string) {
    if (!confirm('Delete this file? Any page still using it will show a broken image.')) return;
    const response = await fetch(`/api/admin/cms/media/${id}`, { method: 'DELETE' });
    if (response.ok) router.refresh();
    else setError('Could not delete that file.');
  }

  const shown = items.filter((item) => filter === 'all' || item.kind === filter);

  return (
    <div>
      {canManage && (
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void onFiles(e.dataTransfer.files);
          }}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-line-strong bg-surface px-6 py-10 text-center hover:border-ink"
        >
          <span className="text-[16px] font-medium">Drop images, videos or PDFs here, or click to choose</span>
          <span className="text-[13px] text-muted">JPG, PNG, WebP, GIF up to 15 MB · MP4, WebM up to 100 MB · PDF up to 20 MB</span>
          <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm,application/pdf" className="sr-only" onChange={(e) => void onFiles(e.target.files)} />
        </label>
      )}
      {uploading.length > 0 && <p className="m-0 mt-3 text-[14px] text-ink-2">Uploading {uploading.join(', ')}…</p>}
      {error && <p className="m-0 mt-3 text-[14px] text-accent-deep">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        {(['all', 'image', 'video', 'document'] as const).map((kind) => (
          <button key={kind} type="button" onClick={() => setFilter(kind)} className={`cursor-pointer rounded-full border px-3 py-1 text-[13px] capitalize ${filter === kind ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink-2'}`}>
            {kind === 'all' ? 'All' : `${kind}s`}
          </button>
        ))}
      </div>

      <ul className="m-0 mt-4 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-3 xl:grid-cols-5">
        {shown.map((item) => {
          const builtIn = item.id.startsWith('builtin:');
          return (
            <li key={item.id} className="overflow-hidden rounded-[14px] border border-line bg-surface">
              <div className="relative aspect-[4/3] bg-canvas">
                {item.kind === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.alt} loading="lazy" className="size-full object-cover" />
                ) : item.kind === 'video' ? (
                  <video src={item.url} muted preload="metadata" className="size-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center font-mono text-[12px] text-muted">PDF</span>
                )}
                {builtIn && <span className="absolute start-2 top-2 rounded-full bg-white/90 px-2 py-0.5 font-mono text-[10px]">built in</span>}
              </div>
              <div className="flex flex-col gap-2 p-3">
                <p className="m-0 truncate text-[13px] font-medium" title={item.fileName}>{item.fileName}</p>
                <p className="m-0 font-mono text-[11px] text-muted">{item.kind}{item.bytes ? ` · ${size(item.bytes)}` : ''}</p>
                {!builtIn && canManage && item.kind === 'image' && (
                  <input
                    defaultValue={item.alt}
                    placeholder="Describe the image"
                    onBlur={(e) => e.target.value !== item.alt && void saveAlt(item.id, e.target.value)}
                    className="w-full rounded-[8px] border border-line bg-paper px-2 py-1 text-[12px]"
                  />
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(item.url);
                      setCopied(item.id);
                      setTimeout(() => setCopied(null), 1500);
                    }}
                    className="cursor-pointer rounded-full border border-line bg-paper px-2.5 py-1 text-[12px]"
                  >
                    {copied === item.id ? 'Copied' : 'Copy URL'}
                  </button>
                  {!builtIn && canManage && (
                    <button type="button" onClick={() => void remove(item.id)} className="cursor-pointer rounded-full border-0 bg-transparent px-1 text-[12px] text-accent-deep">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
