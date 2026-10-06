import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mono } from '@/components/ui/Mono';
import { Wordmark } from '@/components/ui/Wordmark';

export const metadata = { title: 'Screen index' };

/**
 * Screen index, development only.
 *
 * The handoff is explicit that the prototype's dark screen-switcher bar is
 * prototype chrome and must not be built. This is a separate page rather than
 * navigation inside the product, and it 404s in production, so it cannot leak
 * into what a candidate or employer sees.
 */
const GROUPS: { title: string; note: string; rows: [string, string, string][] }[] = [
  {
    title: 'Candidate, Direction A',
    note: 'Build this one unless the owner picks B.',
    rows: [
      ['/en', '01 Landing', 'hero selector, fee breakdown, odds disclosure'],
      ['/hi', '01 Landing, Hindi', 'same page, full Hindi dictionary'],
      ['/en/signup', '03 Sign-up + pay', '3 steps, order summary, mandatory consent'],
      ['/en/signin', 'Sign in (all roles)', 'password for staff and employers, code for candidates'],
      ['/en/assessment', '04 Assessment', 'server timer, autosave, A-D keys'],
      ['/en/profile', 'Profile', 'CV upload or manual entry, ATS-style fields'],
      ['/en/dashboard', '05 Dashboard', 'real journey status, report, visibility switch'],
      ['/en/pricing', '07 Pricing + FAQ', '3 plans, accordion'],
    ],
  },
  {
    title: 'Candidate, Direction B',
    note: 'Alternative visual direction, isolated tokens. Landing only.',
    rows: [
      ['/en/b', 'Landing, Direction B', 'azulejo blue, DM Serif, 4px radii'],
      ['/hi/b', 'Landing, Direction B, Hindi', ''],
    ],
  },
  {
    title: 'Employer and internal',
    note: 'Blue accent.',
    rows: [
      ['/employers', '02 Employer landing', 'plain-language search, sample results'],
      ['/admin', '06 Talent search', 'parsed query, filters in the URL, pagination'],
      ['/admin/cvs', 'CV queue', 'trigger the AI read, see state and score'],
      ['/admin/review/sample', 'CV review (AI-assisted)', 'scores with evidence, then a human decision'],
    ],
  },
  {
    title: 'Legal',
    note: 'Every odds disclosure links here. All marked DRAFT, all need review.',
    rows: [
      ['/en/selection-rules', 'Selection rules', 'the odds, in plain words'],
      ['/en/refund-policy', 'Refund policy', ''],
      ['/en/privacy', 'Privacy', 'includes the automated-decisions section'],
      ['/en/contact', 'Contact', 'includes the off-platform fee report channel'],
    ],
  },
  {
    title: 'Transactional email',
    note: 'Rendered, not sent. Nothing here writes a row or touches a real address.',
    rows: [
      ['/dev/email?template=verification', 'Confirm your address', 'sent at registration and on resend'],
      ['/dev/email?template=verification&locale=hi', 'Confirm your address, Hindi', ''],
      ['/dev/email?template=reminder&stage=profile', 'Reminder 1, profile unfinished', 'the account was opened and abandoned'],
      ['/dev/email?template=reminder&stage=assessment', 'Reminder 2, assessment not taken', 'profile done, nothing owed yet'],
      ['/dev/email?template=reminder&stage=assessment&locale=hi', 'Reminder, Hindi', ''],
    ],
  },
];

export default function DevIndex() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className="avsar-root">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-[clamp(20px,4cqi,56px)] py-[18px]">
        <Wordmark href="/en" />
        <Mono className="text-muted">Development only · not served in production</Mono>
      </header>

      <main className="px-[clamp(20px,4cqi,56px)] py-[clamp(32px,5cqi,64px)]">
        <h1 className="m-0 text-[clamp(28px,4cqi,48px)] font-semibold leading-[1.1] tracking-[-0.03em]">
          Screen index
        </h1>
        <p className="mt-3 mb-10 max-w-[60ch] text-[16px] leading-[1.6] text-ink-2">
          Every screen in the build. The product itself has no switcher like this: the
          handoff rules that out, so this page exists separately and 404s in production.
        </p>

        <div className="flex flex-col gap-10">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <h2 className="m-0 text-[21px] font-semibold">{group.title}</h2>
              <p className="mt-1.5 mb-4 text-[14px] text-muted">{group.note}</p>
              <ul className="m-0 list-none rounded-[16px] border border-line bg-surface p-0">
                {group.rows.map(([href, label, detail]) => (
                  <li key={href} className="border-b border-line-soft last:border-b-0">
                    <Link
                      href={href}
                      className="t-colors flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-4 no-underline hover:bg-surface-hover"
                    >
                      <Mono className="min-w-[180px] text-accent">{href}</Mono>
                      <span className="text-[15px] font-medium">{label}</span>
                      {detail ? <span className="text-[13px] text-muted">{detail}</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
