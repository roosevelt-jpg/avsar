import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Placeholder } from '@/components/ui/Placeholder';
import { LocaleToggle } from '@/components/candidate/LocaleToggle';
import { SectorSelectorB } from '@/components/candidate/SectorSelectorB';
import { getDictionary, isLocale } from '@/lib/i18n';
import { POSITIONS } from '@/lib/data/positions';

export const metadata = { title: 'Direction B · candidate landing' };

/**
 * Direction B: the alternative visual direction for the candidate landing page.
 *
 * Kept as its own route with its own tokens under `[data-variant="b"]` so the
 * two directions can be shown side by side without either one's CSS leaking
 * into the other. Build A unless the product owner picks B; if they do, apply
 * these tokens to A's screen structures rather than extending this page.
 *
 * Same copy, same dictionary. Only the visual language differs: azulejo blue,
 * DM Serif Display headings, 4px radii and the checkered divider strip.
 */
export default async function CandidateLandingB({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <div data-variant="b" className="min-h-screen" style={{ containerType: 'inline-size' }}>
      <header
        className="flex flex-wrap items-center justify-between gap-4 px-[clamp(20px,4cqi,56px)] py-[18px]"
        style={{ borderBottom: '1px solid var(--b-line)' }}
      >
        <span className="flex items-center gap-2.5 text-[20px] font-semibold">
          <span
            aria-hidden
            className="size-[22px] shrink-0"
            style={{ background: 'var(--b-azulejo)', borderRadius: 'var(--b-radius)' }}
          />
          S&A Recruitment
          <span className="text-[0.72em] font-normal" style={{ color: 'var(--b-muted)' }} lang="hi">
            अवसर
          </span>
        </span>
        <nav
          className="flex flex-wrap gap-[clamp(12px,2.4cqi,28px)] text-[15px]"
          style={{ color: 'var(--b-body)' }}
        >
          <span>{t.navHow}</span>
          <span>{t.navSectors}</span>
          <Link href={`/${locale}/pricing`} style={{ color: 'var(--b-body)' }}>
            {t.navPricing}
          </Link>
          <Link href="/employers" style={{ color: 'var(--b-body)' }}>
            {t.navEmployers}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LocaleToggle locale={locale} />
          <Link href={`/${locale}/dashboard`} className="px-2.5 py-2 text-[15px]" style={{ color: 'var(--b-ink)' }}>
            {t.signIn}
          </Link>
        </div>
      </header>

      {/* Split hero: a white selector card sitting on the blue field. */}
      <section className="grid grid-cols-1 items-center gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div
          className="px-[clamp(20px,4cqi,56px)] py-[clamp(48px,8cqi,110px)]"
          style={{ background: 'var(--b-azulejo)', color: '#fff' }}
        >
          <p className="m-0 mb-5 font-mono text-[12px] uppercase tracking-[0.08em] text-white/70">
            {t.eyebrow}
          </p>
          <h1 className="m-0 max-w-[16ch] text-balance text-[clamp(38px,6.2cqi,76px)] leading-[1.05]">
            {t.heroTitle}
          </h1>
          <p className="mt-6 mb-0 max-w-[54ch] text-[clamp(16px,1.8cqi,19px)] leading-[1.6] text-white/85">
            {t.heroSub}
          </p>
        </div>

        <div className="px-[clamp(20px,4cqi,56px)] py-[clamp(32px,5cqi,64px)]">
          <SectorSelectorB locale={locale} t={t} />
        </div>
      </section>

      <div className="azulejo-strip" aria-hidden />

      {/* what the fee includes */}
      <section className="px-[clamp(20px,4cqi,56px)] py-[clamp(56px,8cqi,104px)]">
        <h2 className="m-0 mb-9 text-[clamp(28px,4cqi,48px)] leading-[1.12]">{t.includesTitle}</h2>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 p-0">
          {t.includes.map(([title, body], index) => (
            <li
              key={title}
              className="p-6"
              style={{
                background: '#fff',
                border: '1px solid var(--b-line)',
                borderRadius: 'var(--b-radius)',
              }}
            >
              <span
                className="flex size-[30px] items-center justify-center font-mono text-[13px] text-white"
                style={{ background: 'var(--b-azulejo)', borderRadius: 'var(--b-radius)' }}
              >
                {index + 1}
              </span>
              <h3 className="mt-4 mb-2 text-[20px]">{title}</h3>
              <p className="m-0 text-[15px] leading-[1.6]" style={{ color: 'var(--b-body)' }}>
                {body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="px-[clamp(20px,4cqi,56px)]">
        <Placeholder
          label="photo · first day at work"
          className="h-[clamp(220px,34cqi,420px)] w-full"
          radius="rounded-[4px]"
        />
      </div>

      {/* UAE placement */}
      <section
        className="mt-[clamp(56px,8cqi,104px)] px-[clamp(20px,4cqi,56px)] py-[clamp(48px,7cqi,88px)]"
        style={{ background: 'var(--b-tint)' }}
      >
        <p className="m-0 mb-3 font-mono text-[12px] uppercase tracking-[0.08em]" style={{ color: 'var(--b-muted)' }}>
          For the selected candidate
        </p>
        <h2 className="m-0 mb-7 text-[clamp(28px,4cqi,48px)] leading-[1.12]">{t.placeTitle}</h2>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3 p-0">
          {t.place.map((line) => (
            <li
              key={line}
              className="px-4 py-3.5 text-[15px]"
              style={{ background: '#fff', border: '1px solid var(--b-line)', borderRadius: 'var(--b-radius)' }}
            >
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-7 mb-0 text-[14px]" style={{ color: 'var(--b-muted)' }}>
          {t.placeFine}{' '}
          <Link href={`/${locale}/selection-rules`} style={{ color: 'var(--b-azulejo)' }}>
            {t.selectionRules}
          </Link>
        </p>
      </section>

      {/* how it works */}
      <section className="px-[clamp(20px,4cqi,56px)] py-[clamp(56px,8cqi,104px)]">
        <h2 className="m-0 mb-9 text-[clamp(28px,4cqi,48px)] leading-[1.12]">{t.howTitle}</h2>
        <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-7 p-0">
          {t.steps.map(([title, body], index) => (
            <li key={title} style={{ borderTop: '2px solid var(--b-azulejo)' }} className="pt-5">
              <span className="font-mono text-[13px]" style={{ color: 'var(--b-azulejo)' }}>
                {index + 1}
              </span>
              <h3 className="mt-2 mb-2 text-[19px]">{title}</h3>
              <p className="m-0 text-[15px] leading-[1.6]" style={{ color: 'var(--b-body)' }}>
                {body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* sectors */}
      <section className="px-[clamp(20px,4cqi,56px)] pb-[clamp(56px,8cqi,104px)]">
        <h2 className="m-0 mb-7 text-[clamp(28px,4cqi,48px)] leading-[1.12]">{t.sectorsTitle}</h2>
        <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
          {t.sectors.map((label, index) => (
            <li
              key={POSITIONS[index]?.slug ?? index}
              className="px-4 py-2.5 text-[15px]"
              style={{ border: '1px solid var(--b-line)', borderRadius: 'var(--b-radius)', background: '#fff' }}
            >
              {label}
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section
        className="flex flex-wrap items-center justify-between gap-6 px-[clamp(20px,4cqi,56px)] py-[clamp(40px,6cqi,72px)]"
        style={{ background: 'var(--b-azulejo)' }}
      >
        <h2 className="m-0 max-w-[24ch] text-[clamp(24px,3.2cqi,40px)] leading-[1.15] text-white">
          {t.ctaTitle}
        </h2>
        <Link
          href={`/${locale}/signup`}
          className="shrink-0 px-5 py-3 text-[15px] font-medium no-underline"
          style={{ background: '#fff', color: 'var(--b-ink)', borderRadius: 'var(--b-radius)' }}
        >
          {t.cta} →
        </Link>
      </section>

      <footer
        className="px-[clamp(20px,4cqi,56px)] py-9 text-[13px]"
        style={{ color: 'var(--b-muted)', borderTop: '1px solid var(--b-line)' }}
      >
        <p className="m-0 mb-2 text-[16px]" style={{ color: 'var(--b-ink)' }}>
          S&A Recruitment
        </p>
        <p className="m-0">
          {t.selectionRules} · {t.footerRefund} · {t.footerPrivacy}
        </p>
        <p className="m-0 mt-2">© 2026 S&A Recruitment</p>
      </footer>
    </div>
  );
}
