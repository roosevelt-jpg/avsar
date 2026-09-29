import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mono } from '@/components/ui/Mono';
import { Placeholder } from '@/components/ui/Placeholder';
import { SiteHeader } from '@/components/candidate/SiteHeader';
import { SiteFooter } from '@/components/candidate/SiteFooter';
import { PositionSelector } from '@/components/candidate/PositionSelector';
import { fill, getDictionary, isLocale } from '@/lib/i18n';
import { POSITIONS } from '@/lib/data/positions';
import { activePrice, formatInr } from '@/lib/data/cohort';
import {
  BRAND,
  CONTRACT_YEARS,
  RESPONSE_DAYS,
  SELECTION_RATE,
  ASSESSMENT_FEE,
} from '@/lib/data/brand';

export default async function CandidateLanding({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  const money = { days: RESPONSE_DAYS, years: CONTRACT_YEARS, inr: formatInr(activePrice().totalPaise) };

  return (
    <>
      <SiteHeader locale={locale} />

      {/* ---------------------------------------------------------------- hero */}
      <section className="flex flex-col items-center gap-6 px-[clamp(20px,4cqi,56px)] pt-[clamp(48px,9cqi,120px)] pb-[clamp(40px,6cqi,80px)] text-center">
        <p className="m-0 inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-[14px] py-1.5 font-mono text-[12px] text-ink-2">
          <span aria-hidden className="size-[7px] rounded-full bg-success" />
          {t.eyebrow}
        </p>

        <h1 className="m-0 max-w-[16ch] text-balance text-[clamp(38px,6.6cqi,80px)] font-semibold leading-[1.02] tracking-[-0.035em]">
          {t.heroTitle}
        </h1>

        <p className="m-0 max-w-[62ch] text-[clamp(16px,1.8cqi,19px)] leading-[1.55] text-ink-2">{t.heroSub}</p>

        <PositionSelector locale={locale} t={t} />

        <p className="m-0 max-w-[70ch] text-[13px] leading-[1.55] text-muted">{fill(t.fine, money)}</p>
      </section>

      <div className="px-[clamp(20px,4cqi,56px)]">
        <Placeholder
          label="photo · candidate at work in Lisbon"
          className="h-[clamp(220px,38cqi,460px)] w-full"
        />
      </div>

      {/* ------------------------------------------------------- the six steps */}
      <section id="how" className="bg-ink px-[clamp(20px,4cqi,56px)] py-[clamp(56px,8cqi,104px)] text-paper">
        <h2 className="m-0 max-w-[20ch] text-[clamp(28px,4cqi,48px)] font-semibold leading-[1.1] tracking-[-0.03em]">
          {t.process.title}
        </h2>
        <p className="mt-3 mb-10 max-w-[56ch] text-[17px] leading-[1.55] text-dark-muted-2">
          {t.process.lead}
        </p>

        <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-7 p-0">
          {t.process.steps.map(([title, body], index) => (
            <li key={title} className="border-t border-dark-line pt-5">
              <Mono className="text-dark-muted">STEP {index + 1}</Mono>
              <h3 className="mt-3 mb-2 text-[19px] font-semibold leading-[1.3]">{title}</h3>
              <p className="m-0 text-[15px] leading-[1.55] text-dark-muted-2">{body}</p>
            </li>
          ))}
        </ol>

        <p className="mt-10 mb-0 max-w-[60ch] border-t border-dark-line pt-6 text-[16px] leading-[1.6] text-paper">
          {fill(t.process.responseNote, money)}
        </p>
      </section>

      {/* ------------------------------------------------- what the fee includes */}
      <section className="px-[clamp(20px,4cqi,56px)] py-[clamp(56px,8cqi,104px)]">
        <h2 className="m-0 mb-8 max-w-[24ch] text-[clamp(28px,4cqi,48px)] font-semibold leading-[1.1] tracking-[-0.03em]">
          {t.includesTitle}
        </h2>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 p-0">
          {t.includes.map(([title, body], index) => (
            <li key={title} className="rounded-[20px] border border-line bg-surface p-[clamp(22px,2.6cqi,30px)]">
              <Mono className="text-muted">{String(index + 1).padStart(2, '0')}</Mono>
              <h3 className="mt-3 mb-2 text-[20px] font-semibold leading-[1.25]">{title}</h3>
              <p className="m-0 text-[15px] leading-[1.55] text-ink-2">{fill(body, money)}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 mb-0 font-mono text-[13px] text-muted">
          {formatInr(activePrice().totalPaise)} · about €{ASSESSMENT_FEE.eur} · includes GST
        </p>
      </section>

      {/* ------------------------------------------------------ what you receive */}
      <section className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-[clamp(28px,5cqi,64px)] px-[clamp(20px,4cqi,56px)] pb-[clamp(56px,8cqi,104px)]">
        <div>
          <Mono className="text-muted">{t.placeEyebrow}</Mono>
          <h2 className="mt-3 mb-6 max-w-[20ch] text-[clamp(28px,4cqi,48px)] font-semibold leading-[1.1] tracking-[-0.03em]">
            {t.placeTitle}
          </h2>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {t.place.map((line) => (
              <li key={line} className="flex items-start gap-3 text-[16px] leading-[1.5]">
                <span
                  aria-hidden
                  className="mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full bg-accent-tint text-[13px] font-semibold text-accent-deep"
                >
                  ✓
                </span>
                {fill(line, money)}
              </li>
            ))}
          </ul>

          <p className="mt-7 border-t border-line pt-5 text-[14px] leading-[1.55] text-muted">
            {fill(t.placeFine, money)}{' '}
            {/* The selection rate is published only once it has a documented
                basis. See SELECTION_RATE in brand.ts. */}
            {SELECTION_RATE.visible && (
              <span className="text-ink">
                About {SELECTION_RATE.percent} in every 100 applicants are hired.{' '}
              </span>
            )}
            <Link href={`/${locale}/selection-rules`} className="prose-link">
              {t.selectionRules}
            </Link>
          </p>
        </div>

        <Placeholder label="photo · staff accommodation, Portugal" className="aspect-[4/5] w-full" />
      </section>

      {/* ------------------------------------------------------------ documents */}
      <section className="bg-surface-subtle px-[clamp(20px,4cqi,56px)] py-[clamp(56px,8cqi,104px)]">
        <h2 className="m-0 max-w-[22ch] text-[clamp(28px,4cqi,48px)] font-semibold leading-[1.1] tracking-[-0.03em]">
          {t.documents.title}
        </h2>
        <p className="mt-3 mb-8 max-w-[62ch] text-[17px] leading-[1.55] text-ink-2">{t.documents.lead}</p>

        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 p-0">
          {t.documents.items.map(([title, body], index) => (
            <li key={title} className="rounded-[16px] border border-line bg-surface p-5">
              <Mono className={index < 2 ? 'text-accent-deep' : 'text-muted'}>
                {index < 2 ? t.documents.required : t.documents.optional}
              </Mono>
              <h3 className="mt-2.5 mb-1.5 text-[17px] font-semibold">{title}</h3>
              <p className="m-0 text-[14px] leading-[1.55] text-ink-2">{body}</p>
            </li>
          ))}
        </ul>

        <p className="mt-7 mb-0 max-w-[68ch] text-[14px] leading-[1.6] text-muted">
          {t.documents.optionalNote}
        </p>
      </section>

      {/* ------------------------------------------------------------ positions */}
      <section id="sectors" className="px-[clamp(20px,4cqi,56px)] py-[clamp(56px,8cqi,104px)]">
        <h2 className="m-0 mb-8 max-w-[24ch] text-[clamp(28px,4cqi,48px)] font-semibold leading-[1.1] tracking-[-0.03em]">
          {t.sectorsTitle}
        </h2>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 p-0">
          {POSITIONS.map((position, index) => (
            <li key={position.slug}>
              <Placeholder
                label={`photo · ${position.label}`}
                className="aspect-[4/3] w-full"
                radius="rounded-[16px]"
              />
              <p className="mt-2.5 mb-0 text-[16px] font-medium">{t.sectors[index] ?? position.label}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* --------------------------------------------------------------- CTA band */}
      <section className="px-[clamp(20px,4cqi,56px)] pb-[clamp(56px,8cqi,104px)]">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[28px] bg-accent px-[clamp(24px,4cqi,56px)] py-[clamp(32px,5cqi,56px)]">
          <div>
            <h2 className="m-0 max-w-[24ch] text-[clamp(24px,3.2cqi,40px)] font-semibold leading-[1.15] tracking-[-0.03em] text-white">
              {t.ctaTitle}
            </h2>
            <p className="m-0 mt-3 text-[15px] text-white/85">{BRAND.tagline}</p>
          </div>
          <Link
            href={`/${locale}/signup`}
            className="t-colors shrink-0 rounded-[12px] bg-white px-5 py-3 text-[15px] font-medium text-ink no-underline hover:bg-paper"
          >
            {t.cta} →
          </Link>
        </div>
      </section>

      <SiteFooter locale={locale} />
    </>
  );
}
