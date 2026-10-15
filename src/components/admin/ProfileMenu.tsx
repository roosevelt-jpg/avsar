'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { setTheme, ThemeIcon, useTheme, type Theme } from '@/components/ui/ThemeToggle';

type MenuLink = { href: string; label: string };

function initials(name: string): string {
  const parts = name.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

const ERRORS: Record<string, string> = {
  unsupported_type: 'Use a JPG, PNG or WebP image.',
  too_large: 'That image is over 2 MB. Try a smaller one.',
  rate_limited: 'Too many changes. Try again in a few minutes.',
};

/**
 * The avatar in the console header and what it opens: who is signed in,
 * changing the profile image, settings, the theme, and signing out.
 */
export function ProfileMenu({
  name,
  email,
  roleLabel,
  avatarUrl,
  links,
}: {
  name: string;
  email: string;
  roleLabel: string;
  avatarUrl: string | null;
  /** Settings and the like, already filtered by permission on the server. */
  links: MenuLink[];
}) {
  const router = useRouter();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const shown = preview ?? avatarUrl;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function upload(file: File) {
    setError('');
    setBusy(true);
    try {
      const body = new FormData();
      body.set('file', file);
      const response = await fetch('/api/account/avatar', { method: 'POST', body });
      const result = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!response.ok || !result.url) {
        setError(ERRORS[result.error ?? ''] ?? 'The image could not be saved. Try again.');
        return;
      }
      setPreview(result.url);
      router.refresh();
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function remove() {
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/account/avatar', { method: 'DELETE' });
      if (!response.ok) {
        setError('The image could not be removed. Try again.');
        return;
      }
      setPreview(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const avatar = (size: string, text: string) =>
    shown ? (
      // eslint-disable-next-line @next/next/no-img-element -- a small public image from our own storage bucket, shown at 40px
      <img src={shown} alt="" className={`${size} rounded-full object-cover`} />
    ) : (
      <span className={`${size} grid place-items-center rounded-full bg-ink font-medium text-paper ${text}`}>{initials(name || email)}</span>
    );

  const themes: { value: Theme; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${name || email}`}
        onClick={() => setOpen((value) => !value)}
        className="t-colors flex cursor-pointer items-center gap-2 rounded-full border border-line-strong bg-surface p-1 pe-2.5 hover:border-ink"
      >
        {avatar('size-8', 'text-[12px]')}
        <svg viewBox="0 0 24 24" className={`size-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute end-0 top-12 z-50 w-[280px] rounded-[18px] border border-line bg-surface p-2 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)]">
          <div className="flex items-center gap-3 px-3 pt-2 pb-3">
            {avatar('size-11', 'text-[14px]')}
            <div className="min-w-0">
              <p className="m-0 truncate text-[14px] font-medium text-ink">{name || email}</p>
              {name && <p className="m-0 truncate text-[12px] text-muted">{email}</p>}
              <p className="m-0 mt-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{roleLabel}</p>
            </div>
          </div>

          <div className="border-t border-line py-1.5">
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
              }}
            />
            <button
              type="button"
              role="menuitem"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
              className="t-colors flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] border-0 bg-transparent px-3 py-2 text-start text-[14px] text-ink hover:bg-paper disabled:cursor-wait disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" className="size-4 text-muted" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.4-2h5l1.4 2h1.6A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-8Z" strokeLinejoin="round" />
                <circle cx="12" cy="12.5" r="3.2" />
              </svg>
              {busy ? 'Saving…' : 'Change profile image'}
            </button>
            {shown && (
              <button
                type="button"
                role="menuitem"
                disabled={busy}
                onClick={() => void remove()}
                className="t-colors flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] border-0 bg-transparent px-3 py-2 text-start text-[14px] text-ink-2 hover:bg-paper disabled:opacity-60"
              >
                <span className="size-4" aria-hidden />
                Remove image
              </button>
            )}
            {error && <p role="alert" className="m-0 px-3 py-1 text-[13px] text-accent-deep">{error}</p>}
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="t-colors flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[14px] text-ink no-underline hover:bg-paper"
              >
                <svg viewBox="0 0 24 24" className="size-4 text-muted" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" strokeLinejoin="round" />
                </svg>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-line px-3 py-2.5">
            <p className="m-0 mb-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Theme</p>
            <div className="grid grid-cols-3 gap-1 rounded-[12px] bg-paper p-1" role="radiogroup" aria-label="Theme">
              {themes.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={theme === option.value}
                  onClick={() => setTheme(option.value)}
                  className={`t-colors flex cursor-pointer items-center justify-center gap-1.5 rounded-[9px] border-0 px-2 py-1.5 text-[12px] ${
                    theme === option.value ? 'bg-ink text-paper' : 'bg-transparent text-ink-2 hover:text-ink'
                  }`}
                >
                  <ThemeIcon theme={option.value} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <form action="/auth/signout" method="post" className="border-t border-line pt-1.5">
            <button
              type="submit"
              role="menuitem"
              className="t-colors flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] border-0 bg-transparent px-3 py-2 text-start text-[14px] text-ink hover:bg-paper"
            >
              <svg viewBox="0 0 24 24" className="size-4 text-muted" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
