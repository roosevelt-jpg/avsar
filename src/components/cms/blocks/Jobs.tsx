import { link, num, str, type BlockData } from '@/lib/cms/blocks';
import { siteText } from '@/lib/cms/localize';
import { listPublicEmployers } from '@/lib/employer/marks';
import { listFeaturedJobs } from '@/lib/jobs/data';
import { AREAS, POSITIONS } from '@/lib/data/positions';
import { POSITION_LQIP, positionImage } from '@/lib/data/position-images';
import type { Locale } from '@/lib/i18n';
import { localePath } from '@/lib/i18n/path';
import Link from 'next/link';
import { JobCard } from '@/components/jobs/JobCard';
import { CmsTextLink, Section, SectionHeading } from '../primitives';
import { EmployerStrip } from './EmployerStrip';
import { RoleShowcase } from './RoleShowcase';

type Props = { data: BlockData; locale: Locale };

export async function FeaturedJobsBlock({ data, locale }: Props) {
  const jobs = await listFeaturedJobs(num(data, 'limit', 6));
  const cta = link(data, 'cta');
  return (
    <Section id="jobs">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} intro={str(data, 'intro')} />
        {cta && (
          <div className="mb-[clamp(28px,4cqi,48px)]">
            <CmsTextLink href={cta.href} label={cta.label} locale={locale} />
          </div>
        )}
      </div>
      {jobs.length === 0 ? (
        <p className="m-0 rounded-[20px] border border-dashed border-line-strong bg-surface px-6 py-10 text-center text-[16px] text-ink-2">
          New jobs are being confirmed with employers. Create your profile and we will tell you as soon as one fits you.
        </p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job, index) => (
            <li key={job.id} className="flex">
              <div className="w-full">
                <JobCard job={job} locale={locale} priority={index < 3} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/**
 * Every public employer as a DSS-style sliding logo row. Heading and optional
 * CTA come from CMS; logos come from the employers table (never invented).
 * With no employers yet the section stays out rather than showing empty cards.
 */
export async function FeaturedEmployersBlock({ data, locale }: Props) {
  const employers = await listPublicEmployers();
  if (employers.length === 0) return null;
  const eyebrow = str(data, 'eyebrow');
  const title = siteText(locale, str(data, 'title') || 'As featured in');
  const cta = link(data, 'cta');
  return (
    <section className="bg-[#f7f8fa] px-[clamp(20px,4cqi,56px)] py-[clamp(40px,6cqi,72px)]">
      <div className="mx-auto w-full max-w-[1200px]">
        {eyebrow ? (
          <p className="m-0 mb-2 text-center text-[12px] font-semibold uppercase tracking-[0.16em] text-[#b28a49]">{eyebrow}</p>
        ) : null}
        <h2 className="m-0 text-center text-[clamp(26px,3.2cqi,36px)] font-semibold tracking-[-0.02em] text-[#142438]">{title}</h2>
        <div className="mt-6">
          <EmployerStrip
            employers={employers}
            previousLabel={siteText(locale, 'Previous employers')}
            nextLabel={siteText(locale, 'Next employers')}
          />
        </div>
        {cta?.href && cta.label ? (
          <div className="mt-8 flex justify-center">
            <Link
              href={localePath(locale, cta.href)}
              className="inline-flex items-center justify-center rounded-[6px] border border-[#142438] bg-white px-6 py-2.5 text-[14px] font-semibold text-[#142438] transition-colors hover:border-[#b28a49] hover:bg-[#142438] hover:text-white"
            >
              {cta.label}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function JobCategoriesBlock({ data, locale }: Props) {
  const eyebrow = str(data, 'eyebrow');
  const title = str(data, 'title');
  const areas = AREAS.map((area) => ({
    slug: area.slug,
    label: siteText(locale, area.label),
    roles: POSITIONS.filter((position) => position.area === area.slug).map((position) => ({
      slug: position.slug,
      label: siteText(locale, position.label),
      href: localePath(locale, `/jobs?position=${position.slug}`),
      image: positionImage(position.slug, 840),
      blur: POSITION_LQIP[position.slug],
    })),
  })).filter((area) => area.roles.length > 0);

  return (
    <Section className="!bg-white" id="sectors">
      {eyebrow ? <p className="m-0 mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#b28a49]">{eyebrow}</p> : null}
      {title ? (
        <h2 className="m-0 mb-8 text-balance text-[clamp(32px,4.2cqi,52px)] font-semibold leading-[1.05] tracking-[-0.03em] text-[#142438]">{title}</h2>
      ) : null}
      <RoleShowcase
        areas={areas}
        intro={str(data, 'intro')}
        label={title || eyebrow}
        previousLabel={siteText(locale, 'Previous role')}
        nextLabel={siteText(locale, 'Next role')}
      />
    </Section>
  );
}
