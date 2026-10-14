import Link from 'next/link';
import type { ReactNode } from 'react';
import { localHref } from '@/lib/cms/settings';
import { safeUrl } from '@/lib/cms/sanitize';
import type { Locale } from '@/lib/i18n';

/**
 * A small, safe Markdown subset for CMS text.
 *
 * Supports paragraphs, `## headings` (h2/h3), `- lists`, `1. lists`,
 * **bold**, *italic* and [links](/path). Everything becomes React elements, so
 * there is no HTML string anywhere and nothing an editor types can inject
 * script. That is the reason for not pulling in a full Markdown library: the
 * moment raw HTML is allowed, every editor account is an XSS vector.
 */

function inline(text: string, locale: Locale, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const key = `${keyBase}-${i++}`;
    if (match[2]) out.push(<strong key={key} className="font-semibold text-ink">{match[2]}</strong>);
    else if (match[3]) out.push(<em key={key}>{match[3]}</em>);
    else if (match[4] && match[5]) {
      const href = safeUrl(match[5]);
      if (!href) out.push(match[4]);
      else if (href.startsWith('/')) {
        out.push(
          <Link key={key} href={localHref(locale, href)} className="prose-link">
            {match[4]}
          </Link>,
        );
      } else {
        out.push(
          <a key={key} href={href} className="prose-link" target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
            {match[4]}
          </a>,
        );
      }
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text, locale, className = '' }: { text: string; locale: Locale; className?: string }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      const key = `p${blocks.length}`;
      blocks.push(
        <p key={key} className="m-0">
          {inline(paragraph.join(' '), locale, key)}
        </p>,
      );
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      const key = `l${blocks.length}`;
      const Tag = list.ordered ? 'ol' : 'ul';
      blocks.push(
        <Tag key={key} className={`m-0 flex flex-col gap-2 ps-5 ${list.ordered ? 'list-decimal' : 'list-disc'} marker:text-accent`}>
          {list.items.map((item, index) => (
            <li key={index} className="ps-1">
              {inline(item, locale, `${key}-${index}`)}
            </li>
          ))}
        </Tag>,
      );
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = /^(#{2,3})\s+(.*)$/.exec(line);
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);

    if (!line.trim()) {
      flushParagraph();
      flushList();
    } else if (heading) {
      flushParagraph();
      flushList();
      const key = `h${blocks.length}`;
      blocks.push(
        heading[1] === '##' ? (
          <h2 key={key} className="m-0 mt-2 text-[clamp(20px,2.2cqi,24px)] font-semibold tracking-[-0.02em] text-ink">
            {inline(heading[2] ?? '', locale, key)}
          </h2>
        ) : (
          <h3 key={key} className="m-0 mt-1 text-[18px] font-semibold text-ink">
            {inline(heading[2] ?? '', locale, key)}
          </h3>
        ),
      );
    } else if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push((bullet?.[1] ?? numbered?.[1] ?? '').trim());
    } else {
      flushList();
      paragraph.push(line.trim());
    }
  }
  flushParagraph();
  flushList();

  return <div className={`flex flex-col gap-4 leading-[1.7] ${className}`}>{blocks}</div>;
}
