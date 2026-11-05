import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { IconName } from '@/lib/cms/blocks';
import { localHref } from '@/lib/cms/settings';
import type { Locale } from '@/lib/i18n';
import { youtubeId } from '@/lib/cms/video';
import { VideoPlayer } from './VideoPlayer';

/**
 * Shared pieces for CMS blocks: the section frame, headings, buttons, icons
 * and media. Server components; the only client JavaScript is the film
 * player, which a page loads only if it shows a film.
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
    ink: 'bg-night text-on-night',
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
    /* min-w-0 and break-words: in a flex or grid row the heading would
       otherwise be as wide as its longest word, and some Tamil and Malayalam
       words are wider than a phone. */
    <div className={`mb-[clamp(28px,4cqi,48px)] min-w-0 break-words ${align === 'center' ? 'mx-auto text-center' : ''} max-w-[760px]`}>
      {eyebrow ? (
        <p className="m-0 mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#b28a49]">
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <h2 className="m-0 text-balance text-[clamp(28px,3.4cqi,42px)] font-semibold leading-[1.15] tracking-[-0.02em]">{title}</h2>
      ) : null}
      {intro ? (
        <p className={`mt-4 mb-0 text-[clamp(16px,1.5cqi,18px)] leading-[1.6] ${dark ? 'text-dark-muted-2' : 'text-ink-2'}`}>{intro}</p>
      ) : null}
    </div>
  );
}

const BUTTON = {
  /* Mockup CTAs: gold fill primary, outline secondary on dark heroes. */
  primary: 'btn-gradient',
  dark: 'border border-white/55 bg-transparent text-white hover:bg-white/10',
  light: 'bg-white text-[#142438] border-[#142438]/20 hover:border-[#142438]',
  ghostDark: 'bg-transparent text-white border-white/55 hover:bg-white/10',
  white: 'bg-white text-[#142438] border-transparent hover:bg-[#f4f5f7]',
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
  size?: 'sm' | 'md' | 'lg';
}) {
  if (!href || !label) return null;
  const className = `t-colors inline-flex items-center justify-center gap-2 rounded-[8px] border font-semibold normal-case tracking-normal no-underline ${
    size === 'lg' ? 'px-6 py-3.5 text-[16px]' : size === 'sm' ? 'px-3.5 py-2 text-[13px]' : 'px-5 py-3 text-[15px]'
  } ${BUTTON[variant]}`;
  const resolved = localHref(locale, href);
  const external = /^https?:/i.test(resolved);
  const content = (
    <>
      {label}
      {variant === 'primary' ? <span aria-hidden>→</span> : null}
    </>
  );
  if (external || resolved.startsWith('mailto:') || resolved.startsWith('tel:')) {
    return (
      <a href={resolved} className={className} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
        {content}
      </a>
    );
  }
  return (
    <Link href={resolved} className={className}>
      {content}
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

/**
 * An uploaded film or a YouTube link. YouTube always gets the click-to-load
 * player, even as a hero background: a muted autoplaying YouTube frame would
 * load its whole player before the visitor has read the headline.
 */
export function CmsVideo({
  src,
  poster,
  title,
  ambient = false,
}: {
  src: string;
  poster?: string;
  title: string;
  /** Muted autoplay loop with no controls, for hero backgrounds (uploaded films only). */
  ambient?: boolean;
}) {
  if (ambient && !youtubeId(src)) {
    return <video src={src} poster={poster || undefined} autoPlay muted loop playsInline preload="metadata" aria-label={title} className="absolute inset-0 size-full object-cover" />;
  }
  return <VideoPlayer src={src} poster={poster} title={title} />;
}

/**
 * A secondary action. Deliberately a link and not a second button: every
 * section has one obvious thing to press, and the alternatives sit beside it
 * quietly.
 */
export function CmsTextLink({ href, label, locale, dark = false }: { href: string; label: string; locale: Locale; dark?: boolean }) {
  if (!href || !label) return null;
  const resolved = localHref(locale, href);
  const external = /^https?:/i.test(resolved);
  const className = `t-colors inline-flex items-center gap-1.5 text-[15px] font-medium underline decoration-1 underline-offset-[5px] ${
    dark ? 'text-on-night decoration-on-night/40 hover:decoration-on-night' : 'text-ink decoration-line-strong hover:text-accent hover:decoration-accent'
  }`;
  const content = (
    <>
      {label}
      <span aria-hidden className="rtl:-scale-x-100">→</span>
    </>
  );
  if (external || resolved.startsWith('mailto:') || resolved.startsWith('tel:')) {
    return (
      <a href={resolved} className={className} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
        {content}
      </a>
    );
  }
  return (
    <Link href={resolved} className={className}>
      {content}
    </Link>
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
  euro: <path d="M17.5 6.5A6.5 6.5 0 007 12a6.5 6.5 0 0010.5 5.5 M4.5 10.5h9 M4.5 13.5h9" />,
  bolt: <path d="M13 2L4 14h7l-1 8 10-14h-7l0-6z" />,
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </>
  ),
  building: <path d="M4 20V6l8-3 8 3v14 M4 20h16 M9 20v-5h6v5 M9 9h1.5 M13.5 9H15 M9 12.5h1.5 M13.5 12.5H15" />,
  headset: <path d="M5 13a7 7 0 0114 0v4a2 2 0 01-2 2h-1v-5h3 M5 14h3v5H6a2 2 0 01-2-2v-1 M12 21h2" />,
  bed: <path d="M3 18V10h18v8 M3 18h18 M3 14h18 M7 10V8a2 2 0 012-2h2a2 2 0 012 2v2" />,
  hardhat: <path d="M4 14h16v2H4z M6 14a6 6 0 0112 0 M12 5v3" />,
  truck: <path d="M3 16V7h11v9 M14 10h4l3 3v3h-7 M6.5 18.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z M17.5 18.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />,
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5 M12 18.5V21 M3 12h2.5 M18.5 12H21 M5.6 5.6l1.8 1.8 M16.6 16.6l1.8 1.8 M18.4 5.6l-1.8 1.8 M7.4 16.6l-1.8 1.8" />
    </>
  ),
  more: (
    <>
      <circle cx="6" cy="12" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.35" fill="currentColor" stroke="none" />
    </>
  ),
};

/** Thin gold-friendly stroke icons matching the mockup line-art style. */
export function Icon({ name, className = 'size-6' }: { name: string; className?: string }) {
  const path = PATHS[name as IconName] ?? PATHS.check;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {path}
    </svg>
  );
}
