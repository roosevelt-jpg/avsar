import Link from 'next/link';
import { items, link, str, strList, type BlockData } from '@/lib/cms/blocks';
import { localHref } from '@/lib/cms/settings';
import { siteText } from '@/lib/cms/localize';
import type { Locale } from '@/lib/i18n';
import { getFunnelStats } from '@/lib/stats/funnel';
import { CmsButton, CmsImage, CmsTextLink, CmsVideo, Icon } from '../primitives';
import { FilmButton } from '../VideoPlayer';
import { HeroBubbles } from '../HeroBubbles';
import { HeroRouteMap } from '../HeroRouteMap';

/* Below this many finished tests the counts are too small to be worth
   showing off; the live odds block further down explains them instead. */
const LIVE_PROOF_MIN = 50;

const TILES = ['bg-tint-clay', 'bg-tint-sky', 'bg-tint-sage', 'bg-tint-sand'] as const;

export async function HeroBlock({ data, locale, first }: { data: BlockData; locale: Locale; first: boolean }) {
  const mediaType = str(data, 'mediaType');
  const src = str(data, 'mediaSrc');
  const hasMedia = mediaType !== 'none' && Boolean(src);
  const stacked = str(data, 'layout') === 'stacked';
  const split = hasMedia && !stacked;
  const primary = link(data, 'primaryCta');
  const secondary = link(data, 'secondaryCta');
  const film = str(data, 'filmUrl');
  const filmLabel = str(data, 'filmLabel') || 'Watch the film';
  const highlights = strList(data, 'highlights');
  const stats = items(data, 'stats');
  const intents = items(data, 'intents').filter((intent) => str(intent, 'label') && str(intent, 'href'));
  const Heading = first ? 'h1' : 'h2';
  const pictureCards = intents.some((intent) => str(intent, 'image'));

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

  const centred = !split;
  const align = centred ? 'justify-center' : '';

  return (
    <section className="relative overflow-hidden px-[clamp(20px,4cqi,56px)] pt-[clamp(40px,7cqi,96px)] pb-[clamp(40px,6cqi,80px)]">
      {/* A soft warm wash behind the hero, so the first screen reads as a
          designed surface rather than an empty page. Pure CSS, no image cost. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(60% 60% at 85% 10%, var(--color-tint-sky) 0%, transparent 60%), radial-gradient(50% 50% at 0% 100%, var(--color-canvas) 0%, transparent 60%)',
        }}
      />
      {data.routeMap === true ? <HeroRouteMap /> : null}
      <HeroBubbles phrases={strList(data, 'bubbles')} />
      {/* grid-cols-1 is minmax(0, 1fr): without it the implicit column grows to
          the longest unbreakable word, and Tamil and Malayalam compounds are
          wider than a 360px phone. */}
      <div
        className={`relative mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-[clamp(32px,5cqi,72px)] ${
          split ? 'lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]' : 'text-center'
        }`}
      >
        <div className={centred ? 'mx-auto max-w-[880px]' : ''}>
          {str(data, 'eyebrow') ? (
            <p className="m-0 mb-5 inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/80 px-[14px] py-1.5 font-mono text-[12px] text-ink-2 backdrop-blur">
              <span aria-hidden className="size-[7px] animate-pulse rounded-full bg-success" />
              {str(data, 'eyebrow')}
            </p>
          ) : null}
          <Heading
            className={`m-0 text-balance break-words font-semibold leading-[1.02] tracking-[-0.04em] ${
              centred ? 'text-[clamp(40px,6.4cqi,80px)]' : 'text-[clamp(36px,5.2cqi,64px)]'
            }`}
          >
            {str(data, 'title')}
          </Heading>
          {str(data, 'subtitle') ? (
            <p className={`mt-5 mb-0 text-[clamp(17px,1.7cqi,20px)] leading-[1.55] text-ink-2 ${split ? 'max-w-[54ch]' : 'mx-auto max-w-[62ch]'}`}>
              {str(data, 'subtitle')}
            </p>
          ) : null}

          {/* The choices come before the button: a visitor who knows what they
              want takes the shortest path, everyone else has the one button. */}
          {intents.length > 0 && (
            <div className="mt-8">
              {str(data, 'intentsLabel') ? (
                <p className="m-0 mb-3 text-[15px] font-medium text-ink-2">{str(data, 'intentsLabel')}</p>
              ) : null}
              {pictureCards ? (
                <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 text-start lg:grid-cols-4">
                  {intents.map((intent, index) => (
                    <li key={index} className="motion-reveal">
                      <Link
                        href={localHref(locale, str(intent, 'href'))}
                        className={`motion-tilt group flex h-full flex-col rounded-[22px] p-4 text-ink no-underline ${TILES[index % TILES.length]}`}
                      >
                        <span className="motion-float relative mx-auto block aspect-square w-[min(100%,132px)]" style={{ animationDelay: `${index * -1.4}s` }}>
                          {str(intent, 'image') ? <CmsImage src={str(intent, 'image')} alt="" sizes="132px" priority={first} className="illustration" /> : null}
                        </span>
                        <span className="mt-2 flex items-center justify-between gap-2 text-[15px] font-semibold leading-[1.3]">
                          {str(intent, 'label')}
                          <span aria-hidden className="transition-transform group-hover:translate-x-1 rtl:-scale-x-100">→</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
              <ul className={`m-0 flex list-none flex-wrap gap-2.5 p-0 ${align}`}>
                {intents.map((intent, index) => (
                  <li key={index}>
                    <Link
                      href={localHref(locale, str(intent, 'href'))}
                      className="t-colors inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2.5 text-[15px] font-medium text-ink no-underline shadow-[0_1px_2px_rgba(27,26,23,0.06)] hover:border-ink"
                    >
                      {str(intent, 'icon') ? <Icon name={str(intent, 'icon')} className="size-[18px] text-accent" /> : null}
                      {str(intent, 'label')}
                    </Link>
                  </li>
                ))}
              </ul>
              )}
            </div>
          )}

          {(primary || secondary || film) && (
            <div className={`flex flex-wrap items-center gap-x-6 gap-y-4 ${intents.length ? 'mt-6' : 'mt-8'} ${align}`}>
              {primary && <CmsButton href={primary.href} label={primary.label} locale={locale} size="lg" />}
              {film && <FilmButton src={film} label={filmLabel} />}
              {secondary && <CmsTextLink href={secondary.href} label={secondary.label} locale={locale} />}
            </div>
          )}

          {highlights.length > 0 && (
            <ul className={`m-0 mt-6 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-[14px] text-ink-2 ${align}`}>
              {highlights.map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <Icon name="check" className="size-4 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          )}

          {proof.length > 0 && (
            <div className={`mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-6 ${align}`}>
              <span className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
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
            <dl className={`m-0 mt-10 grid max-w-[640px] grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-px overflow-hidden rounded-[18px] border border-line bg-line ${centred ? 'mx-auto' : ''}`}>
              {stats.map((stat, index) => (
                <div key={index} className="min-w-0 bg-surface px-5 py-4 text-start">
                  <dt className="sr-only">{str(stat, 'label')}</dt>
                  <dd className="m-0 text-[26px] font-semibold tracking-[-0.03em]">{str(stat, 'value')}</dd>
                  <dd className="m-0 mt-1 text-[13px] leading-[1.4] text-muted [overflow-wrap:anywhere]">{str(stat, 'label')}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {hasMedia && (
          <div
            className={`relative w-full overflow-hidden rounded-[28px] bg-canvas shadow-[0_30px_80px_-30px_rgba(27,26,23,0.45)] ${
              split ? 'aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5]' : 'aspect-[4/3] sm:aspect-[16/8]'
            }`}
          >
            {mediaType === 'video' ? (
              <CmsVideo src={src} poster={str(data, 'mediaPoster')} title={str(data, 'mediaAlt') || str(data, 'title')} ambient />
            ) : (
              <CmsImage src={src} alt={str(data, 'mediaAlt')} priority={first} sizes={split ? '(max-width: 1024px) 100vw, 50vw' : '100vw'} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
