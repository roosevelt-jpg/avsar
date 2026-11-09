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
import { CountUpValue } from '../CountUpValue';

type Props = { data: BlockData; locale: Locale };

export function TrustBarBlock({ data }: Props) {
  const list = items(data, 'items');
  if (!list.length) return null;
  const stats = str(data, 'style') === 'stats';
  const cols =
    list.length <= 3
      ? 'lg:grid-cols-3'
      : list.length === 4
        ? 'lg:grid-cols-4'
        : list.length >= 5
          ? 'lg:grid-cols-5'
          : 'lg:grid-cols-4';

  if (stats) {
    /* Mockup strip: icon + label in a row, hairline dividers between cells. */
    return (
      <section className="border-b border-line bg-white px-[clamp(20px,4cqi,56px)] py-[clamp(22px,3.2cqi,32px)]">
        <ul className={`mx-auto m-0 grid w-full max-w-[1200px] list-none grid-cols-1 gap-0 p-0 md:grid-cols-2 ${cols}`}>
          {list.map((item, index) => (
            <li
              key={index}
              className={`flex flex-col items-center justify-center gap-2.5 border-b border-line px-3 py-4 text-center last:border-b-0 md:border-b-0 md:px-5 ${
                index > 0 ? 'lg:border-s lg:border-line' : ''
              }`}
            >
              <span className="grid size-10 place-items-center text-[var(--color-gold)]">
                <Icon name={str(item, 'icon')} className="size-6" />
              </span>
              <p className="m-0 text-[14px] font-semibold leading-[1.35] text-[#142438]">{str(item, 'title')}</p>
              {str(item, 'body') ? <p className="m-0 text-[12px] leading-[1.4] text-ink-2">{str(item, 'body')}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="border-b border-line bg-white px-[clamp(20px,4cqi,56px)] py-[clamp(22px,3cqi,36px)]">
      <ul
        className={`mx-auto m-0 grid w-full max-w-[1200px] list-none grid-cols-1 gap-0 p-0 md:grid-cols-2 ${cols}`}
      >
        {list.map((item, index) => (
          <li
            key={index}
            className={`flex items-start gap-3 border-b border-line px-0 py-4 last:border-b-0 md:border-b-0 md:px-6 md:py-2 ${
              index > 0 ? 'lg:border-s lg:border-line' : ''
            }`}
          >
            <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full border border-[var(--color-gold)]/45 text-[var(--color-gold)]">
              <Icon name={str(item, 'icon')} className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="m-0 text-[15px] font-semibold text-[#142438]">{str(item, 'title')}</p>
              {str(item, 'body') ? <p className="m-0 mt-1 text-[13px] leading-[1.45] text-ink-2">{str(item, 'body')}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StatsBlock({ data }: Props) {
  const list = items(data, 'items');
  if (!list.length) return null;
  return (
    <Section tone="ink">
      <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} dark />
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-px overflow-hidden rounded-[22px] border border-dark-line bg-dark-line p-0">
        {list.map((item, index) => {
          /* Empty value stays honest: em dash, never a made-up count. */
          const value = str(item, 'value').trim() || '—';
          return (
            <li key={index} className="bg-night p-[clamp(20px,3cqi,32px)]">
              <p className="m-0 text-[clamp(44px,6cqi,72px)] font-semibold leading-none tracking-[-0.04em] text-on-night">
                <CountUpValue value={value} />
              </p>
              <p className="m-0 mt-3 text-[16px] text-on-night">{str(item, 'label')}</p>
              {str(item, 'note') ? <p className="m-0 mt-1 text-[14px] text-dark-muted">{str(item, 'note')}</p> : null}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export function StepsBlock({ data }: Props) {
  const list = items(data, 'items');
  if (str(data, 'layout') === 'journey') return <StepsJourney data={data} />;
  if (str(data, 'layout') === 'process') return <StepsProcess data={data} />;
  if (str(data, 'layout') === 'timeline') return <StepsTimeline data={data} />;
  return (
    <Section id="how">
      <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} intro={str(data, 'intro')} />
      <ol className="m-0 flex list-none flex-col border-t border-line p-0">
        {list.map((item, index) => (
          <li key={index} className="grid grid-cols-1 items-center gap-6 border-b border-line py-8 md:grid-cols-[minmax(0,1fr)_minmax(200px,280px)] md:gap-12">
            <div>
              <p className="m-0 font-mono text-[12px] tracking-[0.16em] text-[#b28a49]">{String(index + 1).padStart(2, '0')}</p>
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
 * How It Works mockup: centered heading, five numbered cards in a row with
 * gold arrows between them — no side photograph.
 */
function StepsProcess({ data }: { data: BlockData }) {
  const list = items(data, 'items');
  const cols = list.length >= 5 ? 'xl:grid-cols-5' : list.length === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3';
  return (
    <Section id="how" className="!bg-white !py-[clamp(40px,6cqi,80px)]">
      <div className="mx-auto mb-[clamp(28px,4cqi,40px)] max-w-[720px] text-center">
        {str(data, 'title') ? (
          <h2 className="display-serif m-0 text-balance text-[clamp(30px,3.8cqi,46px)] leading-[1.1] text-[#142438]">{str(data, 'title')}</h2>
        ) : null}
        {str(data, 'intro') ? <p className="m-0 mt-3 text-[15px] leading-[1.55] text-ink-2">{str(data, 'intro')}</p> : null}
      </div>
      <ol className={`m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 ${cols} xl:gap-4`}>
        {list.map((item, index) => (
          <li
            key={index}
            className="relative min-w-0 rounded-[14px] border border-[#142438]/08 bg-white px-4 py-6 text-center shadow-[0_14px_32px_-24px_rgba(20,36,56,0.4)]"
          >
            {index < list.length - 1 ? (
              <span aria-hidden className="absolute -end-2.5 top-1/2 z-10 hidden -translate-y-1/2 text-[20px] text-[var(--color-gold)] xl:block">
                →
              </span>
            ) : null}
            <span className="mx-auto grid size-10 place-items-center rounded-full bg-[var(--color-gold)] text-[14px] font-bold text-white">
              {index + 1}
            </span>
            <span className="mx-auto mt-4 grid size-10 place-items-center text-[var(--color-gold)]">
              <Icon name={str(item, 'icon') || 'check'} className="size-6" />
            </span>
            <h3 className="m-0 mt-3 text-[16px] font-semibold leading-[1.25] text-[#142438]">{str(item, 'title').replace(/^\d+\.\s*/, '')}</h3>
            <p className="m-0 mt-2 text-[13px] leading-[1.5] text-ink-2">{str(item, 'body')}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/**
 * Side photograph with a horizontal step row. Home uses photo left + four
 * steps; the Visa mockup uses five steps left and the tram photo on the right
 * with an optional caption overlay.
 */
function StepsJourney({ data }: { data: BlockData }) {
  const list = items(data, 'items');
  const sideImage = str(data, 'sideImage');
  const imageRight = str(data, 'sideImageSide') === 'right';
  const caption = str(data, 'sideImageCaption');
  const stepCols =
    list.length >= 5 ? 'xl:grid-cols-5' : list.length === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3';

  /* Absolute fill on lg so the photo matches the step-row height instead of
     forcing a tall portrait aspect beside shorter cards. */
  const photo = sideImage ? (
    <div className="relative aspect-[4/3] min-h-[220px] overflow-hidden rounded-[18px] bg-[#142438] lg:aspect-auto lg:min-h-0 lg:self-stretch">
      <div className="absolute inset-0">
        <CmsImage src={sideImage} alt={str(data, 'sideImageAlt')} sizes="(max-width: 1024px) 100vw, 38vw" />
      </div>
      {caption ? (
        <div className="absolute inset-x-4 bottom-4 z-[1] rounded-[12px] bg-[#f4f5f7]/95 px-4 py-3 text-[#142438] shadow-[0_8px_24px_-12px_rgba(20,36,56,0.45)]">
          <p className="m-0 flex items-center gap-2 text-[14px] font-semibold leading-[1.35]">
            <Icon name="map" className="size-4 shrink-0 text-[var(--color-gold)]" />
            {caption}
          </p>
        </div>
      ) : null}
    </div>
  ) : null;

  const steps = (
    <ol className={`m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 ${stepCols} xl:gap-2`}>
      {list.map((item, index) => (
        <li key={index} className="relative min-w-0 px-1 py-2">
          {index < list.length - 1 ? (
            <span
              aria-hidden
              className="absolute -end-1 top-6 z-10 hidden text-[18px] text-[var(--color-gold)] xl:block"
            >
              ›
            </span>
          ) : null}
          <span className="grid size-10 place-items-center text-[var(--color-gold)]">
            <Icon name={str(item, 'icon') || 'check'} className="size-6" />
          </span>
          <h3 className="m-0 mt-3 text-[16px] font-semibold leading-[1.25] text-[#142438]">{str(item, 'title').replace(/^\d+\.\s*/, '')}</h3>
          <p className="m-0 mt-2 text-[13px] leading-[1.5] text-ink-2">{str(item, 'body')}</p>
          {str(item, 'meta') ? <p className="m-0 mt-3 text-[12px] font-medium text-muted">{str(item, 'meta')}</p> : null}
        </li>
      ))}
    </ol>
  );

  return (
    <Section id="how" className="!bg-white !py-[clamp(40px,6cqi,80px)]">
      <div className="mb-[clamp(24px,3cqi,36px)] max-w-[720px]">
        {str(data, 'eyebrow') ? (
          <p className="m-0 mb-3 inline-flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gold)]">
            <span aria-hidden className="h-px w-6 bg-[var(--color-gold)]" />
            {str(data, 'eyebrow')}
          </p>
        ) : null}
        {str(data, 'title') ? (
          <h2 className="display-serif m-0 text-balance text-[clamp(30px,3.8cqi,46px)] leading-[1.1] text-[#142438]">{str(data, 'title')}</h2>
        ) : null}
        {str(data, 'intro') ? <p className="m-0 mt-3 text-[16px] leading-[1.55] text-ink-2">{str(data, 'intro')}</p> : null}
      </div>
      <div
        className={`grid grid-cols-1 items-start gap-[clamp(24px,3.5cqi,40px)] lg:items-stretch ${
          sideImage
            ? imageRight
              ? 'lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]'
              : 'lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]'
            : ''
        }`}
      >
        {imageRight ? (
          <>
            {steps}
            {photo}
          </>
        ) : (
          <>
            {photo}
            {steps}
          </>
        )}
      </div>
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
                index > 0 ? 'border-t border-dotted border-[#142438]/25 md:border-t-0' : ''
              } ${index >= 2 ? 'md:border-t md:border-dotted md:border-[#142438]/25' : ''} ${
                secondColumn ? 'md:border-s md:border-dotted md:border-[#142438]/25 md:ps-10' : 'md:pe-10'
              }`}
            >
              {photo ? (
                <div className="relative size-[88px] shrink-0 overflow-hidden rounded-full bg-[#f3f6f9] ring-1 ring-[#142438]/10 md:size-[112px]">
                  <CmsImage src={photo} alt="" sizes="112px" />
                </div>
              ) : null}
              <div className="min-w-0 pt-1">
                <h3 className="m-0 text-[clamp(20px,2cqi,26px)] font-semibold leading-[1.2] tracking-[-0.02em] text-[#142438]">
                  {str(item, 'title').replace(/^\d+\.\s*/, '')}
                </h3>
                <p className="m-0 mt-2 max-w-[42ch] text-[15px] leading-[1.6] text-[#3d5168]">{str(item, 'body')}</p>
                {meta ? <p className="m-0 mt-4 text-[15px] font-medium text-[#b28a49]">{meta}</p> : null}
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
    'mt-5 grid size-10 shrink-0 place-items-center self-end rounded-full bg-[#b28a49] text-white no-underline';
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
    <Section className="!bg-[#f4f5f7] !py-[clamp(40px,6cqi,72px)]">
      <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} intro={str(data, 'intro')} />
      <ul className={`m-0 mt-8 grid list-none grid-cols-1 items-stretch gap-5 p-0 ${featureColumns(columns)}`}>
        {list.map((item, index) => {
          const cardLink = link(item, 'link');
          const rawImage = str(item, 'image');
          const image = rawImage ? scenePhoto(rawImage, index) : '';
          const body = str(item, 'body');
          return (
            <li key={index} className="flex h-full flex-col overflow-hidden rounded-[14px] bg-white">
              {image ? (
                <div className="relative aspect-[5/4] bg-[#e8eaed]">
                  <CmsImage src={image} alt={str(item, 'title')} sizes="(max-width: 768px) 100vw, 25vw" />
                </div>
              ) : (
                <div className="grid aspect-[5/4] place-items-center bg-[#e8eaed] text-[var(--color-gold)]">
                  <Icon name={str(item, 'icon')} className="size-8" />
                </div>
              )}
              <div className="flex flex-1 flex-col px-4 py-4 text-[#142438]">
                <h3 className="display-serif m-0 text-[20px] font-normal leading-[1.25]">{str(item, 'title')}</h3>
                {data.typing === true ? (
                  <TypeOnView text={body} className="m-0 mt-2 text-[14px] leading-[1.55] text-ink-2" />
                ) : (
                  <p className="m-0 mt-2 text-[14px] leading-[1.55] text-ink-2">{body}</p>
                )}
                {cardLink?.href && cardLink.label ? (
                  <TileArrow href={cardLink.href} label={cardLink.label} locale={locale} />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/** Line-icon row for Why Portugal: gold outline icons, no card chrome. */
function FeatureIcons({ data, list, columns }: { data: BlockData; list: BlockData[]; columns: number }) {
  return (
    <Section className="!bg-[#f4f5f7] !py-[clamp(40px,6cqi,72px)]">
      <div className="mb-[clamp(28px,4cqi,40px)] flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[520px]">
          {str(data, 'eyebrow') ? (
            <p className="m-0 mb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gold)]">{str(data, 'eyebrow')}</p>
          ) : null}
          {str(data, 'title') ? (
            <h2 className="display-serif m-0 text-balance text-[clamp(32px,4cqi,48px)] leading-[1.1] text-[#142438]">{str(data, 'title')}</h2>
          ) : null}
          {str(data, 'title') ? <span aria-hidden className="mt-3 block h-1 w-14 rounded-full bg-[var(--color-gold)]" /> : null}
        </div>
        {str(data, 'intro') ? <p className="m-0 max-w-[42ch] text-[15px] leading-[1.55] text-ink-2 lg:text-end">{str(data, 'intro')}</p> : null}
      </div>
      <ul className={`m-0 grid list-none grid-cols-1 gap-8 p-0 sm:grid-cols-2 ${columns >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        {list.map((item, index) => (
          <li key={index} className="min-w-0">
            <span className="grid size-12 place-items-center text-[var(--color-gold)]">
              <Icon name={str(item, 'icon')} className="size-7" />
            </span>
            <h3 className="m-0 mt-4 text-[18px] font-semibold tracking-[-0.01em] text-[#142438]">{str(item, 'title')}</h3>
            <p className="m-0 mt-2 text-[14px] leading-[1.55] text-ink-2">{str(item, 'body')}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function FeaturesBlock({ data, locale }: Props) {
  const list = items(data, 'items');
  const columns = num(data, 'columns', 3);
  if (str(data, 'style') === 'tiles') return <FeatureTiles data={data} locale={locale} list={list} columns={columns} />;
  if (str(data, 'style') === 'icons') return <FeatureIcons data={data} list={list} columns={columns} />;
  if (str(data, 'style') === 'mission') return <FeatureMission data={data} list={list} />;
  if (str(data, 'style') === 'value_cards') return <FeatureValueCards data={data} list={list} columns={columns} />;
  if (str(data, 'style') === 'sector_cards') return <FeatureSectorCards data={data} list={list} />;
  if (str(data, 'style') === 'verticals') return <FeatureVerticals data={data} list={list} locale={locale} />;
  if (str(data, 'style') === 'support_grid') return <FeatureSupportGrid data={data} list={list} />;
  if (str(data, 'style') === 'visa_desk') return <FeatureVisaDesk data={data} list={list} />;
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

/** About mockup: photograph left, Mission and Vision stacked on the right. */
function FeatureMission({ data, list }: { data: BlockData; list: BlockData[] }) {
  const image = str(data, 'sideImage');
  return (
    <Section className="!bg-white !py-[clamp(40px,6cqi,80px)]">
      <div className={`grid grid-cols-1 items-start gap-[clamp(28px,4cqi,56px)] lg:items-stretch ${image ? 'lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]' : ''}`}>
        {image ? (
          <div className="relative aspect-[4/3] min-h-[220px] overflow-hidden rounded-[18px] bg-[#142438] lg:aspect-auto lg:min-h-0 lg:self-stretch">
            <div className="absolute inset-0">
              <CmsImage src={scenePhoto(image, 0)} alt={str(data, 'sideImageAlt')} sizes="(max-width: 1024px) 100vw, 48vw" />
            </div>
          </div>
        ) : null}
        <div className="min-w-0">
          {str(data, 'eyebrow') || str(data, 'title') ? (
            <div className="mb-8">
              {str(data, 'eyebrow') ? (
                <p className="m-0 mb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gold)]">{str(data, 'eyebrow')}</p>
              ) : null}
              {str(data, 'title') ? (
                <h2 className="display-serif m-0 text-[clamp(28px,3.4cqi,40px)] leading-[1.1] text-[#142438]">{str(data, 'title')}</h2>
              ) : null}
            </div>
          ) : null}
          <ul className="m-0 flex list-none flex-col gap-0 p-0">
            {list.map((item, index) => (
              <li
                key={index}
                className={`flex items-start gap-4 py-6 ${index > 0 ? 'border-t border-line' : ''}`}
              >
                <span className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-full bg-[var(--color-gold)]/12 text-[var(--color-gold)]">
                  <Icon name={str(item, 'icon') || 'star'} className="size-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="m-0 text-[20px] font-semibold tracking-[-0.01em] text-[#142438]">{str(item, 'title')}</h3>
                  <p className="m-0 mt-2 text-[15px] leading-[1.55] text-ink-2">{str(item, 'body')}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

/** Visa mockup: checklist + passport photo on the left, support cards on the right. */
function FeatureVisaDesk({ data, list }: { data: BlockData; list: BlockData[] }) {
  const checklist = strList(data, 'checklist');
  const image = str(data, 'sideImage');
  return (
    <Section className="!bg-[var(--color-ivory,#f4f5f7)] !py-[clamp(40px,6cqi,80px)]">
      <div className="grid grid-cols-1 items-start gap-[clamp(28px,4cqi,48px)] lg:grid-cols-2">
        <div>
          {str(data, 'checklistTitle') ? (
            <h2 className="display-serif m-0 text-[clamp(26px,3.2cqi,36px)] leading-[1.15] text-[#142438]">
              {str(data, 'checklistTitle')}
            </h2>
          ) : null}
          {checklist.length > 0 ? (
            <ul className="m-0 mt-6 flex list-none flex-col gap-3 p-0">
              {checklist.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] leading-[1.45] text-[#142438]">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center text-[var(--color-gold)]">
                    <Icon name="check" className="size-4" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {image ? (
            <div className="relative mt-8 aspect-[16/10] overflow-hidden rounded-[16px] bg-[#142438]">
              <CmsImage src={scenePhoto(image, 0)} alt={str(data, 'sideImageAlt')} sizes="(max-width: 1024px) 100vw, 46vw" />
            </div>
          ) : null}
        </div>
        <div>
          {str(data, 'title') ? (
            <h2 className="display-serif m-0 text-[clamp(26px,3.2cqi,36px)] leading-[1.15] text-[#142438]">{str(data, 'title')}</h2>
          ) : null}
          <ul className="m-0 mt-6 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
            {list.map((item, index) => (
              <li
                key={index}
                className="rounded-[14px] border border-[#142438]/08 bg-white p-5 shadow-[0_12px_28px_-22px_rgba(20,36,56,0.35)]"
              >
                <span className="grid size-10 place-items-center rounded-full bg-[var(--color-gold)]/12 text-[var(--color-gold)]">
                  <Icon name={str(item, 'icon')} className="size-5" />
                </span>
                <h3 className="m-0 mt-3 text-[16px] font-semibold tracking-[-0.01em] text-[#142438]">{str(item, 'title')}</h3>
                {str(item, 'body') ? <p className="m-0 mt-1.5 text-[13px] leading-[1.45] text-ink-2">{str(item, 'body')}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

/** How It Works mockup: tram photo left, 2×2 support cards right. */
function FeatureSupportGrid({ data, list }: { data: BlockData; list: BlockData[] }) {
  const image = str(data, 'sideImage');
  return (
    <Section className="!bg-[var(--color-ivory,#f4f5f7)] !py-[clamp(40px,6cqi,80px)]">
      <div className={`grid grid-cols-1 items-start gap-[clamp(28px,4cqi,48px)] lg:items-stretch ${image ? 'lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]' : ''}`}>
        {image ? (
          <div className="relative aspect-[4/3] min-h-[220px] overflow-hidden rounded-[18px] bg-[#142438] lg:aspect-auto lg:min-h-0 lg:self-stretch">
            <div className="absolute inset-0">
              <CmsImage src={scenePhoto(image, 0)} alt={str(data, 'sideImageAlt')} sizes="(max-width: 1024px) 100vw, 44vw" />
            </div>
          </div>
        ) : null}
        <div className="min-w-0">
          {str(data, 'title') ? (
            <div className="flex items-stretch gap-4">
              <span aria-hidden className="w-[3px] shrink-0 rounded-full bg-[var(--color-gold)]" />
              <h2 className="display-serif m-0 text-balance text-[clamp(28px,3.4cqi,40px)] leading-[1.12] text-[#142438]">
                {str(data, 'title')}
              </h2>
            </div>
          ) : null}
          <ul className="m-0 mt-7 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
            {list.map((item, index) => (
              <li key={index} className="rounded-[14px] border border-[#142438]/08 bg-white p-5 shadow-[0_12px_28px_-22px_rgba(20,36,56,0.35)]">
                <span className="grid size-10 place-items-center rounded-full bg-[var(--color-gold)]/12 text-[var(--color-gold)]">
                  <Icon name={str(item, 'icon')} className="size-5" />
                </span>
                <h3 className="m-0 mt-3 text-[16px] font-semibold tracking-[-0.01em] text-[#142438]">{str(item, 'title')}</h3>
                {str(item, 'body') ? <p className="m-0 mt-1.5 text-[13px] leading-[1.5] text-ink-2">{str(item, 'body')}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

/** Why Portugal mockup: centered heading, auto-fit sector cards. */
function FeatureSectorCards({ data, list }: { data: BlockData; list: BlockData[] }) {
  return (
    <Section className="!bg-white !py-[clamp(40px,6cqi,80px)]">
      <div className="mb-[clamp(28px,4cqi,40px)] mx-auto max-w-[720px] text-center">
        {str(data, 'title') ? (
          <h2 className="display-serif m-0 text-balance text-[clamp(30px,3.8cqi,46px)] leading-[1.1] text-[#142438]">{str(data, 'title')}</h2>
        ) : null}
        {str(data, 'intro') ? <p className="m-0 mt-3 text-[15px] leading-[1.55] text-ink-2">{str(data, 'intro')}</p> : null}
      </div>
      <ul className="m-0 mx-auto grid w-full max-w-[1100px] list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((item, index) => (
          <li
            key={index}
            className="rounded-[14px] border border-[#142438]/08 bg-white p-6 text-center shadow-[0_14px_32px_-24px_rgba(20,36,56,0.35)]"
          >
            <span className="mx-auto grid size-11 place-items-center rounded-full bg-[var(--color-gold)]/12 text-[var(--color-gold)]">
              <Icon name={str(item, 'icon')} className="size-5" />
            </span>
            <h3 className="m-0 mt-4 text-[16px] font-semibold tracking-[-0.01em] text-[#142438]">{str(item, 'title')}</h3>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * Category grid (DSS-style columns): centered heading, soft wash, icon columns separated
 * by dotted rules. Palette stays S&A navy/gold; copy is ours.
 */
function FeatureVerticals({
  data,
  list,
  locale,
}: {
  data: BlockData;
  list: BlockData[];
  locale: Locale;
}) {
  return (
    <Section className="relative overflow-hidden !bg-[#f4f6f8] !py-[clamp(48px,7cqi,88px)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 55% at 50% 40%, #142438 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10 mx-auto max-w-[1180px]">
        <div className="mx-auto mb-[clamp(32px,4cqi,48px)] max-w-[640px] text-center">
          {str(data, 'eyebrow') ? (
            <p className="m-0 mb-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gold)]">
              {str(data, 'eyebrow')}
            </p>
          ) : null}
          {str(data, 'title') ? (
            <h2 className="m-0 text-balance text-[clamp(28px,3.6cqi,42px)] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#142438]">
              {str(data, 'title')}
            </h2>
          ) : null}
          {str(data, 'title') ? (
            <span aria-hidden className="mx-auto mt-4 block h-[3px] w-12 rounded-full bg-[var(--color-gold)]" />
          ) : null}
          {str(data, 'intro') ? (
            <p className="m-0 mt-4 text-[15px] leading-[1.55] text-[#5c7084]">{str(data, 'intro')}</p>
          ) : null}
        </div>
        <ul className="m-0 grid list-none grid-cols-1 divide-y divide-dashed divide-[#142438]/15 p-0 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
          {list.map((item, index) => {
            const cardLink = link(item, 'link');
            const inner = (
              <>
                <span className="mx-auto grid size-14 place-items-center text-[#142438]">
                  <Icon name={str(item, 'icon') || 'briefcase'} className="size-8" />
                </span>
                <h3 className="m-0 mt-4 text-[16px] font-bold tracking-[-0.01em] text-[#142438]">
                  {str(item, 'title')}
                </h3>
                {str(item, 'body') ? (
                  <p className="m-0 mt-2 text-[13px] leading-[1.5] text-[#5c7084]">{str(item, 'body')}</p>
                ) : null}
              </>
            );
            /* Dotted column rules on larger screens; row rules via parent divide on phones. */
            const colRule =
              index % 2 === 1
                ? 'sm:border-s sm:border-dashed sm:border-[#142438]/15'
                : '';
            const lgRule =
              index % 4 !== 0 ? 'lg:border-s lg:border-dashed lg:border-[#142438]/15' : 'lg:border-s-0';
            const rowRule = index >= 4 ? 'lg:border-t lg:border-dashed lg:border-[#142438]/15' : '';
            return (
              <li key={index} className={`px-5 py-8 text-center sm:px-6 ${colRule} ${lgRule} ${rowRule}`}>
                {cardLink ? (
                  <Link
                    href={localHref(locale, cardLink.href)}
                    className="t-colors block text-inherit no-underline hover:opacity-90"
                  >
                    {inner}
                    {cardLink.label ? (
                      <span className="mt-3 inline-block text-[12px] font-semibold text-[var(--color-gold)]">
                        {cardLink.label} →
                      </span>
                    ) : null}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}

/** About mockup: four elevated white cards with gold icons. */
function FeatureValueCards({ data, list, columns }: { data: BlockData; list: BlockData[]; columns: number }) {
  return (
    <Section className="!bg-[var(--color-ivory,#f4f5f7)] !py-[clamp(40px,6cqi,80px)]">
      <div className="mb-[clamp(28px,4cqi,40px)] max-w-[640px]">
        {str(data, 'eyebrow') ? (
          <p className="m-0 mb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gold)]">{str(data, 'eyebrow')}</p>
        ) : null}
        {str(data, 'title') ? (
          <h2 className="display-serif m-0 text-balance text-[clamp(30px,3.8cqi,46px)] leading-[1.1] text-[#142438]">{str(data, 'title')}</h2>
        ) : null}
        {str(data, 'intro') ? <p className="m-0 mt-3 text-[15px] leading-[1.55] text-ink-2">{str(data, 'intro')}</p> : null}
      </div>
      <ul className={`m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 ${columns >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        {list.map((item, index) => (
          <li
            key={index}
            className="rounded-[14px] border border-[#142438]/08 bg-white p-6 shadow-[0_14px_32px_-24px_rgba(20,36,56,0.35)]"
          >
            <span className="grid size-11 place-items-center rounded-full bg-[var(--color-gold)]/12 text-[var(--color-gold)]">
              <Icon name={str(item, 'icon')} className="size-5" />
            </span>
            <h3 className="m-0 mt-4 text-[18px] font-semibold tracking-[-0.01em] text-[#142438]">{str(item, 'title')}</h3>
            <p className="m-0 mt-2 text-[14px] leading-[1.55] text-ink-2">{str(item, 'body')}</p>
          </li>
        ))}
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
  /* Swap only known bad/placeholder paths — keep documentary Portugal stills. */
  const replaced =
    !image ||
    image === '/photos/lisbon.jpg' ||
    image === '/photos/brand/employer-meeting.jpg' ||
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

  /* Why Portugal mockup: overlapping photo stack beside a gold-tick checklist. */
  if (str(data, 'style') === 'stacked') {
    const stack = frames.length > 0 ? frames.slice(0, 2) : [];
    return (
      <Section className="!bg-[#f4f5f7] !py-[clamp(40px,6cqi,80px)]">
        <div className="grid grid-cols-1 items-center gap-[clamp(28px,4cqi,56px)] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          {stack.length > 0 ? (
            <div className="relative mx-auto w-full max-w-[420px] pb-[8%] lg:mx-0">
              <div className="relative aspect-[4/5] w-[78%] overflow-hidden rounded-[14px] border-[6px] border-white bg-[#142438] shadow-[0_18px_40px_-20px_rgba(20,36,56,0.45)]">
                <CmsImage src={stack[0]!.src} alt={stack[0]!.alt} sizes="(max-width: 1024px) 70vw, 320px" />
              </div>
              {stack[1] ? (
                <div className="absolute bottom-0 end-0 aspect-[5/4] w-[72%] overflow-hidden rounded-[14px] border-[6px] border-white bg-[#142438] shadow-[0_18px_40px_-20px_rgba(20,36,56,0.45)]">
                  <CmsImage src={stack[1].src} alt={stack[1].alt} sizes="(max-width: 1024px) 60vw, 280px" />
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="min-w-0">
            {title ? (
              <h2 className="display-serif m-0 text-balance text-[clamp(28px,3.4cqi,42px)] leading-[1.12] text-[#142438]">{title}</h2>
            ) : null}
            {bullets.length > 0 ? (
              <ul className="m-0 mt-7 flex list-none flex-col gap-4 p-0">
                {bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 text-[15px] leading-[1.5] text-[#142438]">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[var(--color-gold)] text-white">
                      <Icon name="check" className="size-3.5" />
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {cta ? (
              <div className="mt-6">
                <CmsTextLink href={cta.href} label={cta.label} locale={locale} />
              </div>
            ) : null}
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section className="!bg-white !py-[clamp(28px,4cqi,48px)]">
      <div className={`grid grid-cols-1 items-center gap-[clamp(20px,3cqi,40px)] ${frames.length ? 'lg:grid-cols-2' : ''}`}>
        <div className={left ? 'lg:order-2' : ''}>
          {eyebrow ? (
            <p className="m-0 mb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#b28a49]">{eyebrow}</p>
          ) : null}
          {title ? (
            <h2 className="m-0 text-balance text-[clamp(28px,3.4cqi,44px)] font-semibold leading-[1.05] tracking-[-0.03em] text-[#142438]">{title}</h2>
          ) : null}
          {body ? <Markdown text={body} locale={locale} className="mt-3 !gap-2.5 text-[15px] !leading-[1.45] text-[#3d5168]" /> : null}
        </div>
        {frames.length ? (
          <div className={left ? 'lg:order-1' : ''}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-[#142438]">
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
                <li key={bullet} className="flex items-start gap-2.5 text-[15px] leading-[1.35] text-[#142438]">
                  <span className="grid size-7 shrink-0 place-items-center rounded-[8px] border border-[#142438]/10 bg-white text-[#b28a49] shadow-[0_1px_2px_rgba(20,36,56,0.08)]">
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
  const image = str(data, 'image');

  if (str(data, 'style') === 'banner') {
    return (
      <section className="bg-white px-[clamp(20px,4cqi,56px)] pb-[clamp(48px,7cqi,80px)] pt-[clamp(16px,3cqi,28px)]">
        <div className="mx-auto w-full max-w-[1200px] overflow-hidden rounded-[22px] border border-[var(--color-gold)]/55 bg-[#142438] text-white shadow-[0_18px_40px_-24px_rgba(20,36,56,0.45)]">
          <div className="flex flex-col items-center gap-6 px-[clamp(22px,3.5cqi,48px)] py-[clamp(28px,4cqi,40px)] lg:flex-row lg:gap-10">
            {image ? (
              <div className="relative size-[120px] shrink-0 overflow-hidden rounded-full border-2 border-[var(--color-gold)]/60 sm:size-[148px]">
                <CmsImage src={scenePhoto(image, 0)} alt={str(data, 'imageAlt')} sizes="148px" />
              </div>
            ) : null}
            <div className="min-w-0 flex-1 text-center lg:text-start">
              {str(data, 'title') ? (
                <h2 className="display-serif m-0 text-balance text-[clamp(26px,3.2cqi,38px)] leading-[1.12] text-white">
                  {str(data, 'title')}
                </h2>
              ) : null}
              {str(data, 'body') ? (
                <p className="mx-auto m-0 mt-3 max-w-[52ch] text-[15px] leading-[1.55] text-white/80 lg:mx-0">{str(data, 'body')}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-center gap-3">
              {primary ? (
                <Link
                  href={localHref(locale, primary.href)}
                  className="btn-gradient t-colors inline-flex items-center gap-2 px-5 py-3 text-[14px] font-semibold no-underline"
                >
                  {primary.label}
                  <span aria-hidden>→</span>
                </Link>
              ) : null}
              {secondary ? <CmsTextLink href={secondary.href} label={secondary.label} locale={locale} dark /> : null}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#142438] px-[clamp(20px,4cqi,56px)] py-[clamp(56px,8cqi,96px)] text-[#f4f8fb]">
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
  const pathways = items(data, 'pathways').filter((item) => str(item, 'title'));
  const desk = pathways.length > 0;

  return (
    <section id="contact-form" className="scroll-mt-28 bg-[var(--color-ivory,#f4f5f7)] px-[clamp(20px,4cqi,56px)] py-[clamp(40px,6cqi,72px)]">
      <div className={`mx-auto w-full max-w-[1200px] ${desk ? 'grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start' : 'max-w-[640px]'}`}>
        {desk ? (
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {pathways.map((item, index) => {
              const href = str(item, 'href');
              const image = str(item, 'image');
              const cta = str(item, 'ctaLabel') || 'Learn more';
              return (
                <li key={`${str(item, 'title')}-${index}`}>
                  <article className="overflow-hidden rounded-[14px] border border-[#142438]/10 bg-white shadow-[0_12px_32px_-24px_rgba(20,36,56,0.35)]">
                    {image ? (
                      <div className="relative h-[140px] w-full bg-[#142438]">
                        <CmsImage src={scenePhoto(image, index)} alt="" sizes="(max-width: 1024px) 100vw, 420px" className="object-cover" />
                      </div>
                    ) : null}
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-gold)]/15 text-[var(--color-gold)]">
                          <Icon name={str(item, 'icon') || 'chat'} className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <h2 className="m-0 text-[18px] font-semibold tracking-[-0.01em] text-[#142438]">{str(item, 'title')}</h2>
                          {str(item, 'body') ? (
                            <p className="m-0 mt-1.5 text-[14px] leading-[1.5] text-ink-2">{str(item, 'body')}</p>
                          ) : null}
                          {href ? (
                            <Link
                              href={localHref(locale, href)}
                              className="t-colors mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--color-gold)] no-underline hover:text-[#9a743c]"
                            >
                              {cta}
                              <span aria-hidden>→</span>
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        ) : null}

        <div className="rounded-[16px] border border-[#142438]/10 bg-white p-[clamp(22px,3cqi,36px)] shadow-[0_18px_40px_-28px_rgba(20,36,56,0.4)]">
          {str(data, 'title') ? (
            <h2 className="display-serif m-0 text-[clamp(26px,3.2cqi,36px)] font-normal leading-[1.15] text-[#142438]">
              {str(data, 'title')}
            </h2>
          ) : null}
          {str(data, 'intro') ? <p className="m-0 mt-3 text-[15px] leading-[1.55] text-ink-2">{str(data, 'intro')}</p> : null}
          <div className={str(data, 'title') || str(data, 'intro') ? 'mt-6' : ''}>
            <ContactForm locale={locale} secureNote={str(data, 'secureNote') || undefined} />
          </div>
        </div>
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
