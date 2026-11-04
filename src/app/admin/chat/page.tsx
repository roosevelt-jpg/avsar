import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { LiveChatQueue } from '@/components/admin/LiveChatQueue';
import { requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Live chat' };

type Search = { thread?: string };

export default async function AdminLiveChat({ searchParams }: { searchParams: Promise<Search> }) {
  await requirePermission('leads.manage', '/admin/chat');
  const search = await searchParams;

  return (
    <AdminShell current="/admin/chat" isStaff>
      <AdminHeading
        title="Live chat"
        lead="AI department chats that need a recruiter, plus threads visitors opened with online staff."
      />
      <LiveChatQueue initialThreadId={search.thread} />
    </AdminShell>
  );
}
