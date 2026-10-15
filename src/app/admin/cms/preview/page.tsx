import { notFound } from 'next/navigation';
import { CmsPageView } from '@/components/cms/CmsPageView';
import { getDraftPage } from '@/lib/cms/data';
import { requirePermission } from '@/lib/rbac/server';
import { isLocale, localeDirection } from '@/lib/i18n';

export const metadata = { title: 'Preview', robots: { index: false, follow: false } };

/**
 * The saved draft, rendered exactly as the public page would be. Lives under
 * /admin so drafts are never reachable from the public site, whatever the URL.
 */
export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ slug?: string; locale?: string }> }) {
  await requirePermission('cms.view', '/admin/cms');
  const { slug = 'home', locale = 'en' } = await searchParams;
  if (!isLocale(locale)) notFound();
  const page = await getDraftPage(slug, locale);
  if (!page) notFound();

  return (
    <div lang={locale} dir={localeDirection[locale]} className="avsar-root">
      <CmsPageView
        page={page}
        locale={locale}
        banner={
          <div className="relative z-50 bg-employer px-4 py-2 text-center text-[13px] text-white">
            Preview of the saved draft{page.stored ? '' : ' (default content)'}. This is not the live page.
          </div>
        }
      />
    </div>
  );
}
