import Image from 'next/image';
import Link from 'next/link';
import { Mono } from '@/components/ui/Mono';
import type { CandidateStatus } from '@/lib/candidate/status';
import { localePath, type Locale } from '@/lib/i18n';

type NextStep = {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  image: string;
  imageAlt: string;
};

/**
 * The one thing the candidate should do next, with a real 3D illustration.
 *
 * Keeps the dashboard from feeling like a stack of equal cards: the first
 * viewport is a single composition (status + action + image), not a dashboard
 * of competing panels.
 */
export function DashboardNextStep({
  locale,
  status,
  firstName,
  fee,
  shortlistMin,
  nextInterview,
  applicationCount,
  familyLinkCount = 0,
  highlightFamily = false,
}: {
  locale: Locale;
  status: CandidateStatus;
  firstName: string;
  fee: string;
  shortlistMin: number;
  nextInterview: { title: string; when: string } | null;
  applicationCount: number;
  /** Active family progress links; used to nudge share after purchase. */
  familyLinkCount?: number;
  /** True right after payment return (?paid=). */
  highlightFamily?: boolean;
}) {
  const step = pickStep({
    locale,
    status,
    fee,
    shortlistMin,
    nextInterview,
    applicationCount,
    familyLinkCount,
    highlightFamily,
  });

  return (
    <section className="motion-rise relative overflow-hidden rounded-[28px] border border-line/80 bg-surface">
      <div className="grid items-center gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-4 lg:p-8">
        <div className="relative z-[1] min-w-0">
          <Mono className="text-accent-deep">{step.eyebrow}</Mono>
          <h1 className="m-0 mt-2 text-[clamp(26px,3.6cqi,40px)] font-semibold leading-[1.08] tracking-[-0.03em]">
            {firstName ? `${greeting(status)}, ${firstName}` : step.title}
          </h1>
          {firstName ? (
            <p className="m-0 mt-2 text-[18px] font-medium tracking-[-0.02em] text-ink-2">{step.title}</p>
          ) : null}
          <p className="m-0 mt-3 max-w-[52ch] text-[15px] leading-[1.65] text-ink-2">{step.body}</p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link
              href={step.href}
              className="t-colors inline-flex rounded-full bg-ink px-5 py-3 text-[15px] font-medium text-paper no-underline hover:bg-ink-hover"
            >
              {step.cta}
            </Link>
            {status.assessmentComplete && (
              <Link
                href={localePath(locale, '/jobs')}
                className="t-colors inline-flex rounded-full border border-line-strong bg-surface px-5 py-3 text-[15px] font-medium text-ink no-underline hover:border-ink"
              >
                Browse jobs
              </Link>
            )}
          </div>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-[280px] lg:max-w-none">
          <Image
            src={step.image}
            alt={step.imageAlt}
            fill
            sizes="(max-width: 1024px) 280px, 360px"
            className="illustration object-contain"
            priority
          />
        </div>
      </div>
    </section>
  );
}

function greeting(status: CandidateStatus): string {
  if (status.awaitingPayment) return 'Nice work';
  if (!status.assessmentComplete) return 'Welcome';
  return 'Hello';
}

function pickStep({
  locale,
  status,
  fee,
  shortlistMin,
  nextInterview,
  applicationCount,
  familyLinkCount,
  highlightFamily,
}: {
  locale: Locale;
  status: CandidateStatus;
  fee: string;
  shortlistMin: number;
  nextInterview: { title: string; when: string } | null;
  applicationCount: number;
  familyLinkCount: number;
  highlightFamily: boolean;
}): NextStep {
  if (nextInterview) {
    return {
      eyebrow: 'Next interview',
      title: nextInterview.title,
      body: `${nextInterview.when}. Be ready on time; your recruiter will confirm the link or number.`,
      href: localePath(locale, '/dashboard/applications'),
      cta: 'See interview details',
      image: '/illustrations/track-steps.jpg',
      imageAlt: '3D illustration of application tracking steps',
    };
  }

  if (!status.profileComplete && !status.cvUploaded) {
    return {
      eyebrow: 'Your next step',
      title: 'Finish your profile',
      body: 'Add your experience or upload a CV so employers and our team can see who you are.',
      href: localePath(locale, '/profile'),
      cta: 'Complete profile',
      image: '/illustrations/find-job.jpg',
      imageAlt: '3D illustration of finding a job',
    };
  }

  if (!status.assessmentComplete) {
    const started = status.sectionsDone.length > 0;
    return {
      eyebrow: started
        ? `${status.sectionsDone.length} of ${status.sectionsTotal} parts done`
        : 'Your next step',
      title: started ? 'Finish your skills test' : 'Take the free skills test',
      body: `Skills and English for your trade, up to 90 minutes on your phone. Finish and you join our database. Scores above ${shortlistMin / 10} out of 10 qualify for the shortlist. The career package (${fee}) is optional.`,
      href: localePath(locale, status.nextSection ? `/assessment?section=${status.nextSection}` : '/assessment'),
      cta: started ? 'Continue the test' : 'Start the test',
      image: '/illustrations/skills-test.jpg',
      imageAlt: '3D illustration of a skills test on a phone',
    };
  }

  if (status.awaitingPayment) {
    return {
      eyebrow: 'Optional career package',
      title: 'Will your papers work for Portugal?',
      body: `Your test is done and you are in the database for free. The package (${fee}) starts with a preliminary legal check of your documents, then your full report and a prepared CV. You download each one from this dashboard once it is ready. It gives no shortlist priority.`,
      href: '#package',
      cta: 'See what is included',
      image: '/illustrations/payment.jpg',
      imageAlt: '3D illustration of a secure payment',
    };
  }

  if (applicationCount === 0) {
    return {
      eyebrow: 'You are in the database',
      title: 'Apply to a job in Portugal',
      body: 'Applying is free. Your skills result goes with every application you send.',
      href: localePath(locale, '/jobs'),
      cta: 'Find open jobs',
      image: '/illustrations/find-job.jpg',
      imageAlt: '3D illustration of finding a job in Portugal',
    };
  }

  if (status.paid && !status.reportReady) {
    return {
      eyebrow: 'Your move',
      title: 'Upload documents for your visa file',
      body: 'Passport or national ID lets our legal team start the preliminary review included in your package.',
      href: localePath(locale, '/dashboard/relocation'),
      cta: 'Open Your move',
      image: '/illustrations/visa.jpg',
      imageAlt: '3D illustration of visa documents',
    };
  }

  /* Only right after checkout return (?paid=), so we do not displace "apply" forever. */
  if (status.paid && highlightFamily && familyLinkCount === 0) {
    return {
      eyebrow: 'Share with family',
      title: 'Let family follow your progress',
      body: 'A private link shows your job, city and visa steps — not salary, employer or documents. You can switch it off any time.',
      href: '#family',
      cta: 'Create a family link',
      image: '/illustrations/visa.jpg',
      imageAlt: '3D illustration of sharing progress with family',
    };
  }

  return {
    eyebrow: 'Your applications',
    title: 'Track every step',
    body: 'See where each application stands, and what happens next, in one place.',
    href: localePath(locale, '/dashboard/applications'),
    cta: 'Open tracker',
    image: '/illustrations/track-steps.jpg',
    imageAlt: '3D illustration of tracking application steps',
  };
}
