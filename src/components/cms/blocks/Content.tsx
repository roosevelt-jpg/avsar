import Link from 'next/link';
import { items, link, num, str, strList, type BlockData } from '@/lib/cms/blocks';
import { scenePhoto, SELECTED_FRAMES, stepPhoto } from '@/lib/cms/scenes';
import { localHref } from '@/lib/cms/settings';
import type { Locale } from '@/lib/i18n';
import { ContactForm } from '@/components/contact/ContactForm';
import { Markdown } from '../Markdown';
import { TypeOnView } from '../TypeOnView';
import { FrameCycle } from '../FrameCycle';
import { CmsButton, CmsImage, CmsTextLink, Icon, Section, SectionHeading } from '../primitives';

type Props = { data: BlockData; locale: Locale };

export function TrustBarBlock({ data }: Props) {
  const list = items(data, 'items');
  if (!list.length) return null;
  return (
    <section className="px-[clamp(20px,4cqi,56px)]">
      <ul className="mx-auto m-0 grid w-full max-w-[1200px] list-none grid-cols-1 border-t border-line p-0 lg:grid-cols-4">
        {list.map((item, index) => (
          <li key={index} className="border-b border-line py-6 lg:border-b-0 lg:border-s lg:px-6 lg:py-8 lg:first:border-s-0">
            <Icon name={str(item, 'icon')} className="size-5 text-ink" />
            <p className="m-0 mt-4 text-[16px] font-semibold">{str(item, 'title')}</p>
            <p className="m-0 mt-2 text-[14px] leading-[1.5] text-ink-2">{str(item, 'body')}</p>
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
      <ol className="m-0 flex list-none flex-col border-t border-line p-0">
        {list.map((item, index) => (
          <li key={index} className="grid grid-cols-1 items-center gap-6 border-b border-line py-8 md:grid-cols-[minmax(0,1fr)_minmax(200px,280px)] md:gap-12">
            <div>
              <p className="m-0 font-mono text-[12px] tracking-[0.16em] text-[#c96a4b]">{String(index + 1).padStart(2, '0')}</p>
              <h3 className="m-0 mt-3 text-[22px] font-semibold tracking-[-0.02em]">{str(item, 'title').replace(/^\d+\.\s*/, '')}</h3>
              <p className="m-0 mt-2 max-w-[52ch] text-[16px] leading-[1.6] text-ink-2">{str(item, 'body')}</p>
              {str(item, 'meta') ? <p className="m-0 mt-3 text-[13px] text-muted">{str(item, 'meta')}</p> : null}
            </div>
            <div className={`photo-card relative aspect-[16/10] bg-canvas ${index % 2 === 1 ? 'photo-card-alt' : ''}`}>
              <CmsImage src={stepPhoto(str(item, 'image'), index)} alt="" sizes="(max-width: 768px) 100vw, 280px" />
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/**
 * Two columns, a round photo, and a dotted rule between cells. The photo,
 * title, sentence and small label all still come from the step in the CMS.
 * The band is solid white so the map behind the page does not cut through
 * the rules.
 */
function StepsTimeline({ data }: { data: BlockData }) {
  const list = items(data, 'items');
  return (
    <Section id="how" className="!bg-white">
      <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} intro={str(data, 'intro')} />
      <ol className="m-0 grid list-none grid-cols-1 p-0 md:grid-cols-2">
        {list.map((item, index) => {
          const meta = str(item, 'meta');
          const photo = stepPhoto(str(item, 'image'), index);
          const secondColumn = index % 2 === 1;
          return (
            <li
              key={index}
              className={`flex items-start gap-5 py-8 md:gap-7 md:py-10 ${
                index > 0 ? 'border-t border-dotted border-[#0a088f]/25 md:border-t-0' : ''
              } ${index >= 2 ? 'md:border-t md:border-dotted md:border-[#0a088f]/25' : ''} ${
                secondColumn ? 'md:border-s md:border-dotted md:border-[#0a088f]/25 md:ps-10' : 'md:pe-10'
              }`}
            >
              {photo ? (
                <div className="relative size-[88px] shrink-0 overflow-hidden rounded-full bg-[#f3f6f9] ring-1 ring-[#0a088f]/10 md:size-[112px]">
                  <CmsImage src={photo} alt="" sizes="112px" />
                </div>
              ) : null}
              <div className="min-w-0 pt-1">
                <h3 className="m-0 text-[clamp(20px,2cqi,26px)] font-semibold leading-[1.2] tracking-[-0.02em] text-[#0a088f]">
                  {str(item, 'title').replace(/^\d+\.\s*/, '')}
                </h3>
                <p className="m-0 mt-2 max-w-[42ch] text-[15px] leading-[1.6] text-[#3d5168]">{str(item, 'body')}</p>
                {meta ? <p className="m-0 mt-4 text-[15px] font-medium text-[#c96a4b]">{meta}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

/** Photo on top, navy panel underneath. The arrow is the card's own CMS link. */
function TileArrow({ href, label, locale }: { href: string; label: string; locale: Locale }) {
  const resolved = localHref(locale, href);
  const external = /^https?:/i.test(resolved);
  const className =
    'mt-5 grid size-10 shrink-0 place-items-center self-end rounded-full bg-[#c96a4b] text-white no-underline';
  const icon = (
    <svg viewBox="0 0 16 16" className="size-4 rtl:-scale-x-100" aria-hidden>
      <path d="M4.5 11.5 11.5 4.5M11.5 4.5H7M11.5 4.5V9" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
  if (external || resolved.startsWith('mailto:') || resolved.startsWith('tel:')) {
    return (
      <a href={resolved} aria-label={label} className={className} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
        {icon}
      </a>
    );
  }
  return (
    <Link href={resolved} aria-label={label} className={className}>
      {icon}
    </Link>
  );
}

function featureColumns(columns: number): string {
  return columns === 2 ? 'sm:grid-cols-2' : columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3';
}

/**
 * The "Made for you" arrangement: a photograph over a navy panel. Title, sentence,
 * photo and the optional arrow all still come from the card in the CMS. The band
 * is white so the map does not show through the gaps.
 */
function FeatureTiles({ data, locale, list, columns }: Props & { list: BlockData[]; columns: number }) {
  return (
    <Section className="!bg-white">
      <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} intro={str(data, 'intro')} />
      <ul className={`m-0 grid list-none grid-cols-1 items-stretch gap-4 p-0 ${featureColumns(columns)}`}>
        {list.map((item, index) => {
          const cardLink = link(item, 'link');
          const rawImage = str(item, 'image');
          const image = rawImage ? scenePhoto(rawImage, index) : '';
          const body = str(item, 'body');
          return (
            <li key={index} className="flex h-full flex-col overflow-hidden rounded-[12px] bg-[#0a088f]">
              {image ? (
                <div className="relative aspect-[16/10] bg-[#1614a8]">
                  <CmsImage src={image} alt="" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
              ) : (
                <div className="grid aspect-[16/10] place-items-center bg-[#1614a8]">
                  <Icon name={str(item, 'icon')} className="size-8 text-white" />
                </div>
              )}
              <div className="flex flex-1 flex-col px-5 py-5 text-white">
                <h3 className="m-0 text-[20px] font-semibold leading-[1.25] tracking-[-0.01em]">{str(item, 'title')}</h3>
                {data.typing === true ? (
                  <TypeOnView text={body} className="m-0 mt-2 text-[14px] leading-[1.55] text-white/85" />
                ) : (
                  <p className="m-0 mt-2 text-[14px] leading-[1.55] text-white/85">{body}</p>
                )}
                {cardLink ? <TileArrow href={cardLink.href} label={cardLink.label} locale={locale} /> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export function FeaturesBlock({ data, locale }: Props) {
  const list = items(data, 'items');
  const columns = num(data, 'columns', 3);
  if (str(data, 'style') === 'tiles') return <FeatureTiles data={data} locale={locale} list={list} columns={columns} />;
  const grid = featureColumns(columns);
  return (
    <Section tone="surface">
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
              className="row-span-4 grid grid-rows-subgrid gap-y-0 border-t border-line pt-6"
            >
              {image ? (
                <div className={`photo-card relative mb-5 aspect-[16/10] bg-canvas ${index % 2 === 1 ? 'photo-card-alt' : ''}`}>
                  <CmsImage src={scenePhoto(image, index)} alt="" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
              ) : (
                <Icon name={str(item, 'icon')} className="mb-4 size-5 text-ink" />
              )}
              <h3 className="m-0 mt-5 text-[18px] font-semibold tracking-[-0.01em]">{str(item, 'title')}</h3>
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

function splitFrames(data: BlockData): { src: string; alt: string }[] {
  const gallery = items(data, 'gallery')
    .map((item) => ({ src: str(item, 'src'), alt: str(item, 'alt') }))
    .filter((item) => item.src);
  if (gallery.length > 1) return gallery;
  const image = str(data, 'image');
  const replaced =
    !image ||
    image.includes('lisbon-rooftops') ||
    image.startsWith('/photos/lisbon') ||
    image.startsWith('/photos/kitchen') ||
    image.startsWith('/walkthrough/') ||
    image.includes('/illustrations/');
  if (!replaced) return [{ src: image, alt: str(data, 'imageAlt') }];
  if (!image) return [];
  return [...SELECTED_FRAMES];
}

/**
 * Heading and the CMS paragraphs sit beside the photograph, in one row, so a
 * long checklist does not hang below the picture on one side. The ticks are
 * their own row under both columns. The photograph stays flat: the tilt used
 * on the other cards would fight this quieter layout. A white band keeps the
 * route map from showing through the gap.
 */
export function SplitBlock({ data, locale }: Props) {
  const frames = splitFrames(data);
  const left = str(data, 'imageSide') === 'left';
  const bullets = strList(data, 'bullets');
  const cta = link(data, 'cta');
  const eyebrow = str(data, 'eyebrow');
  const title = str(data, 'title');
  const body = str(data, 'body');
  return (
    <Section className="!bg-white !py-[clamp(28px,4cqi,48px)]">
      <div className={`grid grid-cols-1 items-center gap-[clamp(20px,3cqi,40px)] ${frames.length ? 'lg:grid-cols-2' : ''}`}>
        <div className={left ? 'lg:order-2' : ''}>
          {eyebrow ? (
            <p className="m-0 mb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#c96a4b]">{eyebrow}</p>
          ) : null}
          {title ? (
            <h2 className="m-0 text-balance text-[clamp(28px,3.4cqi,44px)] font-semibold leading-[1.05] tracking-[-0.03em] text-[#0a088f]">{title}</h2>
          ) : null}
          {body ? <Markdown text={body} locale={locale} className="mt-3 !gap-2.5 text-[15px] !leading-[1.45] text-[#3d5168]" /> : null}
        </div>
        {frames.length ? (
          <div className={left ? 'lg:order-1' : ''}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-[#0a088f]">
              <FrameCycle frames={frames} alt={str(data, 'imageAlt')} />
            </div>
          </div>
        ) : null}
      </div>
      {bullets.length > 0 || cta ? (
        <div className="mt-6">
          {bullets.length > 0 ? (
            <ul className="m-0 grid list-none grid-cols-1 gap-x-8 gap-y-2.5 p-0 sm:grid-cols-2">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2.5 text-[15px] leading-[1.35] text-[#0a088f]">
                  <span className="grid size-7 shrink-0 place-items-center rounded-[8px] border border-[#0a088f]/10 bg-white text-[#c96a4b] shadow-[0_1px_2px_rgba(10,8,143,0.08)]">
                    <Icon name="check" className="size-4" />
                  </span>
                  <span className="pt-1">{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {cta ? (
            <div className="mt-4">
              <CmsTextLink href={cta.href} label={cta.label} locale={locale} />
            </div>
          ) : null}
        </div>
      ) : null}
    </Section>
  );
}

/* A transparent blue closer, the same family as the header and the footer. */
export function CtaBlock({ data, locale }: Props) {
  const primary = link(data, 'primary');
  const secondary = link(data, 'secondary');
  return (
    <section className="bg-[#0a088f] px-[clamp(20px,4cqi,56px)] py-[clamp(56px,8cqi,96px)] text-[#f4f8fb]">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-[640px]">
            <h2 className="m-0 text-balance text-[clamp(28px,3.8cqi,46px)] font-semibold leading-[1.06] tracking-[-0.03em] text-[#f4f8fb]">{str(data, 'title')}</h2>
            {str(data, 'body') ? <p className="m-0 mt-4 text-[17px] leading-[1.6] text-[#d5e2ee]">{str(data, 'body')}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            {primary && <CmsButton href={primary.href} label={primary.label} locale={locale} size="sm" />}
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
