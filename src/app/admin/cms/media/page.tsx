import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { MediaLibrary } from '@/components/admin/cms/MediaLibrary';
import { listMedia } from '@/lib/cms/data';
import { can, requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Media library' };

export default async function MediaPage() {
  const access = await requirePermission('media.manage', '/admin/cms/media');
  const items = await listMedia();
  return (
    <AdminShell current="/admin/cms/media" isStaff>
      <AdminHeading
        title="Media library"
        lead="Images, films and documents used across the website and job postings. Describe each image: the description is read aloud to blind visitors and helps search engines."
      />
      <div className="mt-8">
        <MediaLibrary items={items} canManage={can(access, 'media.manage') && !access.demo} />
      </div>
    </AdminShell>
  );
}
