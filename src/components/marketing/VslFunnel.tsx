import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { VideoPlayer } from '@/components/cms/VideoPlayer';
import type { VslSettings } from '@/lib/cms/settings';
import { localePath, type Locale } from '@/lib/i18n';

/**
 * Paid-traffic VSL: one composition, video first, one action — sign up.
 *
 * No site nav or footer. Brand stays the hero signal; the headline supports
 * it. Highlights are plain facts, not testimonials. Sticky bar keeps the CTA
 * in reach after scroll on a phone.
 */
export function VslFunnel({
  locale,
  copy,
  video,
  signupHref,
  homeHref,
  signInHref,
  signInLabel,
}: {
  locale: Locale;
  copy: VslSettings;
  video: { src: string; poster: string; title: string };
  signupHref: string;
  homeHref: string;
  signInHref: string;
  signInLabel: string;
}) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-clip pb-[88px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(55% 50% at 90% 0%, var(--color-tint-sky) 0%, transparent 55%), radial-gradient(45% 45% at 0% 80%, var(--color-canvas) 0%, transparent 55%), radial-gradient(35% 35% at 60% 40%, var(--color-tint-sand) 0%, transparent 70%)',
        }}
      />

      <header className="relative z-10 flex items-center justify-between gap-4 px-[clamp(20px,4cqi,56px)] py-[18px]">
        <Wordmark href={homeHref} />
        <p className="m-0 text-[14px] text-ink-2">
          <Link href={signInHref} className="prose-link">
            {signInLabel}
          </Link>
        </p>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[920px] flex-1 flex-col px-[clamp(16px,3cqi,40px)] pt-2">
        {copy.eyebrow ? (
          <p className="m-0 mb-4 font-mono text-[12px] uppercase tracking-[0.14em] text-muted">{copy.eyebrow}</p>
        ) : null}

        <h1 className="m-0 text-balance text-[clamp(32px,5.2cqi,52px)] font-semibold leading-[1.08] tracking-[-0.035em]">
          {copy.headline}
        </h1>

        <p className="mt-4 mb-0 max-w-[58ch] text-[clamp(16px,1.6cqi,19px)] leading-[1.55] text-ink-2">{copy.subhead}</p>

        {/* Full-bleed player within the content column — the sales letter. */}
        <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-[4px] bg-night shadow-[0_28px_70px_-32px_rgba(27,26,23,0.55)] sm:rounded-[18px]">
          <VideoPlayer src={video.src} poster={video.poster} title={video.title} />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href={signupHref}
            className="t-colors inline-flex cursor-pointer items-center justify-center rounded-[14px] border-0 bg-ink px-6 py-3.5 text-[16px] font-medium text-paper no-underline hover:bg-ink-hover"
          >
            {copy.primaryCtaLabel}
          </Link>
          <Link href={localePath(locale, '/jobs')} className="prose-link text-[15px]">
            {copy.secondaryCtaLabel}
          </Link>
        </div>

        {copy.highlights.length > 0 ? (
          <ul className="m-0 mt-10 flex list-none flex-col gap-3 border-t border-line p-0 pt-8">
            {copy.highlights.map((line) => (
              <li key={line} className="flex items-start gap-3 text-[15px] leading-[1.45] text-ink-2">
                <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                {line}
              </li>
            ))}
          </ul>
        ) : null}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/90 px-[clamp(16px,3cqi,40px)] py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-[920px] items-center justify-between gap-4">
          <p className="m-0 hidden text-[14px] text-ink-2 sm:block">Free profile · free skills test</p>
          <Link
            href={signupHref}
            className="t-colors inline-flex w-full cursor-pointer items-center justify-center rounded-[12px] border-0 bg-ink px-5 py-3 text-[15px] font-medium text-paper no-underline hover:bg-ink-hover sm:w-auto"
          >
            {copy.stickyCtaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
