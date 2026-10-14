import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { IconName } from '@/lib/cms/blocks';
import { localHref } from '@/lib/cms/settings';
import type { Locale } from '@/lib/i18n';

/**
 * Shared pieces for CMS blocks: the section frame, headings, buttons, icons
 * and media. Server components; no client JavaScript.
 */

export function Section({
  children,
  tone = 'paper',
  className = '',
  id,
}: {
  children: ReactNode;
  tone?: 'paper' | 'surface' | 'ink' | 'accent';
  className?: string;
  id?: string;
}) {
  const tones = {
    paper: 'bg-paper text-ink',
    surface: 'bg-surface text-ink',
    ink: 'bg-ink text-paper',
    accent: 'bg-accent text-white',
  } as const;
  return (
    <section id={id} className={`${tones[tone]} px-[clamp(20px,4cqi,56px)] py-[clamp(48px,7cqi,96px)] ${className}`}>
      <div className="mx-auto w-full max-w-[1200px]">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = 'start',
  dark = false,
}: {
  eyebrow?: string;
  title?: string;
  intro?: string;
  align?: 'start' | 'center';
  dark?: boolean;
}) {
  if (!eyebrow && !title && !intro) return null;
  return (
    <div className={`mb-[clamp(28px,4cqi,48px)] ${align === 'center' ? 'mx-auto text-center' : ''} max-w-[760px]`}>
      {eyebrow ? (
        <p className={`m-0 mb-3 font-mono text-[12px] uppercase tracking-[0.14em] ${dark ? 'text-accent-on-dark' : 'text-accent'}`}>
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <h2 className="m-0 text-balance text-[clamp(28px,3.6cqi,44px)] font-semibold leading-[1.08] tracking-[-0.03em]">{title}</h2>
      ) : null}
      {intro ? (
        <p className={`mt-4 mb-0 text-[clamp(16px,1.5cqi,18px)] leading-[1.6] ${dark ? 'text-dark-muted-2' : 'text-ink-2'}`}>{intro}</p>
      ) : null}
    </div>
  );
}

const BUTTON = {
  primary: 'bg-accent text-white hover:bg-accent-deep border-transparent',
  dark: 'bg-ink text-paper hover:bg-[#2c2a26] border-transparent',
  light: 'bg-surface text-ink border-line-strong hover:border-ink',
  ghostDark: 'bg-transparent text-paper border-dark-line hover:border-paper',
  white: 'bg-white text-ink border-transparent hover:bg-paper',
} as const;

export function CmsButton({
  href,
  label,
  locale,
  variant = 'primary',
  size = 'md',
}: {
  href: string;
  label: string;
  locale: Locale;
  variant?: keyof typeof BUTTON;
  size?: 'md' | 'lg';
}) {
  if (!href || !label) return null;
  const className = `t-colors inline-flex items-center justify-center gap-2 rounded-full border font-medium no-underline ${
    size === 'lg' ? 'px-6 py-3.5 text-[16px]' : 'px-5 py-3 text-[15px]'
  } ${BUTTON[variant]}`;
  const resolved = localHref(locale, href);
  const external = /^https?:/i.test(resolved);
  if (external || resolved.startsWith('mailto:') || resolved.startsWith('tel:')) {
    return (
      <a href={resolved} className={className} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
        {label}
      </a>
    );
  }
  return (
    <Link href={resolved} className={className}>
      {label}
    </Link>
  );
}

/** Next's optimiser for files we serve; plain passthrough for anything else. */
export function CmsImage({
  src,
  alt,
  sizes = '(max-width: 768px) 100vw, 50vw',
  className = '',
  priority = false,
}: {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={!src.startsWith('/')}
      className={`object-cover ${className}`}
    />
  );
}

export function youtubeId(url: string): string | null {
  const match = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(url);
  return match?.[1] ?? null;
}

export function CmsVideo({
  src,
  poster,
  title,
  ambient = false,
}: {
  src: string;
  poster?: string;
  title: string;
  /** Muted autoplay loop with no controls, for hero backgrounds. */
  ambient?: boolean;
}) {
  const yt = youtubeId(src);
  if (yt) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${yt}${ambient ? `?autoplay=1&mute=1&loop=1&playlist=${yt}&controls=0` : ''}`}
        title={title}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 size-full border-0"
      />
    );
  }
  return ambient ? (
    <video src={src} poster={poster || undefined} autoPlay muted loop playsInline preload="metadata" aria-label={title} className="absolute inset-0 size-full object-cover" />
  ) : (
    <video src={src} poster={poster || undefined} controls playsInline preload="metadata" aria-label={title} className="absolute inset-0 size-full bg-ink object-cover" />
  );
}

const PATHS: Record<IconName, ReactNode> = {
  shield: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z M9 12l2 2 4-4" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  rupee: <path d="M7 5h10 M7 9h10 M7 5h3a4 4 0 010 8H7l8 7" />,
  globe: <path d="M12 3a9 9 0 100 18 9 9 0 000-18z M3 12h18 M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z" />,
  home: <path d="M4 11l8-7 8 7 M6 9.5V20h12V9.5 M10 20v-5h4v5" />,
  chat: <path d="M4 5h16v11H9l-5 4V5z M8 10h8 M8 13h5" />,
  briefcase: <path d="M4 8h16v11H4z M9 8V5h6v3 M4 13h16" />,
  plane: <path d="M3 13l18-7-5 14-4-6-9-1z M12 14l9-8" />,
  document: <path d="M7 3h7l4 4v14H7z M14 3v4h4 M10 12h5 M10 16h5" />,
  star: <path d="M12 4l2.5 5.2 5.5.8-4 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4-3.9 5.5-.8z" />,
  clock: <path d="M12 3a9 9 0 100 18 9 9 0 000-18z M12 7v5l3.5 2" />,
  users: <path d="M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7z M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M16 4.5a3.5 3.5 0 010 6.5 M18 14c2 .8 3 2.8 3 6" />,
  phone: <path d="M8 3h8v18H8z M11 18h2" />,
  heart: <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z" />,
  graduation: <path d="M2 9l10-5 10 5-10 5-10-5z M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />,
  map: <path d="M12 21s-6-6-6-11a6 6 0 0112 0c0 5-6 11-6 11z M12 12a2 2 0 100-4 2 2 0 000 4z" />,
};

export function Icon({ name, className = 'size-6' }: { name: string; className?: string }) {
  const path = PATHS[name as IconName] ?? PATHS.check;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {path}
    </svg>
  );
}
