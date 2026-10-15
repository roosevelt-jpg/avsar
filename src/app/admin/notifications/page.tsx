import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminEmpty, AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { MarkNotificationsSeen } from '@/components/admin/MarkNotificationsSeen';
import { Mono } from '@/components/ui/Mono';
import { listStaffNotifications } from '@/lib/notifications/staff';
import { getStaffAccess } from '@/lib/rbac/server';

export const metadata = { title: 'Notifications' };

/**
 * What happened that this person may act on. The list is filtered by
 * permission in the database, so it never shows what the role cannot open.
 */
export default async function NotificationsPage() {
  const access = await getStaffAccess();
  /* Employers and visitors: the console home already knows where each belongs. */
  if (!access) redirect('/admin');

  const { items, seenAt } = await listStaffNotifications(access.userId);
  const isNew = (createdAt: string) => !seenAt || createdAt > seenAt;
  const unseen = items.filter((item) => isNew(item.createdAt)).length;

  return (
    <AdminShell current="/admin/notifications" isStaff>
      <AdminHeading title="Notifications" lead="New applications, vacancy requests, messages and privacy requests, for the parts of the console your role can open." />
      <MarkNotificationsSeen unseen={access.demo ? 0 : unseen} />

      {items.length === 0 ? (
        <AdminEmpty>Nothing yet.</AdminEmpty>
      ) : (
        <ul className="m-0 mt-7 flex max-w-[820px] list-none flex-col gap-2 p-0">
          {items.map((item) => {
            const body = (
              <>
                <span className="flex flex-wrap items-center gap-2">
                  {isNew(item.createdAt) && <Pill tone="accent">New</Pill>}
                  <span className="font-medium">{item.title}</span>
                </span>
                {item.body && <span className="mt-1 block text-[14px] text-ink-2">{item.body}</span>}
                <Mono className="mt-1 block text-muted">{new Date(item.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</Mono>
              </>
            );
            return (
              <li key={item.id}>
                {item.href ? (
                  <Link href={item.href} className="block rounded-[12px] border border-line bg-surface px-4 py-3 text-ink no-underline hover:border-ink">{body}</Link>
                ) : (
                  <div className="rounded-[12px] border border-line bg-surface px-4 py-3">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AdminShell>
  );
}
