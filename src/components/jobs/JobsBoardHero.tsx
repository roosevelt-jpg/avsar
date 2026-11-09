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
      <em className="accent-italic" style={{ fontStyle: 'italic' }}>
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
    /*
      z-20 keeps the floating search above the listing band. Do not use
      overflow-hidden here — it would clip the card where it overlaps the next section.
    */
    <section aria-label="Job opportunities" className="relative z-20 bg-[#142438] text-white">
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <MarketingSlideshow slides={pack} className="absolute inset-0 size-full" sizes="100vw" />
        <div className="absolute inset-0 bg-[#142438]/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#142438]/92 via-[#142438]/72 to-[#142438]/25" />
      </div>

      <div className="relative mx-auto w-full max-w-[1200px] px-[clamp(20px,4cqi,56px)] pb-0 pt-[clamp(48px,8cqi,88px)]">
        <div className="max-w-[640px] pb-10">
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
                <li key={item.label} className="inline-flex items-center gap-2.5 text-[13px] font-medium text-white/95">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--color-gold)]/70 text-[var(--color-gold)]">
                    <Icon name={item.icon} className="size-3.5" />
                  </span>
                  <span>
                    <span className="font-semibold">{item.value}</span> {item.label}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* Search floats over the ivory listing band — mockup Job Opportunities page. */}
        <div className="relative z-10 -mb-9 sm:-mb-11">{search}</div>
      </div>
    </section>
  );
}
