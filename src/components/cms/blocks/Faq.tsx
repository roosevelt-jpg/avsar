import { items, str, type BlockData } from '@/lib/cms/blocks';
import type { SiteSettings } from '@/lib/cms/settings';
import { whatsappHref } from '@/lib/cms/settings';
import type { Locale } from '@/lib/i18n';
import { Markdown } from '../Markdown';
import { Icon, Section, SectionHeading } from '../primitives';

/**
 * Native <details>, not a script-driven accordion: it works before hydration,
 * on the slowest phone, with find-in-page, and with a screen reader, for free.
 */
export function FaqBlock({ data, locale }: { data: BlockData; locale: Locale }) {
  const list = items(data, 'items').filter((item) => str(item, 'question'));
  if (!list.length) return null;
  return (
    <Section>
      <div className="grid grid-cols-1 gap-[clamp(24px,4cqi,64px)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} intro={str(data, 'intro')} />
        <div className="flex flex-col gap-2.5">
          {list.map((item, index) => (
            <details key={index} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[16px] font-medium [&::-webkit-details-marker]:hidden">
                {str(item, 'question')}
                <span aria-hidden className="text-[20px] leading-none text-ink transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="pb-5">
                <Markdown text={str(item, 'answer')} locale={locale} className="text-[15px] text-ink-2" />
              </div>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function ContactCardsBlock({ data, locale, settings }: { data: BlockData; locale: Locale; settings: SiteSettings }) {
  void locale;
  const g = settings.general;
  const direct = str(data, 'layout') === 'direct';
  /* Values come from Settings only — never invent numbers to match a mockup. */
  const cards = [
    g.supportPhone && {
      icon: 'phone',
      label: 'Phone',
      detail: 'Portugal office line',
      value: g.supportPhone,
      href: `tel:${g.supportPhone.replace(/\s/g, '')}`,
      ltr: true,
    },
    g.whatsapp && {
      icon: 'chat',
      label: 'WhatsApp',
      detail: 'Message during office hours',
      value: g.whatsapp,
      href: whatsappHref(g.whatsapp),
      ltr: true,
    },
    g.supportEmail && {
      icon: 'document',
      label: 'Email',
      detail: 'We answer within two working days',
      value: g.supportEmail,
      href: `mailto:${g.supportEmail}`,
      ltr: true,
    },
    g.officeAddress && {
      icon: 'map',
      label: 'Address',
      detail: 'Head office',
      value: g.officeAddress.split('\n')[0] || g.officeAddress,
      href: '',
      ltr: false,
    },
  ].filter(Boolean) as { icon: string; label: string; detail: string; value: string; href: string; ltr: boolean }[];

  if (direct) {
    return (
      <section className="bg-[var(--color-ivory,#f7f4ee)] px-[clamp(20px,4cqi,56px)] pb-[clamp(48px,7cqi,80px)] pt-2">
        <div className="mx-auto w-full max-w-[1200px] rounded-[18px] bg-[#142438] px-[clamp(20px,3cqi,40px)] py-[clamp(28px,4cqi,44px)] text-white">
          {str(data, 'title') ? (
            <h2 className="display-serif m-0 text-center text-[clamp(26px,3.2cqi,36px)] font-normal text-white">
              {str(data, 'title')}
            </h2>
          ) : null}
          {str(data, 'intro') ? (
            <p className="mx-auto mt-2 max-w-[52ch] text-center text-[14px] leading-[1.5] text-white/75">{str(data, 'intro')}</p>
          ) : null}
          <ul className="m-0 mt-8 grid list-none grid-cols-1 gap-0 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => {
              const body = (
                <>
                  <span className="grid size-10 place-items-center rounded-full border border-[var(--color-gold)]/50 text-[var(--color-gold)]">
                    <Icon name={card.icon} className="size-5" />
                  </span>
                  <span className="mt-4 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--color-gold)]">
                    {card.label}
                  </span>
                  <span dir={card.ltr ? 'ltr' : undefined} className="mt-2 block text-[15px] font-medium leading-[1.4] text-white">
                    {card.value}
                  </span>
                  <span className="mt-1 block text-[12px] text-white/55">{card.detail}</span>
                </>
              );
              return (
                <li
                  key={card.label}
                  className={`px-0 py-5 sm:px-5 ${index > 0 ? 'lg:border-s lg:border-white/15' : ''} ${
                    index % 2 === 1 ? 'sm:border-s sm:border-white/15 lg:border-s' : ''
                  }`}
                >
                  {card.href ? (
                    <a
                      href={card.href}
                      target={card.href.startsWith('http') ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="t-colors block h-full text-center no-underline hover:opacity-90 sm:text-start"
                    >
                      {body}
                    </a>
                  ) : (
                    <div className="h-full text-center sm:text-start">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
          {g.officeHours ? <p className="m-0 mt-6 text-center text-[13px] text-white/55">{g.officeHours}</p> : null}
        </div>
      </section>
    );
  }

  return (
    <Section tone="surface">
      <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} intro={str(data, 'intro')} />
      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const inner = (
            <>
              <span className="grid size-10 place-items-center rounded-full bg-ink text-paper">
                <Icon name={card.icon} className="size-5" />
              </span>
              <span className="mt-4 block font-mono text-[12px] uppercase tracking-[0.1em] text-muted">{card.label}</span>
              <span dir={card.ltr ? 'ltr' : undefined} className="mt-1 block whitespace-pre-line text-[16px] font-medium leading-[1.45] text-ink">
                {card.value}
              </span>
            </>
          );
          return (
            <li key={card.label}>
              {card.href ? (
                <a href={card.href} target={card.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="t-colors block h-full rounded-[20px] border border-line bg-paper p-5 no-underline hover:border-ink">
                  {inner}
                </a>
              ) : (
                <div className="h-full rounded-[20px] border border-line bg-paper p-5">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
      {g.officeHours ? <p className="m-0 mt-4 text-[14px] text-muted">{g.officeHours}</p> : null}
    </Section>
  );
}
