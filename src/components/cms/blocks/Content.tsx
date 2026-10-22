import { items, link, num, str, strList, type BlockData } from '@/lib/cms/blocks';
import { scenePhoto, SELECTED_FRAMES, stepPhoto } from '@/lib/cms/scenes';
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
 * The same steps as a sequence. Each row keeps the picture for that step,
 * so "create your profile" is a phone form and "fly and start work" is the
 * room, not a repeated kitchen shot. The picture alternates sides so the
 * page reads as a process, not a stack of identical cards.
 */
function StepsTimeline({ data }: { data: BlockData }) {
  const list = items(data, 'items');
  return (
    <Section id="how">
      <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} intro={str(data, 'intro')} />
      <ol className="m-0 flex list-none flex-col border-t border-line p-0">
        {list.map((item, index) => {
          const meta = str(item, 'meta');
          const flip = index % 2 === 1;
          return (
            <li key={index} className="grid grid-cols-1 items-center gap-6 border-b border-line py-8 md:grid-cols-2 md:gap-14 md:py-10">
              <div className={flip ? 'md:order-2' : ''}>
                <p className="m-0 font-mono text-[12px] tracking-[0.16em] text-[#c96a4b]">{String(index + 1).padStart(2, '0')}</p>
                {meta ? <p className="m-0 mt-3 text-[13px] text-muted">{meta}</p> : null}
                <h3 className="m-0 mt-2 text-[clamp(22px,2.2cqi,28px)] font-semibold tracking-[-0.02em]">
                  {str(item, 'title').replace(/^\d+\.\s*/, '')}
                </h3>
                <p className="m-0 mt-3 max-w-[46ch] text-[16px] leading-[1.65] text-ink-2">{str(item, 'body')}</p>
              </div>
              {stepPhoto(str(item, 'image'), index) ? (
                <div className={`photo-card relative aspect-[16/10] bg-canvas ${flip ? 'photo-card-alt md:order-1' : ''}`}>
                  <CmsImage src={stepPhoto(str(item, 'image'), index)} alt="" sizes="(max-width: 768px) 100vw, 50vw" />
                </div>
              ) : null}
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
              className="row-span-4 grid grid-rows-subgrid gap-y-0 border-t border-line pt-6"
            >
              {image ? (
                <div className={`photo-card relative mb-5 aspect-[16/10] bg-canvas ${index % 2 === 1 ? 'photo-card-alt' : ''}`}>
                  <CmsImage src={scenePhoto(image, index)} alt="" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
              ) : (
                <Icon name={str(item, 'icon')} className="mb-4 size-5 text-ink" />
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

export function SplitBlock({ data, locale }: Props) {
  const frames = splitFrames(data);
  const left = str(data, 'imageSide') === 'left';
  const bullets = strList(data, 'bullets');
  const cta = link(data, 'cta');
  return (
    <Section>
      <div className={`grid grid-cols-1 items-center gap-[clamp(32px,5cqi,72px)] ${frames.length ? 'lg:grid-cols-2' : ''}`}>
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
        {frames.length ? (
          <div className={left ? 'lg:order-1' : ''}>
            <div className="photo-card relative aspect-[4/3] bg-canvas">
              <FrameCycle frames={frames} alt={str(data, 'imageAlt')} />
            </div>
          </div>
        ) : null}
      </div>
    </Section>
  );
}

/* A transparent blue closer, the same family as the header and the footer. */
export function CtaBlock({ data, locale }: Props) {
  const primary = link(data, 'primary');
  const secondary = link(data, 'secondary');
  return (
    <section className="bg-[#16324f] px-[clamp(20px,4cqi,56px)] py-[clamp(56px,8cqi,96px)] text-[#f4f8fb]">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-[640px]">
            <h2 className="m-0 text-balance text-[clamp(28px,3.8cqi,46px)] font-semibold leading-[1.06] tracking-[-0.03em] text-[#f4f8fb]">{str(data, 'title')}</h2>
            {str(data, 'body') ? <p className="m-0 mt-4 text-[17px] leading-[1.6] text-[#d5e2ee]">{str(data, 'body')}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            {primary && <CmsButton href={primary.href} label={primary.label} locale={locale} variant="white" size="lg" />}
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
