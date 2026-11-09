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
    <section className="border-b border-line bg-[#f4f5f7] px-[clamp(20px,4cqi,56px)] py-4">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 md:flex-row md:items-center md:gap-6">
        {str(data, 'eyebrow') ? (
          <p className="m-0 shrink-0 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#b28a49]">
            {str(data, 'eyebrow')}
          </p>
        ) : null}
        <nav aria-label={str(data, 'eyebrow') || 'Corporate Info'} className="min-w-0">
          <ul className="m-0 flex list-none flex-wrap gap-x-1 gap-y-2 p-0">
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
                    className={`inline-flex rounded-md px-3 py-1.5 text-[14px] no-underline transition-colors ${
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
 * Organisation chart by level. Name, role, photo and bio come from the CMS;
 * missing fields simply omit that line — no instructional placeholders.
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
    <Section>
      <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} intro={str(data, 'intro')} align="center" />
      <div className="flex flex-col items-center gap-8">
        {levels.map((level, levelIndex) => {
          const row = byLevel.get(level) ?? [];
          return (
            <div key={level} className="flex w-full flex-col items-center gap-4">
              {levelIndex > 0 ? (
                <div className="h-8 w-px bg-[#142438]/20" aria-hidden />
              ) : null}
              <ul className="m-0 flex list-none flex-wrap justify-center gap-5 p-0 md:gap-7">
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
                      className="flex w-[min(100%,220px)] flex-col items-center text-center"
                    >
                      <div className="relative size-[112px] overflow-hidden rounded-full bg-[#e8edf2] ring-1 ring-[#142438]/10">
                        {image ? <CmsImage src={image} alt={heading} sizes="112px" /> : null}
                      </div>
                      {heading ? (
                        <p className="m-0 mt-4 text-[17px] font-semibold tracking-[-0.02em] text-[#142438]">
                          {heading}
                        </p>
                      ) : null}
                      {showRoleUnderName ? (
                        <p className="m-0 mt-1 text-[14px] font-medium text-[#b28a49]">{role}</p>
                      ) : null}
                      {bio ? <p className="m-0 mt-2 text-[13px] leading-[1.5] text-ink-2">{bio}</p> : null}
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
