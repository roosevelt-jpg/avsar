import Image from 'next/image';
import Link from 'next/link';
import { link, num, str, type BlockData } from '@/lib/cms/blocks';
import { listFeaturedJobs } from '@/lib/jobs/data';
import { AREAS, POSITIONS } from '@/lib/data/positions';
import { POSITION_LQIP, positionImage } from '@/lib/data/position-images';
import type { Locale } from '@/lib/i18n';
import { JobCard } from '@/components/jobs/JobCard';
import { CmsButton, Section, SectionHeading } from '../primitives';

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
            <CmsButton href={cta.href} label={cta.label} locale={locale} variant="light" />
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

export function JobCategoriesBlock({ data, locale }: Props) {
  return (
    <Section tone="surface" id="sectors">
      <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} intro={str(data, 'intro')} />
      <div className="flex flex-col gap-10">
        {AREAS.map((area) => {
          const positions = POSITIONS.filter((position) => position.area === area.slug);
          if (!positions.length) return null;
          return (
            <div key={area.slug}>
              <h3 className="m-0 mb-4 font-mono text-[12px] uppercase tracking-[0.12em] text-muted">{area.label}</h3>
              <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-4">
                {positions.map((position) => (
                  <li key={position.slug}>
                    <Link
                      href={`/${locale}/jobs?position=${position.slug}`}
                      className="group relative block aspect-[4/3] overflow-hidden rounded-[18px] bg-canvas no-underline"
                    >
                      <Image
                        src={positionImage(position.slug, 420)}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        placeholder="blur"
                        blurDataURL={POSITION_LQIP[position.slug]}
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                      <span className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 text-[15px] font-semibold text-white">
                        {position.label}
                        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
