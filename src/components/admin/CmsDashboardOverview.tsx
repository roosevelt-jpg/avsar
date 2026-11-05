import Image from 'next/image';
import Link from 'next/link';
import type { MediaItem, PageListEntry } from '@/lib/cms/data';
import type { Locale } from '@/lib/i18n';

export type PageStatusKind = 'live_default' | 'published' | 'dirty' | 'draft';

export type PageRow = {
  slug: string;
  title: string;
  path: string;
  status: PageStatusKind;
  updatedLabel: string;
};

/** English row status for the CMS dashboard table — one line per page. */
export function pageRowFromEntry(page: PageListEntry, locale: Locale = 'en'): PageRow {
  const entry = page.locales.find((l) => l.locale === locale) ?? page.locales[0];
  let status: PageStatusKind = 'live_default';
  if (entry?.stored) {
    if (!entry.publishedAt) status = 'draft';
    else if (entry.dirty) status = 'dirty';
    else status = 'published';
  }
  const updated = entry?.updatedAt ?? entry?.publishedAt;
  return {
    slug: page.slug,
    title: page.title,
    path: page.path || '/',
    status,
    updatedLabel: updated
      ? new Date(updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Shipped default',
  };
}

export function cmsPageStats(pages: PageListEntry[], locale: Locale = 'en') {
  const rows = pages.map((p) => pageRowFromEntry(p, locale));
  return {
    total: rows.length,
    published: rows.filter((r) => r.status === 'published' || r.status === 'live_default').length,
    draft: rows.filter((r) => r.status === 'draft').length,
    dirty: rows.filter((r) => r.status === 'dirty').length,
  };
}

/** Soft SEO health from page coverage — not a third-party crawl score. */
export function cmsSeoHealth(pages: PageListEntry[], locale: Locale = 'en') {
  const rows = pages.map((p) => pageRowFromEntry(p, locale));
  const live = rows.filter((r) => r.status === 'published' || r.status === 'live_default' || r.status === 'dirty').length;
  const score = pages.length ? Math.round((live / pages.length) * 100) : 0;
  return {
    score,
    live,
    total: pages.length,
    checks: [
      { label: `Pages live or published (${live}/${pages.length})`, ok: live === pages.length },
      { label: 'Drafts waiting to publish', ok: rows.every((r) => r.status !== 'draft') },
      { label: 'Unpublished edits', ok: rows.every((r) => r.status !== 'dirty'), note: rows.some((r) => r.status === 'dirty') ? 'Publish dirty pages' : undefined },
    ],
  };
}

export function CmsDashHero({ canEdit }: { canEdit: boolean }) {
  return (
    <section className="relative overflow-hidden rounded-[18px] bg-[#142438] text-white">
      <Image
        src="/photos/brand/footer-lisbon.jpg"
        alt=""
        fill
        priority
        sizes="(max-width: 1280px) 100vw, 1200px"
        className="object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#142438]/95 via-[#142438]/80 to-[#142438]/45" />
      <div className="relative z-[1] grid items-center gap-6 px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="m-0 text-[12px] font-medium uppercase tracking-[0.14em] text-[#e8c56a]">Website &amp; CMS Management</p>
          <h1
            className="m-0 mt-2 text-[clamp(24px,3.2cqi,36px)] font-semibold leading-[1.12] tracking-[-0.02em]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Manage Your Website Content
          </h1>
          <p className="m-0 mt-3 max-w-[52ch] text-[15px] leading-[1.6] text-white/85">
            Edit and publish pages, update navigation, manage media and SEO — all from one place. Nothing goes live until
            you publish.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-[8px] bg-[#b28a49] px-4 py-2.5 text-[14px] font-semibold text-[#142438] no-underline hover:bg-[#c9a35f]"
            >
              View Live Website
            </a>
            {canEdit ? (
              <Link
                href="/admin/cms/home"
                className="inline-flex rounded-[8px] border border-white/55 px-4 py-2.5 text-[14px] font-medium text-white no-underline hover:bg-white/10"
              >
                Edit Homepage
              </Link>
            ) : null}
          </div>
        </div>
        <div className="relative mx-auto hidden aspect-[4/3] w-full max-w-[320px] lg:block">
          <Image
            src="/photos/brand/jobs-hero-1.jpg"
            alt=""
            fill
            sizes="320px"
            className="rounded-[12px] object-cover shadow-[0_24px_60px_-28px_rgba(0,0,0,0.65)]"
          />
        </div>
      </div>
    </section>
  );
}

export function CmsStatStrip({
  stats,
  mediaCount,
}: {
  stats: ReturnType<typeof cmsPageStats>;
  mediaCount: number;
}) {
  const cards = [
    { value: String(stats.total), label: 'Total Pages' },
    { value: String(stats.published), label: 'Published / live' },
    { value: String(stats.draft), label: 'Drafts' },
    { value: String(stats.dirty), label: 'Unpublished edits' },
    { value: String(mediaCount), label: 'Media items' },
  ];
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <li
          key={card.label}
          className="rounded-[14px] border border-[#142438]/08 bg-white p-4 shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]"
        >
          <p className="m-0 text-[22px] font-semibold leading-none tracking-[-0.03em] text-[#142438]">{card.value}</p>
          <p className="m-0 mt-1.5 text-[12px] leading-snug text-[#5c7084]">{card.label}</p>
        </li>
      ))}
    </ul>
  );
}

