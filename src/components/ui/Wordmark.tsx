import Link from 'next/link';

/**
 * Text wordmark plus a 22px accent circle. A placeholder until a real logo
 * exists, per the handoff's Assets section.
 *
 * `tone` switches the Devanagari subtitle and label colour for the ink-coloured
 * footers; `accent` switches the dot for the employer and admin surfaces.
 */
export function Wordmark({
  href,
  suffix,
  tone = 'light',
  accent = 'candidate',
}: {
  href?: string;
  suffix?: string;
  tone?: 'light' | 'dark';
  accent?: 'candidate' | 'employer';
}) {
  const inner = (
    <span
      className={`flex items-center gap-2.5 text-[20px] font-bold tracking-[-0.02em] ${
        tone === 'dark' ? 'text-paper' : 'text-ink'
      }`}
    >
      <span
        aria-hidden
        className={`size-[22px] shrink-0 rounded-full ${accent === 'employer' ? 'bg-employer' : 'bg-accent'}`}
      />
      avsar
      <span
        className={`text-[0.72em] font-medium ${tone === 'dark' ? 'text-dark-muted' : 'text-muted'}`}
        lang="hi"
      >
        अवसर
      </span>
      {suffix ? (
        <span className={`text-[0.72em] font-medium ${tone === 'dark' ? 'text-dark-muted' : 'text-muted'}`}>
          {suffix}
        </span>
      ) : null}
    </span>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="no-underline">
      {inner}
    </Link>
  );
}
