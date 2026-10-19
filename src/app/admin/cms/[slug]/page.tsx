import { isLocale, localeEnglishNames, localePath, locales, type Locale } from '@/lib/i18n';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { PageEditor } from '@/components/admin/cms/PageEditor';
import { getDraftPage } from '@/lib/cms/data';
import { defaultPage } from '@/lib/cms/defaults';
import { can, requirePermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const metadata = { title: 'Edit page' };

export default async function EditCmsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { slug } = await params;
  const { locale: rawLocale = '' } = await searchParams;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';

  const access = await requirePermission('cms.view', `/admin/cms/${slug}`);
  const def = defaultPage(slug);
  if (!def) notFound();

  const page = await getDraftPage(slug, locale);
  if (!page) notFound();

  /* Versions, newest first, with who made them. */
  let versions: { id: number; kind: string; note: string | null; createdAt: string; createdBy: string | null }[] = [];
  const admin = getAdminSupabase();
  if (admin && page.stored) {
    const { data: pageRow } = await admin.from('cms_pages').select('id').eq('slug', slug).eq('locale', locale).maybeSingle();
    if (pageRow) {
      const { data } = await admin
        .from('cms_page_versions')
        .select('id, kind, note, created_at, created_by')
        .eq('page_id', pageRow.id)
        .order('created_at', { ascending: false })
        .limit(30);
      const staffIds = [...new Set((data ?? []).map((v) => v.created_by).filter(Boolean))] as string[];
      const { data: staff } = staffIds.length
        ? await admin.from('staff_users').select('auth_user_id, email').in('auth_user_id', staffIds)
        : { data: [] as { auth_user_id: string; email: string }[] };
      const emails = new Map((staff ?? []).map((s) => [s.auth_user_id as string, s.email as string]));
      versions = (data ?? []).map((v) => ({
        id: Number(v.id),
        kind: String(v.kind),
        note: (v.note as string | null) ?? null,
        createdAt: String(v.created_at),
        createdBy: v.created_by ? (emails.get(v.created_by as string) ?? null) : null,
      }));
    }
  }

  return (
    <AdminShell current="/admin/cms" isStaff>
      <div className="mb-6">
        <Link href="/admin/cms" className="font-mono text-[12px] text-muted no-underline hover:text-ink">← All pages</Link>
      </div>
      <AdminHeading
        title={def.title}
        lead={def.purpose}
        actions={
          <nav aria-label="Language" className="flex max-w-[560px] flex-wrap justify-end gap-1 text-[12px]">
            {locales.map((code) =>
              code === locale ? (
                <span key={code} className="rounded-full bg-ink px-2.5 py-1 text-paper">{localeEnglishNames[code]}</span>
              ) : (
                <Link key={code} href={`/admin/cms/${slug}?locale=${code}`} className="rounded-full border border-line bg-surface px-2.5 py-1 text-ink-2 no-underline hover:text-ink">
                  {localeEnglishNames[code]}
                </Link>
              ),
            )}
          </nav>
        }
      />
      {!page.stored && locale !== 'en' && (
        <p className="m-0 mt-4 rounded-[12px] bg-accent-tint px-4 py-3 text-[14px]">
          There is no saved {localeEnglishNames[locale]} version yet. Visitors see the translation that ships with the site. Edit it and publish to replace that version.
        </p>
      )}
      <div className="mt-6">
        <PageEditor
          key={`${slug}-${locale}`}
          slug={slug}
          locale={locale}
          publicPath={localePath(locale, def.path || '/')}
          initial={{ title: page.title, blocks: page.blocks, seo: page.seo }}
          stored={page.stored}
          publishedAt={page.publishedAt}
          hasUnpublishedChanges={page.hasUnpublishedChanges}
          canEdit={can(access, 'cms.edit')}
          canPublish={can(access, 'cms.publish')}
          versions={versions}
        />
      </div>
    </AdminShell>
  );
}
