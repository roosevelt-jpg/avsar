import { items, link, num, str, strList, type BlockData } from '@/lib/cms/blocks';
import type { Locale } from '@/lib/i18n';
import { Markdown } from '../Markdown';
import { CmsButton, CmsImage, Icon, Section, SectionHeading } from '../primitives';

type Props = { data: BlockData; locale: Locale };

export function TrustBarBlock({ data }: Props) {
  const list = items(data, 'items');
  if (!list.length) return null;
  return (
    <section className="border-y border-line bg-surface px-[clamp(20px,4cqi,56px)] py-[clamp(24px,3cqi,36px)]">
      <ul className="mx-auto m-0 grid w-full max-w-[1200px] list-none grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-8 gap-y-6 p-0">
        {list.map((item, index) => (
          <li key={index} className="flex gap-3.5">
            <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-accent-tint text-accent-deep">
              <Icon name={str(item, 'icon')} className="size-5" />
            </span>
            <div>
              <p className="m-0 text-[15px] font-semibold">{str(item, 'title')}</p>
              <p className="m-0 mt-1 text-[14px] leading-[1.5] text-muted">{str(item, 'body')}</p>
            </div>
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
          <li key={index} className="bg-ink p-[clamp(20px,3cqi,32px)]">
            <p className="m-0 text-[clamp(44px,6cqi,72px)] font-semibold leading-none tracking-[-0.04em] text-paper">{str(item, 'value')}</p>
            <p className="m-0 mt-3 text-[16px] text-paper">{str(item, 'label')}</p>
            {str(item, 'note') ? <p className="m-0 mt-1 text-[14px] text-dark-muted">{str(item, 'note')}</p> : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function StepsBlock({ data }: Props) {
  const list = items(data, 'items');
  return (
    <Section id="how">
      <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} intro={str(data, 'intro')} />
      <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 p-0">
        {list.map((item, index) => (
          <li key={index} className="group flex flex-col overflow-hidden rounded-[22px] border border-line bg-surface">
            {str(item, 'image') ? (
              <div className="relative aspect-[16/10] overflow-hidden bg-canvas">
                <CmsImage src={str(item, 'image')} alt="" sizes="(max-width: 768px) 100vw, 33vw" className="transition-transform duration-500 group-hover:scale-[1.03]" />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-ink font-mono text-[13px] text-paper">
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

export function FeaturesBlock({ data }: Props) {
  const list = items(data, 'items');
  const columns = num(data, 'columns', 3);
  const grid =
    columns === 2 ? 'sm:grid-cols-2' : columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3';
  return (
    <Section tone="surface">
      <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} intro={str(data, 'intro')} />
      <ul className={`m-0 grid list-none grid-cols-1 gap-4 p-0 ${grid}`}>
        {list.map((item, index) => (
          <li key={index} className="t-colors rounded-[20px] border border-line bg-paper p-6 hover:border-line-strong">
            <span className="grid size-11 place-items-center rounded-[14px] bg-ink text-paper">
              <Icon name={str(item, 'icon')} className="size-5" />
            </span>
            <h3 className="m-0 mt-5 text-[18px] font-semibold tracking-[-0.01em]">{str(item, 'title')}</h3>
            <p className="m-0 mt-2 text-[15px] leading-[1.6] text-ink-2">{str(item, 'body')}</p>
          </li>
        ))}
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
      <div className={`grid items-center gap-[clamp(32px,5cqi,72px)] ${image ? 'lg:grid-cols-2' : ''}`}>
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
              <CmsButton href={cta.href} label={cta.label} locale={locale} variant="dark" />
            </div>
          )}
        </div>
        {image ? (
          <div className={`relative aspect-[4/3] overflow-hidden rounded-[28px] bg-canvas ${left ? 'lg:order-1' : ''}`}>
            <CmsImage src={image} alt={str(data, 'imageAlt')} />
          </div>
        ) : null}
      </div>
    </Section>
  );
}

export function CtaBlock({ data, locale }: Props) {
  const tone = str(data, 'tone') || 'dark';
  const primary = link(data, 'primary');
  const secondary = link(data, 'secondary');
  const dark = tone === 'dark' || tone === 'accent';
  return (
    <section className="px-[clamp(20px,4cqi,56px)] py-[clamp(24px,4cqi,48px)]">
      <div
        className={`mx-auto w-full max-w-[1200px] overflow-hidden rounded-[32px] px-[clamp(24px,5cqi,72px)] py-[clamp(40px,6cqi,80px)] ${
          tone === 'accent' ? 'bg-accent text-white' : tone === 'light' ? 'border border-line bg-surface text-ink' : 'bg-ink text-paper'
        }`}
      >
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-[640px]">
            <h2 className="m-0 text-balance text-[clamp(28px,3.8cqi,46px)] font-semibold leading-[1.06] tracking-[-0.03em]">{str(data, 'title')}</h2>
            {str(data, 'body') ? (
              <p className={`m-0 mt-4 text-[17px] leading-[1.6] ${tone === 'light' ? 'text-ink-2' : tone === 'accent' ? 'text-white/85' : 'text-dark-muted-2'}`}>
                {str(data, 'body')}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            {primary && <CmsButton href={primary.href} label={primary.label} locale={locale} variant={tone === 'accent' ? 'white' : tone === 'light' ? 'primary' : 'primary'} size="lg" />}
            {secondary && <CmsButton href={secondary.href} label={secondary.label} locale={locale} variant={dark ? 'ghostDark' : 'light'} size="lg" />}
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
