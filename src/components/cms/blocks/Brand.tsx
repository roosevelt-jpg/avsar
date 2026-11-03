import Image from 'next/image';
import Link from 'next/link';
import { items, link, str, type BlockData } from '@/lib/cms/blocks';
import type { Locale } from '@/lib/i18n';
import { CmsButton, Icon, Section } from '../primitives';

type Props = { data: BlockData; locale: Locale };

/**
 * Publication logos. Renders nothing until staff add at least one real logo —
 * invented press mentions are never shown as defaults.
 */
export function PressBarBlock({ data }: Props) {
  const list = items(data, 'items').filter((item) => str(item, 'logo') && str(item, 'name'));
  if (!list.length) return null;
  const eyebrow = str(data, 'eyebrow');
  return (
    <section className="border-y border-line bg-[#f5f6f8] px-[clamp(20px,4cqi,56px)] py-5">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-4 sm:flex-row sm:gap-8">
        {eyebrow ? (
          <p className="m-0 shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{eyebrow}</p>
        ) : null}
        <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-x-8 gap-y-4 p-0 sm:justify-start">
          {list.map((item, index) => {
            const href = str(item, 'href');
            const logo = (
              <Image
                src={str(item, 'logo')}
                alt={str(item, 'name')}
                width={120}
                height={36}
                className="h-7 w-auto max-w-[120px] object-contain opacity-70 grayscale"
              />
            );
            return (
              <li key={index}>
                {href ? (
                  <Link href={href} className="inline-flex no-underline" target={/^https?:/i.test(href) ? '_blank' : undefined} rel={/^https?:/i.test(href) ? 'noopener noreferrer' : undefined}>
                    {logo}
                  </Link>
                ) : (
                  logo
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

  return (
    <Section className="!bg-white !py-[clamp(40px,6cqi,72px)]">
      <div className="overflow-hidden rounded-[22px] bg-[#0a088f] text-white shadow-[0_18px_40px_rgba(10,8,143,0.18)]">
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
