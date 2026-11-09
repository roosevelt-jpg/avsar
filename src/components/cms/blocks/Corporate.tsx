'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { items, str, type BlockData } from '@/lib/cms/blocks';
import { localHref } from '@/lib/cms/settings';
import type { Locale } from '@/lib/i18n';
import { CmsImage, Section, SectionHeading } from '../primitives';

type Props = { data: BlockData; locale: Locale };

/**
 * Corporate Info sub-nav. Active link is derived from the current pathname so
 * every Corporate page can share the same CMS block without hardcoding “current”.
 */
export function CorporateNavBlock({ data, locale }: Props) {
  const pathname = usePathname() || '';
  const list = items(data, 'items').filter((item) => str(item, 'label') && str(item, 'href'));
  if (!list.length) return null;

  return (
    <section className="border-b border-line bg-[#f4f5f7] px-[clamp(16px,3cqi,40px)] py-2.5">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-2 md:flex-row md:items-center md:gap-4">
        {str(data, 'eyebrow') ? (
          <p className="m-0 shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b28a49]">
            {str(data, 'eyebrow')}
          </p>
        ) : null}
        <nav aria-label={str(data, 'eyebrow') || 'Corporate Info'} className="min-w-0">
          <ul className="m-0 flex list-none flex-wrap gap-1 p-0">
            {list.map((item, index) => {
              const href = str(item, 'href');
              const resolved = localHref(locale, href);
              const pathOnly = resolved.split(/[?#]/)[0] ?? resolved;
              const active =
                pathname === pathOnly ||
                pathname.endsWith(pathOnly) ||
                (href !== '/' && (pathname.endsWith(href) || pathname.includes(`${href}/`)));
              return (
                <li key={`${href}-${index}`}>
                  <Link
                    href={resolved}
                    aria-current={active ? 'page' : undefined}
                    className={`inline-flex rounded-md px-2.5 py-1 text-[13px] no-underline transition-colors ${
                      active
                        ? 'bg-[#142438] font-semibold text-white'
                        : 'text-[#142438] hover:bg-white'
                    }`}
                  >
                    {str(item, 'label')}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </section>
  );
}

/**
 * Organisation chart by level. Compact cards so a full leadership + team
 * roster stays readable without oversized portraits.
 */
export function OrgChartBlock({ data }: Props) {
  const list = items(data, 'items').filter((item) => str(item, 'role') || str(item, 'name'));
  if (!list.length) return null;

  const byLevel = new Map<string, BlockData[]>();
  for (const person of list) {
    const level = str(person, 'level') || '1';
    const row = byLevel.get(level) ?? [];
    row.push(person);
    byLevel.set(level, row);
  }
  const levels = [...byLevel.keys()].sort((a, b) => Number(a) - Number(b));

  return (
    <Section className="!py-[clamp(28px,4cqi,48px)]">
      <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} intro={str(data, 'intro')} align="center" />
      <div className="flex flex-col items-center gap-5">
        {levels.map((level, levelIndex) => {
          const row = byLevel.get(level) ?? [];
          return (
            <div key={level} className="flex w-full flex-col items-center gap-3">
              {levelIndex > 0 ? (
                <div className="h-5 w-px bg-[#142438]/15" aria-hidden />
              ) : null}
              <ul className="m-0 flex list-none flex-wrap justify-center gap-3 p-0 sm:gap-4">
                {row.map((person, index) => {
                  const name = str(person, 'name');
                  const role = str(person, 'role');
                  const image = str(person, 'image');
                  const bio = str(person, 'bio');
                  const heading = name || role;
                  const showRoleUnderName = Boolean(name && role && name !== role);
                  return (
                    <li
                      key={`${level}-${index}`}
                      className="flex w-[min(100%,148px)] flex-col items-center text-center sm:w-[158px]"
                    >
                      <div className="relative size-[72px] overflow-hidden rounded-full bg-[#e8edf2] ring-1 ring-[#142438]/10 sm:size-[80px]">
                        {image ? <CmsImage src={image} alt={heading} sizes="80px" /> : null}
                      </div>
                      {heading ? (
                        <p className="m-0 mt-2.5 text-[14px] font-semibold leading-[1.25] tracking-[-0.02em] text-[#142438]">
                          {heading}
                        </p>
                      ) : null}
                      {showRoleUnderName ? (
                        <p className="m-0 mt-0.5 text-[12px] font-medium leading-[1.35] text-[#b28a49]">{role}</p>
                      ) : null}
                      {bio ? <p className="m-0 mt-1.5 text-[12px] leading-[1.4] text-ink-2">{bio}</p> : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
