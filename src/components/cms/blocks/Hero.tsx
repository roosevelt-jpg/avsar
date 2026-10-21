import Link from 'next/link';
import { items, link, str, strList, type BlockData } from '@/lib/cms/blocks';
import { localHref } from '@/lib/cms/settings';
import { siteText } from '@/lib/cms/localize';
import type { Locale } from '@/lib/i18n';
import { getFunnelStats } from '@/lib/stats/funnel';
import { CmsButton, CmsImage, CmsTextLink, CmsVideo, Icon } from '../primitives';
import { FilmButton } from '../VideoPlayer';

/* Below this many finished tests the counts are too small to be worth
   showing off; the live odds block further down explains them instead. */
const LIVE_PROOF_MIN = 50;

/* Photographs we already host. The 3D illustrations read as stickers, so a
   choice card uses a real picture and keeps the label from the page. */
const REAL_PHOTOS = [
  '/walkthrough/call.jpg',
  '/lisbon-rooftops-1200.jpg',
  '/walkthrough/documents.jpg',
  '/walkthrough/assessment.jpg',
] as const;

function choicePhoto(src: string, index: number): string {
  if (!src || src.includes('/illustrations/')) return REAL_PHOTOS[index % REAL_PHOTOS.length] ?? REAL_PHOTOS[0];
  return src;
}

export async function HeroBlock({ data, locale, first }: { data: BlockData; locale: Locale; first: boolean }) {
  const mediaType = str(data, 'mediaType');
  const src = str(data, 'mediaSrc');
  const hasMedia = mediaType !== 'none' && Boolean(src);
  const split = hasMedia;
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
    <section className="relative overflow-hidden px-[clamp(20px,4cqi,56px)] pt-[clamp(28px,5cqi,64px)] pb-[clamp(36px,5cqi,72px)] text-ink">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(55% 70% at 100% 0%, #d5e6f4 0%, transparent 60%), radial-gradient(40% 50% at 0% 100%, #f3e6d4 0%, transparent 55%)',
        }}
      />
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
            <p className="m-0 mb-5 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-accent-deep">
              <span aria-hidden className="h-px w-8 bg-[linear-gradient(90deg,#16324f,#c4a574)]" />
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
            <p className={`mt-5 mb-0 text-[clamp(17px,1.7cqi,20px)] leading-[1.55] text-ink-2 ${split ? 'max-w-[42ch]' : 'mx-auto max-w-[62ch]'}`}>
              {str(data, 'subtitle')}
            </p>
          ) : null}

          {/* The choices come before the button: a visitor who knows what they
              want takes the shortest path, everyone else has the one button. */}
          {intents.length > 0 && !pictureCards && (
            <div className="mt-8">
              {str(data, 'intentsLabel') ? (
                <p className="m-0 mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">{str(data, 'intentsLabel')}</p>
              ) : null}
              {pictureCards ? null : (
              <ul className={`m-0 flex list-none flex-wrap gap-2.5 p-0 ${align}`}>
                {intents.map((intent, index) => (
                  <li key={index}>
                    <Link
                      href={localHref(locale, str(intent, 'href'))}
                      className="t-colors inline-flex items-center gap-2 rounded-[14px] border border-line bg-surface px-4 py-2.5 text-[15px] font-semibold text-ink no-underline hover:border-accent"
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
            <dl className={`m-0 mt-10 grid max-w-[640px] grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 ${centred ? 'mx-auto' : ''}`}>
              {stats.map((stat, index) => (
                <div key={index} className="blue-card min-w-0 px-5 py-4 text-start">
                  <dt className="sr-only">{str(stat, 'label')}</dt>
                  <dd className="m-0 bg-[linear-gradient(100deg,#16324f,#3c8fd4)] bg-clip-text text-[26px] font-semibold tracking-[-0.03em] text-transparent">{str(stat, 'value')}</dd>
                  <dd className="m-0 mt-1 text-[13px] leading-[1.4] text-ink-2 [overflow-wrap:anywhere]">{str(stat, 'label')}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {hasMedia && (
          <div
            className={`relative w-full overflow-hidden rounded-[28px_28px_28px_8px] bg-canvas shadow-[0_30px_70px_-28px_rgba(22,50,79,0.45)] ring-1 ring-white/70 ${
              split ? 'aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5]' : 'aspect-[4/3] sm:aspect-[16/8]'
            }`}
          >
            {mediaType === 'video' ? (
              <CmsVideo src={src} poster={str(data, 'mediaPoster')} title={str(data, 'mediaAlt') || str(data, 'title')} ambient />
            ) : (
              <CmsImage src={src} alt={str(data, 'mediaAlt')} priority={first} sizes={split ? '(max-width: 1024px) 100vw, 50vw' : '100vw'} />
            )}
            <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#16324f]/55 via-transparent to-transparent" />
          </div>
        )}
      </div>

      {pictureCards && (
        <div className="relative mx-auto mt-10 w-full max-w-[1200px]">
          {str(data, 'intentsLabel') ? (
            <p className="m-0 mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">{str(data, 'intentsLabel')}</p>
          ) : null}
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 lg:grid-cols-4">
            {intents.map((intent, index) => (
              <li key={index}>
                <Link
                  href={localHref(locale, str(intent, 'href'))}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-[18px_18px_18px_6px] no-underline"
                >
                  <CmsImage src={choicePhoto(str(intent, 'image'), index)} alt="" sizes="(max-width: 1024px) 50vw, 25vw" priority={first} />
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#16324f] via-[#16324f]/15 to-transparent transition-opacity duration-300 group-hover:via-[#16324f]/35" />
                  <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 text-[15px] font-semibold leading-[1.25] text-white">
                    {str(intent, 'label')}
                    <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