const STATUS_STYLE: Record<PageStatusKind, string> = {
  published: 'bg-[#2f7d4a]/15 text-[#2f7d4a]',
  live_default: 'bg-[#2a4a6e]/12 text-[#2a4a6e]',
  dirty: 'bg-[#f3e6c8] text-[#8a6a34]',
  draft: 'bg-[#ececec] text-[#5c7084]',
};

const STATUS_LABEL: Record<PageStatusKind, string> = {
  published: 'Published',
  live_default: 'Live default',
  dirty: 'Published · edits',
  draft: 'Draft',
};

export function CmsPagesTable({
  pages,
  canEdit,
  filter = 'all',
}: {
  pages: PageListEntry[];
  canEdit: boolean;
  filter?: 'all' | 'published' | 'draft' | 'dirty';
}) {
  const rows = pages.map((p) => pageRowFromEntry(p)).filter((row) => {
    if (filter === 'all') return true;
    if (filter === 'published') return row.status === 'published' || row.status === 'live_default';
    if (filter === 'draft') return row.status === 'draft';
    return row.status === 'dirty';
  });

  const tabs: { key: typeof filter; label: string; count: number }[] = [
    { key: 'all', label: 'All Pages', count: pages.length },
    {
      key: 'published',
      label: 'Published',
      count: pages.map((p) => pageRowFromEntry(p)).filter((r) => r.status === 'published' || r.status === 'live_default').length,
    },
    { key: 'draft', label: 'Drafts', count: pages.map((p) => pageRowFromEntry(p)).filter((r) => r.status === 'draft').length },
    { key: 'dirty', label: 'Edits', count: pages.map((p) => pageRowFromEntry(p)).filter((r) => r.status === 'dirty').length },
  ];

  return (
    <section className="rounded-[14px] border border-[#142438]/08 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="m-0 text-[17px] font-semibold tracking-[-0.02em] text-[#142438]">Pages &amp; Content</h2>
          <p className="m-0 mt-1 text-[12px] text-[#5c7084]">Open a page to edit every language. English status shown below.</p>
        </div>
        {canEdit ? (
          <Link
            href="/admin/cms/home"
            className="inline-flex rounded-[8px] bg-[#b28a49] px-3.5 py-2 text-[13px] font-semibold text-[#142438] no-underline hover:bg-[#c9a35f]"
          >
            Edit Homepage
          </Link>
        ) : null}
      </div>

      <nav aria-label="Page filters" className="mt-4 flex flex-wrap gap-1 border-b border-[#142438]/08 pb-0">
        {tabs.map((tab) => {
          const href = tab.key === 'all' ? '/admin/cms' : `/admin/cms?filter=${tab.key}`;
          const active = filter === tab.key;
          return (
            <Link
              key={tab.key}
              href={href}
              className={`-mb-px border-b-2 px-3 py-2 text-[13px] no-underline ${
                active ? 'border-[#b28a49] font-semibold text-[#142438]' : 'border-transparent text-[#5c7084] hover:text-[#142438]'
              }`}
            >
              {tab.label} ({tab.count})
            </Link>
          );
        })}
      </nav>

      <div className="scroll-x mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[14px]">
          <thead>
            <tr className="border-b border-[#142438]/08 text-start text-[11px] uppercase tracking-[0.08em] text-[#5c7084]">
              <th className="px-2 py-2 font-medium">Page</th>
              <th className="px-2 py-2 font-medium">URL</th>
              <th className="px-2 py-2 font-medium">Status</th>
              <th className="px-2 py-2 font-medium">Updated</th>
              <th className="px-2 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.slug} className="border-b border-[#142438]/06 last:border-0">
                <td className="px-2 py-3 font-medium text-[#142438]">{row.title}</td>
                <td className="px-2 py-3 font-mono text-[12px] text-[#5c7084]">{row.path}</td>
                <td className="px-2 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLE[row.status]}`}>
                    {STATUS_LABEL[row.status]}
                  </span>
                </td>
                <td className="px-2 py-3 text-[13px] text-[#5c7084]">{row.updatedLabel}</td>
                <td className="px-2 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/cms/${row.slug}`}
                      className="rounded-[6px] border border-[#142438]/15 px-2.5 py-1 text-[12px] text-[#142438] no-underline hover:border-[#b28a49]"
                    >
                      {canEdit ? 'Edit' : 'View'}
                    </Link>
                    <a
                      href={row.path === '/' ? '/' : row.path}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-[6px] border border-[#142438]/15 px-2.5 py-1 text-[12px] text-[#5c7084] no-underline hover:border-[#b28a49] hover:text-[#142438]"
                    >
                      View ↗
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function CmsQuickActions({
  canEdit,
  canMedia,
  canSettings,
  canLeads,
  submissionsBadge = 0,
}: {
  canEdit: boolean;
  canMedia: boolean;
  canSettings: boolean;
  canLeads: boolean;
  submissionsBadge?: number;
}) {
  const items = [
    canEdit && { href: '/admin/cms/home', label: 'Edit Homepage' },
    canSettings && { href: '/admin/settings/navigation', label: 'Update Menu' },
    canMedia && { href: '/admin/cms/media', label: 'Upload Media' },
    canSettings && { href: '/admin/settings/vsl', label: 'Manage Banners' },
    canSettings && { href: '/admin/settings/seo', label: 'SEO Settings' },
    canLeads && { href: '/admin/inbox', label: 'View Submissions', badge: submissionsBadge },
  ].filter(Boolean) as { href: string; label: string; badge?: number }[];

  if (items.length === 0) return null;

  return (
    <section className="rounded-[14px] border border-[#142438]/08 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]">
      <h2 className="m-0 text-[17px] font-semibold tracking-[-0.02em] text-[#142438]">Quick Actions</h2>
      <ul className="m-0 mt-4 grid list-none grid-cols-2 gap-2 p-0">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="t-colors relative flex min-h-[64px] items-center justify-center rounded-[10px] border border-[#142438]/1 bg-[#f7f8fa] px-2 py-3 text-center text-[12px] font-semibold text-[#142438] no-underline hover:border-[#b28a49]/5"
            >
              {item.label}
              {item.badge != null && item.badge > 0 ? (
                <span className="absolute -end-1 -top-1 min-w-5 rounded-full bg-[#c44] px-1 text-center font-mono text-[10px] leading-5 text-white">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CmsMediaStrip({ items, canManage }: { items: MediaItem[]; canManage: boolean }) {
  const images = items.filter((i) => i.kind === 'image').slice(0, 4);
  return (
    <section className="rounded-[14px] border border-[#142438]/08 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]">
      <div className="flex items-end justify-between gap-3">
        <h2 className="m-0 text-[17px] font-semibold tracking-[-0.02em] text-[#142438]">Media Library</h2>
        <Link href="/admin/cms/media" className="text-[13px] font-medium text-[#b28a49] no-underline hover:underline">
          View All
        </Link>
      </div>
      <ul className="m-0 mt-4 flex list-none gap-3 overflow-x-auto p-0">
        {images.map((item) => (
          <li key={item.id} className="relative size-20 shrink-0 overflow-hidden rounded-[10px] border border-[#142438]/08 bg-[#f4f5f7]">
            {/* eslint-disable-next-line @next/next/no-img-element -- mixed built-in and storage URLs */}
            <img src={item.url} alt={item.alt || item.fileName} className="size-full object-cover" />
          </li>
        ))}
        {canManage ? (
          <li>
            <Link
              href="/admin/cms/media"
              className="flex size-20 flex-col items-center justify-center rounded-[10px] border border-dashed border-[#142438]/25 text-[12px] font-medium text-[#5c7084] no-underline hover:border-[#b28a49] hover:text-[#142438]"
            >
              <span className="text-[20px] leading-none text-[#b28a49]">+</span>
              Add Media
            </Link>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

export function CmsSeoHealthCard({ health }: { health: ReturnType<typeof cmsSeoHealth> }) {
  return (
    <section className="rounded-[14px] border border-[#142438]/08 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]">
      <h2 className="m-0 text-[17px] font-semibold tracking-[-0.02em] text-[#142438]">SEO &amp; Site Health</h2>
      <p className="m-0 mt-1 text-[12px] text-[#5c7084]">Publish coverage only — not a third-party SEO crawl.</p>
      <div className="mt-4 flex flex-wrap items-center gap-5">
        <span
          className="relative flex size-24 shrink-0 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(#b28a49 ${health.score}%, #e8e4dc 0)` }}
          aria-hidden
        >
          <span className="absolute inset-[10px] rounded-full bg-white" />
          <span className="relative text-[16px] font-semibold text-[#142438]">
            {health.score}
            <span className="text-[11px] font-normal text-[#5c7084]">/100</span>
          </span>
        </span>
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[13px]">
          {health.checks.map((check) => (
            <li key={check.label} className="flex items-start gap-2 text-[#142438]">
              <span className={check.ok ? 'text-[#2f7d4a]' : 'text-[#8a6a34]'}>{check.ok ? '✓' : '!'}</span>
              <span>
                {check.label}
                {check.note ? <span className="mt-0.5 block text-[12px] text-[#5c7084]">{check.note}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <Link href="/admin/settings/seo" className="mt-4 inline-flex text-[13px] font-medium text-[#b28a49] no-underline hover:underline">
        Open SEO settings →
      </Link>
    </section>
  );
}

export function CmsLocalesPanel({ pages, canEdit }: { pages: PageListEntry[]; canEdit: boolean }) {
  return (
    <details className="rounded-[14px] border border-[#142438]/08 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]">
      <summary className="cursor-pointer text-[17px] font-semibold tracking-[-0.02em] text-[#142438]">
        All languages
      </summary>
      <p className="m-0 mt-2 text-[13px] text-[#5c7084]">
        Every locale for each page. The table above shows English only for a quick scan.
      </p>
      <ul className="m-0 mt-4 grid list-none grid-cols-1 gap-3 p-0 lg:grid-cols-2">
        {pages.map((page) => (
          <li key={page.slug} className="rounded-[12px] border border-[#142438]/08 bg-[#f7f8fa] p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="m-0 text-[15px] font-semibold text-[#142438]">{page.title}</p>
                <p className="m-0 mt-0.5 font-mono text-[12px] text-[#5c7084]">{page.path || '/'}</p>
              </div>
              <a href={page.path || '/'} target="_blank" rel="noreferrer" className="text-[12px] text-[#5c7084] no-underline hover:text-[#142438]">
                View ↗
              </a>
            </div>
            <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
              {page.locales.map((entry) => (
                <li key={entry.locale}>
                  <Link
                    href={`/admin/cms/${page.slug}?locale=${entry.locale}`}
                    className="inline-flex rounded-full border border-[#142438]/12 bg-white px-2.5 py-1 text-[12px] text-[#142438] no-underline hover:border-[#b28a49]"
                  >
                    {entry.locale}
                    {!entry.stored ? ' · default' : entry.publishedAt ? (entry.dirty ? ' · edits' : ' · live') : ' · draft'}
                  </Link>
                </li>
              ))}
            </ul>
            {canEdit ? (
              <Link href={`/admin/cms/${page.slug}`} className="mt-3 inline-flex text-[13px] font-medium text-[#b28a49] no-underline hover:underline">
                Edit page →
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </details>
  );
}
