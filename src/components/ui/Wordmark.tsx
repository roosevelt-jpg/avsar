import Link from 'next/link';
import { BRAND } from '@/lib/data/brand';

/**
 * Wordmark. A placeholder until a real logo exists.
 *
 * The parent brand is carried in the mark rather than only in the footer,
 * because that association is the reason a candidate in India has any reason to
 * trust this at all. Hiding it in small print would waste the only credibility
 * the product starts with.
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
      className={`flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-[20px] font-bold tracking-[-0.02em] ${
        tone === 'dark' ? 'text-paper' : 'text-ink'
      }`}
    >
      <span className="flex items-center gap-2.5">
        <span
          aria-hidden
          className={`size-[22px] shrink-0 rounded-full ${accent === 'employer' ? 'bg-employer' : 'bg-accent'}`}
        />
        {BRAND.name}
      </span>
      {suffix ? (
        <span className={`text-[0.7em] font-medium ${tone === 'dark' ? 'text-dark-muted' : 'text-muted'}`}>
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
