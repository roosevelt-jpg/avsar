import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mono } from '@/components/ui/Mono';
import { PhoneWalkthrough } from '@/components/candidate/PhoneWalkthrough';
import { Reveal } from '@/components/motion/Reveal';
import { PositionGrid } from '@/components/candidate/PositionGrid';
import { IntroVideo } from '@/components/candidate/IntroVideo';
import { positionCopy } from '@/lib/data/position-copy';
import { SiteHeader } from '@/components/candidate/SiteHeader';
import { SiteFooter } from '@/components/candidate/SiteFooter';
import { PositionSelector } from '@/components/candidate/PositionSelector';
import { fill, getDictionary, isLocale } from '@/lib/i18n';
import { activePrice, formatInr } from '@/lib/data/cohort';
import {
  BRAND,
  CONTRACT_YEARS,
  RESPONSE_DAYS,
  SELECTION_FUNNEL,
  applicantHireRate,
  ASSESSMENT_FEE,
  CANDIDATE_PAYS_NO_PLACEMENT_FEE,
  PLACEMENT_FEE,
} from '@/lib/data/brand';

export default async function CandidateLanding({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  const money = { days: RESPONSE_DAYS, years: CONTRACT_YEARS, inr: formatInr(activePrice().totalPaise) };

  const stages = SELECTION_FUNNEL.perHundredApplicants;
  const funnelValues = {
    complete: stages.completeAssessment,
    call: stages.reachAssessmentCall,
    presented: stages.presentedToEmployer,
    hired: stages.hired,
    applicantRate: applicantHireRate(),
    fee: formatInr(activePrice().totalPaise),
  };

  return (
    <>
      <SiteHeader locale={locale} />

      {/*
        The hero reads across rather than down.

        It used to be one centred column: badge, headline, paragraph, film,
        selector. Centred text that long is hard to read, and the film sat below
        the fold on a laptop, which is the one thing on the page that explains
        the product in under a minute. The claim and the film now sit side by
        side, so both are visible at once, and the jobs follow immediately.
      */}
      <section className="px-[clamp(20px,4cqi,56px)] pt-[clamp(32px,6cqi,72px)] pb-[clamp(32px,5cqi,64px)]">
        <p className="m-0 inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-[14px] py-1.5 font-mono text-[12px] text-ink-2">
          <span aria-hidden className="size-[7px] rounded-full bg-success" />
          {t.eyebrow}
        </p>

        {/*
          Who is behind this, said once and early.

          It used to appear only in the orange band, which a candidate reached
          after the steps, the fee and the funnel. The name of an established
          group is worth more to somebody deciding whether to trust an unknown
          recruitment site than it is to somebody already convinced, so it is
          read before the claim rather than after it.

          The mark is the ink version. The one in the footer is white artwork
          over transparency, drawn for a dark band, and it would be invisible
          here; this is the same alpha channel with the colour swapped, so the
          letterforms are identical rather than resampled.

          It opens in a new tab deliberately. Somebody halfway through deciding
          whether to apply should be able to go and look at the group without
          losing this page.
        */}
        <div className="mt-6 mb-[clamp(24px,4cqi,44px)]">
          <a
            href="https://www.smithandadams.com"
            target="_blank"
            rel="noopener noreferrer"
            className="t-colors inline-block opacity-80 hover:opacity-100"
          >
            <Image
              src="/smith-adams-group-ink-640.png"
              alt={`${BRAND.parent} Group`}
              width={640}
              height={136}
              className="h-auto w-[164px]"
            />
          </a>
          <p className="m-0 mt-3 text-[15px] leading-[1.5] text-muted">{BRAND.tagline}</p>
        </div>

        <div className="grid items-center gap-[clamp(28px,5cqi,64px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div>
            <h1 className="m-0 max-w-[20ch] text-balance text-[clamp(32px,4.4cqi,54px)] font-semibold leading-[1.06] tracking-[-0.035em]">
              {t.heroTitle}
            </h1>

            <p className="mt-5 mb-0 max-w-[52ch] text-[clamp(16px,1.6cqi,18px)] leading-[1.6] text-ink-2">
              {t.heroSub}
            </p>
          </div>

          {/*
            Second in the markup, so a phone gets the claim before the film.

            Directly a grid child rather than wrapped. A wrapper with
            `justify-self-end` shrinks to fit its contents, which left the
            figure's `w-full` resolving against nothing and the film rendering
            at about a third of its column.
          */}
          <IntroVideo t={t} />
        </div>
      </section>

      {/*
        The call to action, straight after the film.

        It used to close the page. Somebody who has just watched a minute of
        film is as ready to apply as they will ever be, and making them scroll
        past five sections to find the button spent that.

        The tagline that used to sit here has moved to the top of the page.
      */}
      <section className="px-[clamp(20px,4cqi,56px)] pb-[clamp(44px,6cqi,80px)]">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[28px] bg-accent px-[clamp(24px,4cqi,56px)] py-[clamp(28px,4cqi,48px)]">
          <h2 className="m-0 max-w-[24ch] text-[clamp(24px,3.2cqi,40px)] font-semibold leading-[1.15] tracking-[-0.03em] text-white">
            {t.ctaTitle}
          </h2>
          <Link
            href={`/${locale}/signup`}
            className="t-colors shrink-0 rounded-[12px] bg-white px-5 py-3 text-[15px] font-medium text-ink no-underline hover:bg-paper"
          >
            {t.cta} →
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------------------ positions */}
      <section id="sectors" className="px-[clamp(20px,4cqi,56px)] pb-[clamp(48px,7cqi,88px)]">
        <h2 className="m-0 mb-8 max-w-[24ch] text-[clamp(28px,4cqi,48px)] font-semibold leading-[1.1] tracking-[-0.03em]">
          {t.sectorsTitle}
        </h2>
        <PositionGrid locale={locale} t={t} copy={positionCopy(locale)} />
      </section>

      {/* ------------------------------------------------------------- apply */}
      <section className="flex flex-col items-center gap-6 px-[clamp(20px,4cqi,56px)] pb-[clamp(40px,6cqi,80px)] text-center">
        <PositionSelector locale={locale} t={t} />
        <p className="m-0 max-w-[70ch] text-[13px] leading-[1.55] text-muted">{fill(t.fine, money)}</p>
      </section>

      {/*
        A real kitchen in Lisbon, in a business the group runs.

        Chosen over stock for two reasons. It is the work this page is actually
        about, rather than a photograph of somebody else's. And neither face is
        visible, which matters: a licence covers a photograph, not the person in
        it, and putting an identifiable face on a recruitment advert implies
        they are connected to the service.

        `blurDataURL` is a twenty-pixel version inlined, so the band holds the
        picture rather than a hole while the file arrives over Indian mobile
        data.
      */}
      <div className="px-[clamp(20px,4cqi,56px)] pb-[clamp(40px,6cqi,80px)]">
        <div className="relative h-[clamp(220px,38cqi,460px)] w-full overflow-hidden rounded-[24px]">
          <Image
            src="/lisbon-kitchen-2400.jpg"
            alt="Two kitchen staff preparing food behind the counter of a café in Lisbon"
            fill
            sizes="(max-width: 900px) 100vw, 1400px"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAMABQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCvFcyXiTIrhFB4ZW+Zu5xTF1pxKyyAkou0AH7pHesbz5IYg6OQWYqfyq5Y2yXeoHzS3zAMcetQ0i7m1/aN84DIsJUjIJbH9aKzZrWNpSrgvs+VS3YdhRSuh2Z//9k="
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* ------------------------------------------------------- the six steps */}
      <section id="how" className="bg-ink px-[clamp(20px,4cqi,56px)] py-[clamp(56px,8cqi,104px)] text-paper">
        {/* One measure for the whole section. The heading used to start at the
            page gutter while the walkthrough was centred under it, so the block
            had two different left edges. */}
        <div className="mx-auto max-w-[880px]">
          <Reveal>
            <h2 className="m-0 max-w-[20ch] text-[clamp(28px,4cqi,48px)] font-semibold leading-[1.1] tracking-[-0.03em]">
              {t.process.title}
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="mt-3 mb-[clamp(40px,6cqi,72px)] max-w-[52ch] text-[17px] leading-[1.55] text-dark-muted-2">
              {t.process.lead}
            </p>
          </Reveal>

          <PhoneWalkthrough t={t} />

          <div className="mt-[clamp(40px,6cqi,64px)] border-t border-dark-line pt-6">
            <p className="m-0 max-w-[60ch] text-[16px] leading-[1.6] text-paper">
              {fill(t.process.responseNote, money)}
            </p>
          </div>
        </div>
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

        {/* Both are derived, never written into copy, so neither claim can
            outlive the setting that makes it true. The placement fee is shown
            to candidates precisely because they are the ones who pay it: the
            worst version of this is the one nobody mentions until the end. */}
        {CANDIDATE_PAYS_NO_PLACEMENT_FEE && (
          <p className="mt-5 mb-0 max-w-[62ch] rounded-[16px] border border-accent bg-accent-tint px-5 py-4 text-[15px] leading-[1.6] text-ink">
            {t.noPlacementFee}
          </p>
        )}

        {PLACEMENT_FEE.visibleToCandidates && (
          <p className="mt-5 mb-0 max-w-[62ch] rounded-[16px] border border-accent bg-accent-tint px-5 py-4 text-[15px] leading-[1.6] text-ink">
            {fill(t.placementFee, {
              eur: PLACEMENT_FEE.eur.toLocaleString('en-GB'),
              inr: formatInr(activePrice().totalPaise),
            })}
          </p>
        )}
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
            <Link href={`/${locale}/selection-rules`} className="prose-link">
              {t.selectionRules}
            </Link>
          </p>
        </div>

        {/*
          Lisbon, not a bedroom.

          The slot was labelled "staff accommodation", and a stock photograph of
          an unrelated flat beside a list that promises housing would read as a
          picture of the housing. This shows the city the job is in, which is
          something the page can stand behind: the bridge and the Cristo Rei are
          what make it unmistakably Lisbon rather than any red-roofed town.
        */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[24px]">
          <Image
            src="/lisbon-rooftops-1200.jpg"
            alt="Rooftops of central Lisbon, with the 25 de Abril bridge on the horizon"
            fill
            sizes="(max-width: 900px) 100vw, 480px"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA8Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2ODApLCBxdWFsaXR5ID0gMTAwCv/bAEMAFA4PEg8NFBIQEhcVFBgeMiEeHBwePSwuJDJJQExLR0BGRVBac2JQVW1WRUZkiGVtd3uBgoFOYI2XjH2Wc36BfP/bAEMBFRcXHhoeOyEhO3xTRlN8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fP/AABEIABQAEAMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEBAAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/AN1YFPQj86kFuvqK5rzZF4K7sdQrZNNWaR2IUjYezHDfjmtOdkciMiaeRiq7yFY8gU+WR4UwjtheRk0UVkbPc//Z"
            className="object-cover"
          />
        </div>
      </section>

      {/* -------------------------------------------------------------- funnel */}
      {SELECTION_FUNNEL.visible && (
        <section className="px-[clamp(20px,4cqi,56px)] pb-[clamp(56px,8cqi,104px)]">
          <div className="rounded-[28px] border border-line bg-surface p-[clamp(24px,4cqi,56px)]">
            <h2 className="m-0 max-w-[22ch] text-[clamp(26px,3.6cqi,44px)] font-semibold leading-[1.1] tracking-[-0.03em]">
              {t.funnelTitle}
            </h2>
            <p className="mt-4 mb-8 max-w-[58ch] text-[17px] leading-[1.55] text-ink-2">
              {fill(t.rateLine, { rate: SELECTION_FUNNEL.presentedToHirePercent })}
            </p>

            <Mono className="mb-4 block text-muted">{t.funnelLead}</Mono>

            <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4 p-0">
              {t.funnelStages.map(([title, body], index) => {
                const stage = [
                  SELECTION_FUNNEL.perHundredApplicants.completeAssessment,
                  SELECTION_FUNNEL.perHundredApplicants.reachAssessmentCall,
                  SELECTION_FUNNEL.perHundredApplicants.presentedToEmployer,
                  SELECTION_FUNNEL.perHundredApplicants.hired,
                ][index] ?? 0;
                const last = index === t.funnelStages.length - 1;
                return (
                  <li
                    key={title}
                    className={`rounded-[16px] p-5 ${last ? 'bg-ink text-paper' : 'bg-surface-subtle'}`}
                  >
                    {/* Bar width is the stage share, so the drop is visible
                        rather than something the reader has to infer. */}
                    <div className={`mb-4 h-1.5 overflow-hidden rounded-full ${last ? 'bg-dark-line' : 'bg-line-soft'}`}>
                      <div
                        className={`h-full rounded-full ${last ? 'bg-success' : 'bg-accent'}`}
                        style={{ width: `${Math.max(3, stage)}%` }}
                      />
                    </div>
                    <p className="m-0 mb-1.5 text-[17px] font-semibold leading-[1.3]">
                      {fill(title, funnelValues)}
                    </p>
                    <p className={`m-0 text-[14px] leading-[1.55] ${last ? 'text-dark-muted-2' : 'text-ink-2'}`}>
                      {fill(body, funnelValues)}
                    </p>
                  </li>
                );
              })}
            </ol>

            <p className="mt-8 mb-0 max-w-[66ch] border-t border-line pt-6 text-[14px] leading-[1.6] text-muted">
              {fill(t.funnelNote, funnelValues)}
            </p>
          </div>
        </section>
      )}

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

      <SiteFooter locale={locale} />
    </>
  );
}
