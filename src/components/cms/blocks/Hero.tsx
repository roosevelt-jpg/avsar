import { items, link, str, strList, type BlockData } from '@/lib/cms/blocks';
import type { Locale } from '@/lib/i18n';
import { CmsButton, CmsImage, CmsVideo, Icon } from '../primitives';

export function HeroBlock({ data, locale, first }: { data: BlockData; locale: Locale; first: boolean }) {
  const mediaType = str(data, 'mediaType');
  const src = str(data, 'mediaSrc');
  const hasMedia = mediaType !== 'none' && Boolean(src);
  const primary = link(data, 'primaryCta');
  const secondary = link(data, 'secondaryCta');
  const highlights = strList(data, 'highlights');
  const stats = items(data, 'stats');
  const Heading = first ? 'h1' : 'h2';

  return (
    <section className="relative overflow-hidden px-[clamp(20px,4cqi,56px)] pt-[clamp(40px,7cqi,88px)] pb-[clamp(40px,6cqi,80px)]">
      {/* A soft warm wash behind the hero, so the first screen reads as a
          designed surface rather than an empty page. Pure CSS, no image cost. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(60% 60% at 85% 10%, oklch(0.94 0.03 40 / 0.9) 0%, transparent 60%), radial-gradient(50% 50% at 0% 100%, oklch(0.95 0.02 150 / 0.6) 0%, transparent 60%)',
        }}
      />
      <div
        className={`relative mx-auto grid w-full max-w-[1200px] items-center gap-[clamp(32px,5cqi,72px)] ${
          hasMedia ? 'lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]' : 'text-center'
        }`}
      >
        <div className={hasMedia ? '' : 'mx-auto max-w-[820px]'}>
          {str(data, 'eyebrow') ? (
            <p className="m-0 mb-5 inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/80 px-[14px] py-1.5 font-mono text-[12px] text-ink-2 backdrop-blur">
              <span aria-hidden className="size-[7px] animate-pulse rounded-full bg-success" />
              {str(data, 'eyebrow')}
            </p>
          ) : null}
          <Heading className="m-0 text-balance text-[clamp(36px,5.2cqi,64px)] font-semibold leading-[1.02] tracking-[-0.04em]">
            {str(data, 'title')}
          </Heading>
          {str(data, 'subtitle') ? (
            <p className={`mt-5 mb-0 text-[clamp(17px,1.7cqi,20px)] leading-[1.55] text-ink-2 ${hasMedia ? 'max-w-[54ch]' : 'mx-auto max-w-[60ch]'}`}>
              {str(data, 'subtitle')}
            </p>
          ) : null}

          {(primary || secondary) && (
            <div className={`mt-8 flex flex-wrap gap-3 ${hasMedia ? '' : 'justify-center'}`}>
              {primary && <CmsButton href={primary.href} label={primary.label} locale={locale} size="lg" />}
              {secondary && <CmsButton href={secondary.href} label={secondary.label} locale={locale} variant="light" size="lg" />}
            </div>
          )}

          {highlights.length > 0 && (
            <ul className={`m-0 mt-6 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-[14px] text-ink-2 ${hasMedia ? '' : 'justify-center'}`}>
              {highlights.map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <Icon name="check" className="size-4 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          )}

          {stats.length > 0 && (
            <dl className={`m-0 mt-10 grid max-w-[640px] grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-px overflow-hidden rounded-[18px] border border-line bg-line ${hasMedia ? '' : 'mx-auto'}`}>
              {stats.map((stat, index) => (
                <div key={index} className="bg-surface px-5 py-4 text-start">
                  <dt className="sr-only">{str(stat, 'label')}</dt>
                  <dd className="m-0 text-[26px] font-semibold tracking-[-0.03em]">{str(stat, 'value')}</dd>
                  <dd className="m-0 mt-1 text-[13px] leading-[1.4] text-muted">{str(stat, 'label')}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {hasMedia && (
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] bg-canvas shadow-[0_30px_80px_-30px_rgba(27,26,23,0.45)] sm:aspect-[4/3] lg:aspect-[4/5]">
            {mediaType === 'video' ? (
              <CmsVideo src={src} poster={str(data, 'mediaPoster')} title={str(data, 'mediaAlt') || str(data, 'title')} ambient />
            ) : (
              <CmsImage src={src} alt={str(data, 'mediaAlt')} priority={first} sizes="(max-width: 1024px) 100vw, 50vw" />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
