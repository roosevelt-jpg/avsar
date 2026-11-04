import Image from 'next/image';
import Link from 'next/link';
import { items, link, str, type BlockData } from '@/lib/cms/blocks';
import { localHref } from '@/lib/cms/settings';
import type { Locale } from '@/lib/i18n';
import { CmsButton, Icon, Section } from '../primitives';

type Props = { data: BlockData; locale: Locale };

/**
 * Publication logos / names for the home mockup press strip.
 * Logo images when present; otherwise the publication name as shell type.
 */
export function PressBarBlock({ data }: Props) {
  const list = items(data, 'items').filter((item) => str(item, 'name'));
  if (!list.length) return null;
  const eyebrow = str(data, 'eyebrow');
  return (
    <section className="border-y border-[#e6e0d6] bg-[#f3f1ec] px-[clamp(20px,4cqi,56px)] py-6">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-4 sm:flex-row sm:gap-10">
        {eyebrow ? (
          <p className="m-0 shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{eyebrow}</p>
        ) : null}
        <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-x-8 gap-y-4 p-0 sm:justify-start">
          {list.map((item, index) => {
            const href = str(item, 'href');
            const name = str(item, 'name');
            const logoSrc = str(item, 'logo');
            const mark = logoSrc ? (
              <Image
                src={logoSrc}
                alt={name}
                width={120}
                height={36}
                className="h-7 w-auto max-w-[120px] object-contain opacity-70 grayscale"
              />
            ) : (
              <span className="text-[13px] font-semibold tracking-[0.04em] text-[#142438]/55">{name}</span>
            );
            return (
              <li key={index}>
                {href ? (
                  <Link
                    href={href}
                    className="inline-flex no-underline"
                    target={/^https?:/i.test(href) ? '_blank' : undefined}
                    rel={/^https?:/i.test(href) ? 'noopener noreferrer' : undefined}
                  >
                    {mark}
                  </Link>
                ) : (
                  mark
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** Navy employer call-out with photograph, bullets and a hire button. */
export function EmployerBandBlock({ data, locale }: Props) {
  const cta = link(data, 'cta');
  const bullets = items(data, 'bullets').filter((item) => str(item, 'text'));
  const image = str(data, 'image');
  const title = str(data, 'title');
  if (!title && !cta) return null;

  /* Home mockup: copy | handshake photo | bullets + Hire Talent. */
  if (str(data, 'layout') === 'home') {
    return (
      <Section className="!bg-[#f7f4ef] !py-[clamp(40px,6cqi,72px)]">
        <div className="overflow-hidden rounded-[22px] bg-[#142438] text-white shadow-[0_18px_40px_rgba(20,36,56,0.18)]">
          <div className="grid grid-cols-1 items-stretch lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)_minmax(0,0.95fr)]">
            <div className="flex flex-col justify-center gap-4 px-[clamp(22px,3cqi,40px)] py-[clamp(28px,4cqi,44px)]">
              {str(data, 'eyebrow') ? (
                <p className="m-0 inline-flex w-fit rounded-[6px] border border-[var(--color-gold)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-gold)]">
                  {str(data, 'eyebrow')}
                </p>
              ) : null}
              {title ? (
                <h2 className="display-serif m-0 text-balance text-[clamp(26px,3.2cqi,38px)] leading-[1.12] text-white">{title}</h2>
              ) : null}
              {str(data, 'body') ? (
                <p className="m-0 max-w-[36ch] text-[15px] leading-[1.55] text-white/85">{str(data, 'body')}</p>
              ) : null}
            </div>
            {image ? (
              <div className="relative min-h-[220px] bg-[#0d1a28] lg:min-h-full">
                <Image src={image} alt={str(data, 'imageAlt') || title} fill sizes="(max-width: 1024px) 100vw, 32vw" className="object-cover" />
              </div>
            ) : null}
            <div className="flex flex-col justify-center gap-5 border-t border-white/15 px-[clamp(22px,3cqi,40px)] py-[clamp(28px,4cqi,44px)] lg:border-s lg:border-t-0">
              {bullets.length > 0 ? (
                <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
                  {bullets.map((bullet, index) => (
                    <li key={index} className="flex items-start gap-3 text-[15px] leading-[1.45] text-white/92">
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center text-[var(--color-gold)]">
                        <Icon name={str(bullet, 'icon') || 'check'} className="size-4" />
                      </span>
                      <span>{str(bullet, 'text')}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {cta ? (
                <Link
                  href={localHref(locale, cta.href)}
                  className="t-colors inline-flex w-fit items-center gap-2 rounded-[10px] bg-[#b28a49] px-5 py-3 text-[14px] font-semibold text-[#142438] no-underline hover:bg-[#c49a58]"
                >
                  {cta.label}
                  <span aria-hidden>→</span>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </Section>
    );
  }

  /* About mockup: tram photo | checklist | CTA column inside a navy rounded band. */
  if (str(data, 'layout') === 'why') {
    return (
      <Section className="!bg-white !py-[clamp(40px,6cqi,80px)]">
        <div className="overflow-hidden rounded-[22px] bg-[#142438] text-white shadow-[0_18px_40px_rgba(20,36,56,0.18)]">
          <div className="grid grid-cols-1 items-stretch lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.2fr)_minmax(0,0.85fr)]">
            {image ? (
              <div className="relative min-h-[220px] bg-[#0d1a28] lg:min-h-full">
                <Image src={image} alt={str(data, 'imageAlt') || title} fill sizes="(max-width: 1024px) 100vw, 30vw" className="object-cover" />
              </div>
            ) : null}
            <div className="flex flex-col justify-center gap-5 px-[clamp(22px,3cqi,40px)] py-[clamp(28px,4cqi,44px)]">
              {title ? (
                <h2 className="display-serif m-0 text-balance text-[clamp(26px,3.2cqi,38px)] leading-[1.12] text-white">{title}</h2>
              ) : null}
              {bullets.length > 0 ? (
                <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
                  {bullets.map((bullet, index) => (
                    <li key={index} className="flex items-start gap-3 text-[15px] leading-[1.45] text-white/92">
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center text-[var(--color-gold)]">
                        <Icon name={str(bullet, 'icon') || 'check'} className="size-4" />
                      </span>
                      <span>{str(bullet, 'text')}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="flex flex-col justify-center gap-4 border-t border-white/15 px-[clamp(22px,3cqi,40px)] py-[clamp(28px,4cqi,44px)] lg:border-s lg:border-t-0">
              {cta ? (
                <Link
                  href={localHref(locale, cta.href)}
                  className="btn-gradient t-colors inline-flex w-fit items-center gap-2 px-5 py-3 text-[14px] font-semibold no-underline"
                >
                  {cta.label}
                  <span aria-hidden>→</span>
                </Link>
              ) : null}
              {str(data, 'body') ? (
                <p className="m-0 max-w-[32ch] text-[14px] leading-[1.55] text-white/75">{str(data, 'body')}</p>
              ) : null}
            </div>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section className="!bg-white !py-[clamp(40px,6cqi,72px)]">
      <div className="overflow-hidden rounded-[22px] bg-[#142438] text-white shadow-[0_18px_40px_rgba(20,36,56,0.18)]">
        <div className="grid grid-cols-1 items-stretch lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          {image ? (
            <div className="relative min-h-[220px] bg-[#1614a8] lg:min-h-full">
              <Image src={image} alt={str(data, 'imageAlt') || title} fill sizes="(max-width: 1024px) 100vw, 46vw" className="object-cover" />
            </div>
          ) : null}
          <div className="flex flex-col justify-center gap-5 px-[clamp(22px,3.5cqi,48px)] py-[clamp(28px,4cqi,44px)]">
            {str(data, 'eyebrow') ? (
              <p className="m-0 inline-flex w-fit rounded-full border border-[var(--color-gold)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-gold)]">
                {str(data, 'eyebrow')}
              </p>
            ) : null}
            {title ? <h2 className="display-serif m-0 text-balance text-[clamp(28px,3.6cqi,42px)] leading-[1.1] text-white">{title}</h2> : null}
            {str(data, 'body') ? <p className="m-0 max-w-[48ch] text-[15px] leading-[1.55] text-white/85">{str(data, 'body')}</p> : null}
            {bullets.length > 0 ? (
              <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-3">
                {bullets.map((bullet, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-[14px] leading-[1.4] text-white">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-[var(--color-gold)]/50 text-[var(--color-gold)]">
                      <Icon name={str(bullet, 'icon') || 'check'} className="size-4" />
                    </span>
                    <span className="pt-1.5">{str(bullet, 'text')}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {cta ? (
              <div className="pt-1">
                <CmsButton href={cta.href} label={cta.label} locale={locale} variant="primary" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Section>
  );
}
