import { AdminShell } from '@/components/employer/AdminShell';
import {
  CmsDashHero,
  CmsLocalesPanel,
  CmsMediaStrip,
  CmsPagesTable,
  CmsQuickActions,
  CmsSeoHealthCard,
  CmsStatStrip,
  cmsPageStats,
  cmsSeoHealth,
} from '@/components/admin/CmsDashboardOverview';
import { listMedia, listPagesForConsole } from '@/lib/cms/data';
import { listLeads } from '@/lib/leads/data';
import { can, requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Website & CMS' };

/**
 * CMS home: mockup overview (live page/media counts) plus the full locale
 * editor list. Page views / traffic are omitted — we do not invent analytics.
 */
export default async function CmsPages({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const access = await requirePermission('cms.view', '/admin/cms');
  const query = await searchParams;
  const filterRaw = query.filter;
  const filter =
    filterRaw === 'published' || filterRaw === 'draft' || filterRaw === 'dirty' ? filterRaw : 'all';

  const canEdit = can(access, 'cms.edit');
  const canMedia = can(access, 'media.manage');
  const canSettings = can(access, 'settings.manage');
  const canLeads = can(access, 'leads.manage');

  const [pages, media, leads] = await Promise.all([
    listPagesForConsole(),
    canMedia ? listMedia('image') : Promise.resolve([]),
    canLeads ? listLeads({ status: 'new' }, 50) : Promise.resolve([]),
  ]);

  const stats = cmsPageStats(pages);
  const health = cmsSeoHealth(pages);

  return (
    <AdminShell current="/admin/cms" isStaff>
      <div className="flex flex-col gap-5">
        <CmsDashHero canEdit={canEdit} />
        <CmsStatStrip stats={stats} mediaCount={media.length} />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
          <CmsPagesTable pages={pages} canEdit={canEdit} filter={filter} />
          <div className="flex flex-col gap-4">
            <CmsQuickActions
              canEdit={canEdit}
              canMedia={canMedia}
              canSettings={canSettings}
              canLeads={canLeads}
              submissionsBadge={leads.length}
            />
            <CmsSeoHealthCard health={health} />
          </div>
        </div>

        {canMedia ? <CmsMediaStrip items={media} canManage={canMedia} /> : null}

        <CmsLocalesPanel pages={pages} canEdit={canEdit} />
      </div>
    </AdminShell>
  );
}
