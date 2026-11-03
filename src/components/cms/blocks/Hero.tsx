import Link from 'next/link';
import { items, link, str, strList, type BlockData } from '@/lib/cms/blocks';
import { localHref } from '@/lib/cms/settings';
import { scenePhoto, SCENE_PHOTOS } from '@/lib/cms/scenes';
import { siteText } from '@/lib/cms/localize';
import type { Locale } from '@/lib/i18n';
import { getFunnelStats } from '@/lib/stats/funnel';
import { CmsTextLink, Icon } from '../primitives';
import { FilmButton } from '../VideoPlayer';
import { HeroStage, type HeroSlide } from '../HeroStage';
import type { ReactNode } from 'react';

/* Below this many finished tests the counts are too small to be worth
   showing off; the live odds block further down explains them instead. */
const LIVE_PROOF_MIN = 50;

/** A file the stage can play. A YouTube link stays on the film button. */
function playableVideo(src: string): boolean {
  if (!src) return false;
  return !/youtube\.com|youtu\.be/i.test(src);
}

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
      <em className="accent-italic">{match}</em>
      {after}
    </>
  );
}

export async function HeroBlock({ data, locale, first }: { data: BlockData; locale: Locale; first: boolean }) {
  const mediaType = str(data, 'mediaType');
  const src = str(data, 'mediaSrc');
  const hasMedia = mediaType !== 'none' && Boolean(src);
  const primary = link(data, 'primaryCta');
  const secondary = link(data, 'secondaryCta');
  const film = str(data, 'filmUrl');
  const filmLabel = str(data, 'filmLabel') || 'Watch the film';
  const highlights = strList(data, 'highlights');
  const stats = items(data, 'stats');
  const intents = items(data, 'intents').filter((intent) => str(intent, 'label') && str(intent, 'href'));
  const cmsSlides = items(data, 'slides').filter((slide) => str(slide, 'src'));
  const badgeLabel = str(data, 'badgeLabel');
  const badgeHref = str(data, 'badgeHref');
  const accentWord = str(data, 'accentWord');
  const Heading = first ? 'h1' : 'h2';
  /* A slideshow or a primary button marks the mockup-style brand hero. */
  const brand = cmsSlides.length > 0 || Boolean(primary && badgeLabel);

  const slides: HeroSlide[] = [];
  if (cmsSlides.length > 0) {
    cmsSlides.forEach((slide) => {
      slides.push({
        kind: 'image',
        src: str(slide, 'src'),
        alt: str(slide, 'alt') || str(data, 'title'),
        caption: str(slide, 'caption'),
      });
    });
  } else if (hasMedia && mediaType === 'video' && playableVideo(src)) {
    slides.push({
      kind: 'video',
      src,
      poster: str(data, 'mediaPoster') || SCENE_PHOTOS[0],
      alt: str(data, 'mediaAlt') || str(data, 'title'),
      caption: '',
    });
  } else if (hasMedia && mediaType === 'image') {
    slides.push({
      kind: 'image',
      src: scenePhoto(src, 0),
      alt: str(data, 'mediaAlt') || str(data, 'title'),
      caption: str(data, 'mediaAlt'),
    });
  } else {
    intents.forEach((intent, index) => {
      slides.push({
        kind: 'image',
        src: scenePhoto(str(intent, 'image'), index),
        alt: str(intent, 'label'),
        caption: str(intent, 'label'),
      });
    });
  }
  if (slides.length === 0) {
    SCENE_PHOTOS.forEach((photo) => {
      slides.push({ kind: 'image', src: photo, alt: str(data, 'title'), caption: '' });
    });
  }

  const funnel = data.liveProof === true ? await getFunnelStats() : null;
  const number = new Intl.NumberFormat(locale === 'en' ? 'en-IN' : locale);
  const proof =
    funnel && funnel.completed >= LIVE_PROOF_MIN
      ? [
          { value: number.format(funnel.completed), label: siteText(locale, 'finished the free test') },
          { value: number.format(funnel.shortlisted), label: siteText(locale, 'put forward to employers') },
          { value: number.format(funnel.hired), label: siteText(locale, 'hired') },
        ]
      : [];

  return (
    <HeroStage
      slides={slides}
      variant={brand ? 'brand' : 'default'}
      badge={badgeLabel ? { label: badgeLabel, href: badgeHref ? localHref(locale, badgeHref) : undefined } : null}
      lead={
        str(data, 'eyebrow') ? (
          <p className={`m-0 text-[12px] font-semibold uppercase tracking-[0.16em] ${brand ? 'text-[var(--color-gold)]' : 'text-[#c96a4b]'}`}>
            {str(data, 'eyebrow')}
          </p>
        ) : null
      }
    >
      <Heading
        className={`m-0 text-balance break-words leading-[1.08] tracking-[-0.02em] ${
          brand
            ? 'display-serif text-[clamp(36px,5.2cqi,64px)] font-normal text-white'
            : 'text-[clamp(34px,4.6cqi,56px)] font-semibold'
        }`}
      >
        {accentTitle(str(data, 'title'), accentWord)}
      </Heading>
      {str(data, 'subtitle') ? (
        <p className={`mt-5 mb-0 max-w-[42ch] text-[clamp(16px,1.7cqi,19px)] leading-[1.55] ${brand ? 'text-white/85' : 'text-ink-2'}`}>
          {str(data, 'subtitle')}
        </p>
      ) : null}

      {(primary || secondary) && (
        <div className={`flex flex-wrap items-center gap-3 ${intents.length && !brand ? 'mt-6' : 'mt-8'}`}>
          {primary ? (
            <Link
              href={localHref(locale, primary.href)}
              className="btn-gradient t-colors inline-flex items-center gap-2 px-5 py-3 text-[14px] font-semibold no-underline"
            >
              {primary.label}
              <span aria-hidden>→</span>
            </Link>
          ) : null}
          {secondary ? (
            <Link
              href={localHref(locale, secondary.href)}
              className={
                brand
                  ? 'btn-outline-light t-colors inline-flex items-center gap-2 px-5 py-3 text-[14px] font-semibold no-underline'
                  : 't-colors inline-flex items-center rounded-[999px] border border-line-strong bg-white px-5 py-3 text-[14px] font-semibold text-ink no-underline hover:border-ink'
              }
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
      )}

      {intents.length > 0 && !brand && (
        <div className="mt-7">
          {str(data, 'intentsLabel') ? (
            <p className="m-0 mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">{str(data, 'intentsLabel')}</p>
          ) : null}
          <ul className="intent-row m-0 flex list-none gap-2.5 p-0">
            {intents.map((intent, index) => (
              <li key={index}>
                <Link
                  href={localHref(locale, str(intent, 'href'))}
                  className="t-colors inline-flex items-center gap-2 rounded-[2px] border border-[#c96a4b] bg-[#0a088f] px-3.5 py-2 text-[14px] font-medium text-white no-underline hover:bg-[#22209a]"
                >
                  {str(intent, 'icon') ? <Icon name={str(intent, 'icon')} className="size-[18px] text-white" /> : null}
                  {str(intent, 'label')}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {film && !brand && (
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
          <FilmButton src={film} label={filmLabel} />
          {!primary && secondary ? <CmsTextLink href={secondary.href} label={secondary.label} locale={locale} /> : null}
        </div>
      )}

      {highlights.length > 0 && (
        <ul
          className={`m-0 mt-8 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 ${
            brand ? 'text-white/90 lg:grid-cols-4' : 'flex flex-wrap gap-x-5 gap-y-2 text-ink-2'
          }`}
        >
          {highlights.map((item) => (
            <li key={item} className={`inline-flex items-start gap-2 text-[13px] leading-[1.35] ${brand ? '' : 'items-center text-[14px]'}`}>
              <Icon name="check" className={`mt-0.5 size-4 shrink-0 ${brand ? 'text-[var(--color-gold)]' : 'text-success'}`} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {proof.length > 0 && (
        <div className={`mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-6 ${brand ? 'border-white/20' : 'border-line'}`}>
          <span className={`inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.12em] ${brand ? 'text-[var(--color-gold)]' : 'text-[#c96a4b]'}`}>
            <span aria-hidden className="size-[7px] animate-pulse rounded-full bg-success" />
            {siteText(locale, 'Live')}
          </span>
          {proof.map((item) => (
            <p key={item.label} className={`m-0 text-[15px] ${brand ? 'text-white/85' : 'text-ink-2'}`}>
              <strong className={`text-[20px] font-semibold tracking-[-0.02em] tabular-nums ${brand ? 'text-white' : 'text-ink'}`}>{item.value}</strong>{' '}
              {item.label}
            </p>
          ))}
        </div>
      )}

      {stats.length > 0 && !brand && (
        <dl className="m-0 mt-10 grid max-w-[560px] grid-cols-3 gap-6 border-t border-line pt-6">
          {stats.map((stat, index) => (
            <div key={index} className="min-w-0">
              <dd className="m-0 text-[26px] font-semibold tracking-[-0.03em] text-ink">{str(stat, 'value')}</dd>
              <dt className="m-0 mt-1 text-[13px] leading-[1.4] text-ink-2 [overflow-wrap:anywhere]">{str(stat, 'label')}</dt>
            </div>
          ))}
        </dl>
      )}
    </HeroStage>
  );
}
