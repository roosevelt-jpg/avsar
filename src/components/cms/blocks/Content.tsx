import { items, link, num, str, strList, type BlockData } from '@/lib/cms/blocks';
import { scenePhoto } from '@/lib/cms/scenes';
import type { Locale } from '@/lib/i18n';
import { ContactForm } from '@/components/contact/ContactForm';
import { Markdown } from '../Markdown';
import { TypeOnView } from '../TypeOnView';
import { InteractiveCard } from '../InteractiveCard';
import { CmsButton, CmsImage, CmsTextLink, Icon, Section, SectionHeading } from '../primitives';

type Props = { data: BlockData; locale: Locale };

export function TrustBarBlock({ data }: Props) {
  const list = items(data, 'items');
  if (!list.length) return null;
  return (
    <section className="px-[clamp(20px,4cqi,56px)] pb-[clamp(8px,2cqi,20px)]">
      <ul className="mx-auto m-0 grid w-full max-w-[1200px] list-none grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3 p-0">
        {list.map((item, index) => (
          /* Subgrid rows: a title that wraps in one item pushes every body
             in that row down together, so they stay level in any language. */
          <li key={index} className={`blue-card shade-${index % 4} motion-tilt motion-reveal row-span-3 grid grid-rows-subgrid gap-y-3 p-6`}>
            <span className="icon-gem grid size-12 place-items-center">
              <Icon name={str(item, 'icon')} className="size-6" />
            </span>
            <p className="m-0 self-end text-[16px] font-semibold">{str(item, 'title')}</p>
            <p className="m-0 text-[14px] leading-[1.5] text-ink-2">{str(item, 'body')}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StatsBlock({ data }: Props) {
  const list = items(data, 'items');
  return (
    <Section tone="ink">
      <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} dark />
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-px overflow-hidden rounded-[22px] border border-dark-line bg-dark-line p-0">
        {list.map((item, index) => (
          <li key={index} className="bg-night p-[clamp(20px,3cqi,32px)]">
            <p className="m-0 text-[clamp(44px,6cqi,72px)] font-semibold leading-none tracking-[-0.04em] text-on-night">{str(item, 'value')}</p>
            <p className="m-0 mt-3 text-[16px] text-on-night">{str(item, 'label')}</p>
            {str(item, 'note') ? <p className="m-0 mt-1 text-[14px] text-dark-muted">{str(item, 'note')}</p> : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function StepsBlock({ data }: Props) {
  const list = items(data, 'items');
  if (str(data, 'layout') === 'timeline') return <StepsTimeline data={data} />;
  return (
    <Section id="how">
      <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} intro={str(data, 'intro')} />
      <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 p-0">
        {list.map((item, index) => (
          <li key={index} className="blue-card group flex flex-col overflow-hidden">
            {str(item, 'image') ? (
              <div className="relative aspect-[16/10] overflow-hidden bg-canvas">
                <CmsImage src={scenePhoto(str(item, 'image'), index)} alt="" sizes="(max-width: 768px) 100vw, 33vw" className="transition-transform duration-500 group-hover:scale-[1.03]" />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="icon-gem grid size-9 place-items-center font-mono text-[13px] font-semibold">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {str(item, 'meta') ? (
                  <span className="rounded-full bg-accent-tint px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-accent-deep">
                    {str(item, 'meta')}
                  </span>
                ) : null}
              </div>
              <h3 className="m-0 text-[19px] font-semibold tracking-[-0.01em]">{str(item, 'title').replace(/^\d+\.\s*/, '')}</h3>
              <p className="m-0 mt-2 text-[15px] leading-[1.6] text-ink-2">{str(item, 'body')}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/**
 * The same steps as a horizontal timeline: a rule with a dot per step, the
 * small label above each title. Pictures are left out on purpose, so six
 * steps fit on one screen of a laptop and read as a sequence, not a gallery.
 */
function StepsTimeline({ data }: { data: BlockData }) {
  const list = items(data, 'items');
  return (
    <Section id="how" tone="surface">
      <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} intro={str(data, 'intro')} />
      <ol className="m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((item, index) => {
          const meta = str(item, 'meta');
          return (
            /* Three subgrid rows (route line, label and title, text) shared
               across the whole row of cards, so the paragraphs start level
               even when a translated title wraps onto three lines. */
            <li key={index} className="motion-reveal row-span-3 grid grid-rows-subgrid gap-y-0">
              <InteractiveCard className="blue-card group row-span-3 grid grid-rows-subgrid gap-y-0 overflow-hidden">
                {str(item, 'image') ? (
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <CmsImage src={scenePhoto(str(item, 'image'), index)} alt="" sizes="(max-width: 768px) 100vw, 33vw" className="transition-transform duration-500 group-hover:scale-[1.04]" />
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#1c1410]/70 to-transparent" />
                    <span className="absolute start-4 bottom-3 font-mono text-[12px] font-semibold tracking-[0.14em] text-white">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                ) : (
                  <span className="icon-gem m-6 grid size-9 w-fit place-items-center font-mono text-[13px]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                )}

                <div className="relative px-6">
                  {meta ? (
                    <span className="inline-flex rounded-full bg-tint-clay px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
                      {meta}
                    </span>
                  ) : null}
                  <h3 className="m-0 mt-4 max-w-[80%] text-[20px] font-semibold tracking-[-0.015em]">
                    {str(item, 'title').replace(/^\d+\.\s*/, '')}
                  </h3>
                </div>
                <p className="relative m-0 mt-2 px-6 pb-6 text-[15px] leading-[1.6] text-ink-2">{str(item, 'body')}</p>
              </InteractiveCard>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

export function FeaturesBlock({ data, locale }: Props) {
  const list = items(data, 'items');
  const columns = num(data, 'columns', 3);
  const tiles = str(data, 'style') === 'tiles';
  const grid =
    columns === 2 ? 'sm:grid-cols-2' : columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3';
  return (
    <Section tone={tiles ? 'paper' : 'surface'}>
      <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} intro={str(data, 'intro')} />
      <ul className={`m-0 grid list-none grid-cols-1 gap-4 p-0 ${grid}`}>
        {list.map((item, index) => {
          const cardLink = link(item, 'link');
          const image = str(item, 'image');
          return (
            <li
              key={index}
              /* Four subgrid rows (picture, title, text, link), so titles and
                 links line up across a row whatever the text length. */
              className={`group motion-reveal row-span-4 grid grid-rows-subgrid gap-y-0 ${
                tiles
                  ? `blue-card motion-tilt p-7`
                  : 'blue-card t-colors p-6 hover:border-accent'
              }`}
            >
              {image ? (
                <div className="anamorphic-mini relative mb-2 aspect-[16/10] overflow-hidden">
                  <CmsImage src={scenePhoto(image, index)} alt="" sizes="(max-width: 768px) 100vw, 33vw" />
                  <span className="icon-gem absolute start-3 top-3 grid size-10 place-items-center">
                    <Icon name={str(item, 'icon')} className="size-5" />
                  </span>
                </div>
              ) : (
                <span className="icon-gem grid size-11 place-items-center">
                  <Icon name={str(item, 'icon')} className="size-5" />
                </span>
              )}
              <h3 className={`m-0 font-semibold tracking-[-0.01em] ${tiles ? (image ? 'mt-5 text-[22px]' : 'mt-8 text-[22px]') : 'mt-5 text-[18px]'}`}>{str(item, 'title')}</h3>
              {data.typing === true ? (
                <TypeOnView text={str(item, 'body')} className="m-0 mt-2 flex-1 text-[15px] leading-[1.6] text-ink-2" />
              ) : (
                <p className="m-0 mt-2 flex-1 text-[15px] leading-[1.6] text-ink-2">{str(item, 'body')}</p>
              )}
              {cardLink ? (
                <div className="mt-5">
                  <CmsTextLink href={cardLink.href} label={cardLink.label} locale={locale} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export function SplitBlock({ data, locale }: Props) {
  const image = str(data, 'image');
  const left = str(data, 'imageSide') === 'left';
  const bullets = strList(data, 'bullets');
  const cta = link(data, 'cta');
  return (
    <Section>
      <div className={`grid grid-cols-1 items-center gap-[clamp(32px,5cqi,72px)] ${image ? 'lg:grid-cols-2' : ''}`}>
        <div className={left ? 'lg:order-2' : ''}>
          <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} />
          {str(data, 'body') ? <Markdown text={str(data, 'body')} locale={locale} className="-mt-4 text-[17px] text-ink-2" /> : null}
          {bullets.length > 0 && (
            <ul className="m-0 mt-6 flex list-none flex-col gap-3 p-0">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3 text-[16px] leading-[1.5]">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                    <Icon name="check" className="size-4" />
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
          )}
          {cta && (
            <div className="mt-8">
              <CmsTextLink href={cta.href} label={cta.label} locale={locale} />
            </div>
          )}
        </div>
        {image ? (
          <div className={`anamorphic-stage ${left ? 'lg:order-1' : ''}`}>
            <div className="anamorphic-frame relative aspect-[4/3] overflow-hidden bg-canvas">
              <CmsImage src={scenePhoto(image, 1)} alt={str(data, 'imageAlt')} />
            </div>
          </div>
        ) : null}
      </div>
    </Section>
  );
}

/* One closing band on every page: navy, with the saffron action. The editor
   no longer offers a style, so pages cannot drift back to a grey box. */
export function CtaBlock({ data, locale }: Props) {
  const primary = link(data, 'primary');
  const secondary = link(data, 'secondary');
  return (
    <section className="px-[clamp(20px,4cqi,56px)] py-[clamp(24px,4cqi,48px)]">
      <div className="relative mx-auto w-full max-w-[1200px] overflow-hidden rounded-[36px] bg-night px-[clamp(24px,5cqi,72px)] py-[clamp(40px,6cqi,80px)] text-on-night">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(42% 80% at 100% 0%, color-mix(in oklab, #e8a23a 55%, transparent), transparent 70%), radial-gradient(36% 70% at 0% 100%, color-mix(in oklab, #0f8f78 45%, transparent), transparent 70%)',
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-[640px]">
            <h2 className="m-0 text-balance text-[clamp(28px,3.8cqi,46px)] font-semibold leading-[1.06] tracking-[-0.03em]">{str(data, 'title')}</h2>
            {str(data, 'body') ? <p className="m-0 mt-4 text-[17px] leading-[1.6] text-dark-muted-2">{str(data, 'body')}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            {primary && <CmsButton href={primary.href} label={primary.label} locale={locale} variant="primary" size="lg" />}
            {secondary && <CmsTextLink href={secondary.href} label={secondary.label} locale={locale} dark />}
          </div>
        </div>
      </div>
    </section>
  );
}

export function RichTextBlock({ data, locale }: Props) {
  const narrow = str(data, 'width') !== 'wide';
  return (
    <Section>
      <div className={narrow ? 'mx-auto max-w-[720px]' : ''}>
        <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} />
        <Markdown text={str(data, 'body')} locale={locale} className="text-[17px] text-ink-2" />
      </div>
    </Section>
  );
}

/** A whole page of text with the page's h1: the legal pages are made of this. */
export function DocumentBlock({ data, locale }: Props) {
  return (
    <section className="px-[clamp(20px,4cqi,56px)] py-[clamp(32px,5cqi,64px)]">
      <article className="mx-auto max-w-[760px] [&_h2]:mt-8 [&_h3]:mt-6">
        {str(data, 'title') ? (
          <h1 className="m-0 mb-2 text-[clamp(30px,4.4cqi,52px)] font-semibold leading-[1.08] tracking-[-0.035em]">{str(data, 'title')}</h1>
        ) : null}
        {str(data, 'updated') ? <p className="m-0 mb-6 text-[14px] text-muted">Last updated {str(data, 'updated')}</p> : str(data, 'title') ? <div className="mb-6" /> : null}
        <Markdown text={str(data, 'body')} locale={locale} className="text-[16px] leading-[1.65] text-ink-2" />
      </article>
    </section>
  );
}

export function ContactFormBlock({ data, locale }: Props) {
  return (
    <section className="px-[clamp(20px,4cqi,56px)] pt-[clamp(32px,5cqi,64px)]">
      <div className="mx-auto max-w-[760px]">
        {str(data, 'title') ? (
          <h1 className="m-0 mb-4 text-[clamp(30px,4.4cqi,52px)] font-semibold leading-[1.08] tracking-[-0.035em]">{str(data, 'title')}</h1>
        ) : null}
        {str(data, 'intro') ? <p className="m-0 mb-6 text-[16px] leading-[1.65] text-ink-2">{str(data, 'intro')}</p> : null}
        <ContactForm locale={locale} />
      </div>
    </section>
  );
}

export function NoticeBlock({ data, locale }: Props) {
  const tone = str(data, 'tone');
  const styles =
    tone === 'warning'
      ? { box: 'border-accent/40 bg-accent-tint', icon: 'shield', iconClass: 'bg-accent text-white' }
      : tone === 'success'
        ? { box: 'border-success/40 bg-[oklch(0.96_0.03_150)]', icon: 'check', iconClass: 'bg-success text-white' }
        : { box: 'border-line-strong bg-surface', icon: 'document', iconClass: 'bg-ink text-paper' };
  return (
    <section className="px-[clamp(20px,4cqi,56px)] py-[clamp(16px,3cqi,32px)]">
      <div className={`mx-auto flex w-full max-w-[1200px] gap-4 rounded-[22px] border p-[clamp(20px,3cqi,32px)] ${styles.box}`} role={tone === 'warning' ? 'note' : undefined}>
        <span className={`grid size-10 shrink-0 place-items-center rounded-full ${styles.iconClass}`}>
          <Icon name={styles.icon} className="size-5" />
        </span>
        <div>
          {str(data, 'title') ? <h2 className="m-0 text-[19px] font-semibold tracking-[-0.01em]">{str(data, 'title')}</h2> : null}
          <Markdown text={str(data, 'body')} locale={locale} className="mt-2 text-[16px] text-ink-2" />
        </div>
      </div>
    </section>
  );
}
