import Link from 'next/link';
import { AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { listPagesForConsole } from '@/lib/cms/data';
import { can, requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Pages' };

const LOCALE_LABEL: Record<string, string> = { en: 'English', hi: 'Hindi', ar: 'Arabic' };

/**
 * Every page on the website, and what state each language is in.
 *
 * Every page exists from day one with default content, so this list is never
 * empty and an editor's job is to improve pages, not to create them.
 */
export default async function CmsPages() {
  const access = await requirePermission('cms.view', '/admin/cms');
  const pages = await listPagesForConsole();

  return (
    <AdminShell current="/admin/cms" isStaff>
      <AdminHeading
        title="Website pages"
        lead="Every page ships with ready-written content. Open one to edit its text, images and videos; nothing changes on the live site until you publish. Languages without their own version show English."
      />

      <ul className="m-0 mt-8 grid list-none grid-cols-1 gap-3 p-0 lg:grid-cols-2">
        {pages.map((page) => (
          <li key={page.slug} className="flex flex-col rounded-[18px] border border-line bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="m-0 text-[17px] font-semibold">{page.title}</h2>
                <p className="m-0 mt-0.5 font-mono text-[12px] text-muted">/{'{locale}'}{page.path}</p>
              </div>
              <a href={`/en${page.path}`} target="_blank" rel="noreferrer" className="text-[13px] text-ink-2 hover:text-ink">View ↗</a>
            </div>
            <p className="m-0 mt-2 text-[14px] leading-[1.5] text-ink-2">{page.purpose}</p>
            <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
              {page.locales.map((entry) => (
                <li key={entry.locale} className="flex items-center justify-between gap-3 rounded-[12px] bg-paper px-3 py-2">
                  <span className="flex items-center gap-2 text-[14px]">
                    {LOCALE_LABEL[entry.locale]}
                    {!entry.stored ? (
                      <Pill tone="muted">{entry.locale === 'en' ? 'Default content' : 'Uses English'}</Pill>
                    ) : entry.publishedAt ? (
                      entry.dirty ? <Pill tone="accent">Published · unpublished changes</Pill> : <Pill tone="success">Published</Pill>
                    ) : (
                      <Pill tone="neutral">Draft</Pill>
                    )}
                  </span>
                  <Link href={`/admin/cms/${page.slug}?locale=${entry.locale}`} className="rounded-full border border-line-strong bg-surface px-3 py-1 text-[13px] text-ink no-underline hover:border-ink">
                    {can(access, 'cms.edit') ? 'Edit' : 'View'}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
