'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Mono } from '@/components/ui/Mono';
import { POSITION_LQIP, positionImage } from '@/lib/data/position-images';
import { AREAS, POSITIONS, type PositionSlug } from '@/lib/data/positions';
import type { PositionCopy } from '@/lib/data/position-copy';
import { localePath, type Dictionary, type Locale } from '@/lib/i18n';

/**
 * The positions, each opening a description.
 *
 * A grid of twelve photographs with a word under each told a candidate almost
 * nothing: "Logistics" means different work in different countries, and someone
 * deciding whether to spend an evening on an assessment should be able to find
 * out what the job actually is first.
 *
 * Built on the native `<dialog>`, so the focus trap, the Escape key and the
 * backdrop come from the browser rather than from three hundred lines of our
 * own that would be worse.
 */
export function PositionGrid({
  locale,
  t,
  copy,
}: {
  locale: Locale;
  t: Dictionary;
  copy: Record<PositionSlug, PositionCopy>;
}) {
  const [open, setOpen] = useState<PositionSlug | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const close = useCallback(() => {
    dialog.current?.close();
    setOpen(null);
  }, []);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  const active = open ? POSITIONS.find((p) => p.slug === open) : null;
  const text = open ? copy[open] : null;

  return (
    <>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 p-0">
        {POSITIONS.map((position, index) => (
          <li key={position.slug}>
            <button
              type="button"
              onClick={() => setOpen(position.slug)}
              aria-haspopup="dialog"
              className="group block w-full cursor-pointer border-0 bg-transparent p-0 text-left"
            >
              <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-[16px]">
                <Image
                  src={positionImage(position.slug, 840)}
                  alt=""
                  fill
                  sizes="(max-width: 700px) 50vw, 240px"
                  placeholder="blur"
                  blurDataURL={POSITION_LQIP[position.slug]}
                  /* A slow push in on hover. The photograph moves, the frame
                     does not, so the grid stays still while one tile answers. */
                  className="object-cover transition-transform duration-[600ms] ease-out motion-safe:group-hover:scale-[1.06]"
                />
              </span>
              <span className="mt-2.5 flex items-baseline justify-between gap-2">
                <span className="text-[16px] font-medium">
                  {t.sectors[index] ?? position.label}
                </span>
                <Mono className="text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  OPEN
                </Mono>
              </span>
              <span className="mt-1 block text-[13.5px] leading-[1.5] text-muted">
                {copy[position.slug].summary}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        /* A click on the backdrop lands on the dialog element itself, so this
           closes only when the press started outside the panel. Without the
           check, dragging a selection out of the panel closes it. */
        onMouseDown={(event) => {
          if (event.target === dialog.current) close();
        }}
        className="m-auto w-[min(560px,calc(100vw-32px))] rounded-[20px] border border-line bg-surface p-0 text-ink backdrop:bg-ink/55 backdrop:backdrop-blur-[2px]"
      >
        {active && text && (
          <div>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-[19px]">
              <Image
                src={positionImage(active.slug, 840)}
                alt=""
                fill
                sizes="560px"
                placeholder="blur"
                blurDataURL={POSITION_LQIP[active.slug]}
                className="object-cover"
              />
            </div>

            <div className="p-[clamp(20px,4cqi,28px)]">
              {/* The area, not the section title: it tells the reader where this
                  job sits among the others rather than repeating the heading. */}
              <Mono className="text-muted">
                {AREAS.find((area) => area.slug === active.area)?.label ?? ''}
              </Mono>
              <h3 className="mt-2 mb-2.5 text-[22px] font-semibold leading-[1.2]">{active.label}</h3>
              <p className="m-0 text-[15px] leading-[1.6] text-ink-2">{text.detail}</p>

              <Mono className="mt-6 block text-muted">{t.positionLooksFor}</Mono>
              <ul className="m-0 mt-2.5 flex list-none flex-wrap gap-2 p-0">
                {text.looksFor.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-line bg-surface-subtle px-3 py-1.5 text-[13px] text-ink-2"
                  >
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href={localePath(locale, `/signup?position=${active.slug}`)}
                  className="t-colors rounded-[12px] bg-ink px-5 py-3 text-[15px] font-medium text-paper no-underline hover:bg-ink-hover"
                >
                  {t.positionApply}
                </Link>
                <button
                  type="button"
                  onClick={close}
                  className="t-colors cursor-pointer rounded-[12px] border border-line-strong bg-surface px-5 py-3 text-[15px] hover:border-ink"
                >
                  {t.positionClose}
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
