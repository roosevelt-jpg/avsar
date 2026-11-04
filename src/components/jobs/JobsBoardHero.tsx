'use client';

import type { ReactNode } from 'react';
import { Icon } from '@/components/cms/primitives';
import { MarketingSlideshow } from '@/components/marketing/MarketingSlideshow';

/** Draws one word from the headline in gold italic when accentWord matches. */
function accentTitle(title: string, accentWord: string): ReactNode {
  if (!accentWord || !title) return title;
  const index = title.toLowerCase().indexOf(accentWord.toLowerCase());
  if (index < 0) return title;
  const before = title.slice(0, index);
  const match = title.slice(index, index + accentWord.length);
  const after = title.slice(index + accentWord.length);
  return (
    <>
      {before}
      <em className="accent-italic not-italic" style={{ fontStyle: 'italic', color: '#b28a49' }}>
        {match}
      </em>
      {after}
    </>
  );
}

type Stat = { value: string; label: string; icon: string };

/**
 * Full-bleed jobs board hero matching the Job Opportunities mockup: photograph
 * slideshow behind copy, gold eyebrow, three shell stats, and a floating search slot.
 */
export function JobsBoardHero({
  eyebrow,
  headline,
  accentWord,
  intro,
  imageSrc,
  imageAlt,
  slides,
  stats,
  search,
}: {
  eyebrow: string;
  headline: string;
  accentWord: string;
  intro: string;
  imageSrc: string;
  imageAlt: string;
  slides?: { src: string; alt: string }[];
  stats: Stat[];
  search: ReactNode;
}) {
  const pack =
    slides && slides.length > 0
      ? slides
      : imageSrc
        ? [{ src: imageSrc, alt: imageAlt || headline }]
        : [];

  return (
    <section aria-label="Job opportunities" className="relative isolate overflow-hidden bg-[#142438] text-white">
      <div className="absolute inset-0" aria-hidden>
        <MarketingSlideshow slides={pack} className="absolute inset-0 size-full" sizes="100vw" />
      </div>

      <div className="relative mx-auto w-full max-w-[1200px] px-[clamp(20px,4cqi,56px)] pb-0 pt-[clamp(48px,8cqi,88px)]">
        <div className="hero-copy-legible max-w-[640px] pb-8">
          {eyebrow ? (
            <p className="m-0 inline-flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gold)]">
              <span aria-hidden className="h-px w-7 bg-[var(--color-gold)]" />
              {eyebrow}
            </p>
          ) : null}
          <h1 className="display-serif m-0 mt-4 text-balance text-[clamp(28px,5.2cqi,56px)] font-normal leading-[1.08]">
            {accentTitle(headline, accentWord)}
          </h1>
          {intro ? (
            <p className="m-0 mt-5 max-w-[48ch] text-[clamp(15px,1.6cqi,18px)] leading-[1.55] text-white/90">{intro}</p>
          ) : null}

          {stats.length > 0 ? (
            <ul className="m-0 mt-9 flex list-none flex-wrap gap-x-8 gap-y-4 p-0">
              {stats.map((item) => (
                <li key={item.label} className="flex items-center gap-2.5 text-[13px] font-medium text-white/95">
                  <span className="grid size-9 place-items-center text-[var(--color-gold)]">
                    <Icon name={item.icon} className="size-5" />
                  </span>
                  <span>
                    <span className="font-semibold">{item.value}</span> {item.label}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {search}
      </div>
    </section>
  );
}
