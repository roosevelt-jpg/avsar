import Link from 'next/link';
import { items, link, str, strList, type BlockData } from '@/lib/cms/blocks';
import { localHref } from '@/lib/cms/settings';
import { scenePhoto, SCENE_PHOTOS } from '@/lib/cms/scenes';
import { siteText } from '@/lib/cms/localize';
import type { Locale } from '@/lib/i18n';
import { getFunnelStats } from '@/lib/stats/funnel';
import { CmsButton, CmsTextLink, Icon } from '../primitives';
import { FilmButton } from '../VideoPlayer';
import { HeroStage, type HeroSlide } from '../HeroStage';

/* Below this many finished tests the counts are too small to be worth
   showing off; the live odds block further down explains them instead. */
const LIVE_PROOF_MIN = 50;

function remote(src: string): boolean {
  return /^https?:/i.test(src);
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
  const Heading = first ? 'h1' : 'h2';

  const slides: HeroSlide[] = [];
  /* A hosted film can play in the stage. A path like /video/hero-loop.mp4 is
     not in this repo, so it would be a black first frame. */
  if (hasMedia && mediaType === 'video' && remote(src)) {
    slides.push({
      kind: 'video',
      src,
      poster: str(data, 'mediaPoster') || SCENE_PHOTOS[0],
      alt: str(data, 'mediaAlt') || str(data, 'title'),
      caption: str(data, 'mediaAlt'),
    });
  } else if (hasMedia && mediaType === 'image') {
    slides.push({
      kind: 'image',
      src: scenePhoto(src, 0),
      alt: str(data, 'mediaAlt') || str(data, 'title'),
      caption: str(data, 'mediaAlt'),
    });
  }
  intents.forEach((intent, index) => {
    slides.push({
      kind: 'image',
      src: scenePhoto(str(intent, 'image'), index),
      alt: str(intent, 'label'),
      caption: str(intent, 'label'),
    });
  });
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
    <HeroStage slides={slides}>
      {str(data, 'eyebrow') ? (
        <p className="m-0 mb-5 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-accent-deep">
          <span aria-hidden className="h-[3px] w-10 rounded-full bg-[linear-gradient(90deg,#d4532c,#e8a23a,#0f8f78)]" />
          {str(data, 'eyebrow')}
        </p>
      ) : null}
      <Heading className="m-0 text-balance break-words text-[clamp(36px,5.4cqi,68px)] font-semibold leading-[1.02] tracking-[-0.045em]">
        {str(data, 'title')}
      </Heading>
      {str(data, 'subtitle') ? (
        <p className="mt-5 mb-0 max-w-[42ch] text-[clamp(17px,1.7cqi,20px)] leading-[1.55] text-ink-2">{str(data, 'subtitle')}</p>
      ) : null}

      {intents.length > 0 && (
        <div className="mt-7">
          {str(data, 'intentsLabel') ? (
            <p className="m-0 mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">{str(data, 'intentsLabel')}</p>
          ) : null}
          <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
            {intents.map((intent, index) => (
              <li key={index}>
                <Link
                  href={localHref(locale, str(intent, 'href'))}
                  className="t-colors inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[14px] font-semibold text-ink no-underline hover:border-accent"
                >
                  {str(intent, 'icon') ? <Icon name={str(intent, 'icon')} className="size-[18px] text-accent" /> : null}
                  {str(intent, 'label')}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(primary || secondary || film) && (
        <div className={`flex flex-wrap items-center gap-x-6 gap-y-4 ${intents.length ? 'mt-6' : 'mt-8'}`}>
          {primary && <CmsButton href={primary.href} label={primary.label} locale={locale} size="lg" />}
          {film && <FilmButton src={film} label={filmLabel} />}
          {secondary && <CmsTextLink href={secondary.href} label={secondary.label} locale={locale} />}
        </div>
      )}

      {highlights.length > 0 && (
        <ul className="m-0 mt-6 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-[14px] text-ink-2">
          {highlights.map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5">
              <Icon name="check" className="size-4 text-success" />
              {item}
            </li>
          ))}
        </ul>
      )}

      {proof.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-6">
          <span className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.12em] text-accent">
            <span aria-hidden className="size-[7px] animate-pulse rounded-full bg-success" />
            {siteText(locale, 'Live')}
          </span>
          {proof.map((item) => (
            <p key={item.label} className="m-0 text-[15px] text-ink-2">
              <strong className="text-[20px] font-semibold tracking-[-0.02em] text-ink tabular-nums">{item.value}</strong> {item.label}
            </p>
          ))}
        </div>
      )}

      {stats.length > 0 && (
        <dl className="m-0 mt-8 grid max-w-[640px] grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          {stats.map((stat, index) => (
            <div key={index} className="blue-card min-w-0 px-5 py-4 text-start">
              <dt className="sr-only">{str(stat, 'label')}</dt>
              <dd className="m-0 bg-[linear-gradient(100deg,#d4532c,#e8a23a_55%,#0f8f78)] bg-clip-text text-[26px] font-semibold tracking-[-0.03em] text-transparent">
                {str(stat, 'value')}
              </dd>
              <dd className="m-0 mt-1 text-[13px] leading-[1.4] text-ink-2 [overflow-wrap:anywhere]">{str(stat, 'label')}</dd>
            </div>
          ))}
        </dl>
      )}
    </HeroStage>
  );
}
