import Image from 'next/image';
import Link from 'next/link';
import { Mono } from '@/components/ui/Mono';

/**
 * Employer home intro: company name, what to do next, and the hire illustration.
 * Sits above the talent search so the portal feels like a hiring desk, not only
 * a filterable table.
 */
export function EmployerWelcome({
  companyName,
  vacancyCount,
  applicantCount,
  assessed,
}: {
  companyName: string;
  vacancyCount: number;
  applicantCount: number;
  assessed: number;
}) {
  const next =
    vacancyCount === 0
      ? {
          title: 'Request your first vacancy',
          body: 'Tell us the role, city and openings. Our team turns it into a live posting.',
          href: '/admin/vacancies',
          cta: 'Request a vacancy',
        }
      : applicantCount === 0
        ? {
            title: 'Search the talent pool',
            body: `${assessed.toLocaleString('en-GB')} people have finished the skills test. Shortlist who fits, then we introduce you.`,
            href: '#talent-search',
            cta: 'Start searching',
          }
        : {
            title: 'Review your applicants',
            body: `${applicantCount} shortlisted ${applicantCount === 1 ? 'candidate is' : 'candidates are'} waiting on your vacancies.`,
            href: '/admin/applicants',
            cta: 'Open applicants',
          };

  return (
    <section className="motion-rise mb-8 overflow-hidden rounded-[24px] border border-line/80 bg-surface">
      <div className="grid items-center gap-4 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="min-w-0">
          <Mono className="text-employer-deep">{companyName}</Mono>
          <h1 className="m-0 mt-2 text-[clamp(24px,2.8cqi,32px)] font-semibold leading-[1.1] tracking-[-0.03em]">
            {next.title}
          </h1>
          <p className="m-0 mt-2 max-w-[54ch] text-[15px] leading-[1.6] text-ink-2">{next.body}</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href={next.href}
              className="t-colors inline-flex rounded-full bg-ink px-4 py-2.5 text-[14px] font-medium text-paper no-underline hover:bg-ink-hover"
            >
              {next.cta}
            </Link>
            <Link
              href="/admin/vacancies"
              className="t-colors inline-flex rounded-full border border-line-strong bg-surface px-4 py-2.5 text-[14px] font-medium text-ink no-underline hover:border-ink"
            >
              Vacancies
            </Link>
            <Link
              href="/admin/shortlists"
              className="t-colors inline-flex rounded-full border border-line-strong bg-surface px-4 py-2.5 text-[14px] font-medium text-ink no-underline hover:border-ink"
            >
              Shortlists
            </Link>
          </div>
          <ul className="m-0 mt-6 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 font-mono text-[12px] text-muted">
            <li>{vacancyCount} vacancies</li>
            <li>{applicantCount} applicants</li>
            <li>{assessed.toLocaleString('en-GB')} assessed in the pool</li>
          </ul>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-[220px] lg:max-w-[260px]">
          <Image
            src="/illustrations/hire.jpg"
            alt="3D illustration of hiring workers from India"
            fill
            sizes="260px"
            className="illustration object-contain"
            priority
          />
        </div>
      </div>
    </section>
  );
}
