'use client';

import { useEffect, useRef, useState } from 'react';
import { youtubeEmbedUrl, youtubeId, youtubeThumbnail } from '@/lib/cms/video';

/**
 * A film that costs nothing until somebody wants it.
 *
 * A YouTube iframe pulls roughly a megabyte of script the moment it is on the
 * page, which on Indian mobile data delays the button we actually want
 * pressed. So this shows a still and a play button, and swaps in the player
 * only when pressed. Uploaded films use the browser's own player, which
 * loads only metadata until played.
 */
export function VideoPlayer({ src, poster, title, autoplay = false }: { src: string; poster?: string; title: string; autoplay?: boolean }) {
  const id = youtubeId(src);
  const [playing, setPlaying] = useState(autoplay);

  if (!id) {
    return (
      <video
        src={src}
        poster={poster || undefined}
        controls
        autoPlay={autoplay}
        playsInline
        preload="metadata"
        aria-label={title}
        className="absolute inset-0 size-full bg-night object-cover"
      />
    );
  }

  if (playing) {
    return (
      <iframe
        src={youtubeEmbedUrl(id, true)}
        title={title}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 size-full border-0"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play: ${title}`}
      className="group absolute inset-0 size-full cursor-pointer border-0 bg-night p-0"
    >
      {/* A plain img: the still comes from YouTube or the media library at
          the right size already, and the optimiser would add a round trip. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster || youtubeThumbnail(id)} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
      <span aria-hidden className="absolute inset-0 grid place-items-center">
        <span className="grid size-[72px] place-items-center rounded-full bg-night text-on-night shadow-[0_12px_40px_-8px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-105">
          <PlayIcon className="ms-1 size-8" />
        </span>
      </span>
    </button>
  );
}

/**
 * "Watch how it works" as a quiet button next to the main action, opening the
 * film in a native dialog. Closing the dialog unmounts the player, so the
 * sound stops with it.
 */
export function FilmButton({ src, poster, label }: { src: string; poster?: string; label: string; tone?: 'light' | 'dark' }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-gradient t-colors inline-flex cursor-pointer items-center gap-2.5 rounded-[14px] border-0 px-4 py-2.5 text-[15px] font-medium"
      >
        <span aria-hidden className="grid size-9 place-items-center rounded-full border border-current">
          <PlayIcon className="ms-0.5 size-4" />
        </span>
        {label}
      </button>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        aria-label={label}
        className="m-auto w-[min(960px,94vw)] max-w-none overflow-visible border-0 bg-transparent p-0 backdrop:bg-black/80"
      >
        <div className="relative aspect-video overflow-hidden rounded-[18px] bg-night">
          {open ? <VideoPlayer src={src} poster={poster} title={label} autoplay /> : null}
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mx-auto mt-3 block cursor-pointer rounded-full border border-white/40 bg-transparent px-5 py-2 text-[14px] text-white"
        >
          Close
        </button>
      </dialog>
    </>
  );
}

function PlayIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}
