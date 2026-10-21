import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { AssistantNotes } from '@/components/admin/AssistantNotes';
import { requirePermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const metadata = { title: 'Assistant notes' };

/**
 * The notes the website and WhatsApp are allowed to answer from.
 * Public notes are searched for visitors. Staff notes are used only when
 * someone drafts a preliminary legal review.
 */
export default async function AssistantNotesPage() {
  await requirePermission('cms.edit', '/admin/assistant');
  const admin = getAdminSupabase();
  const { data } = admin
    ? await admin.from('knowledge_documents').select('id, title, audience, updated_at').order('updated_at', { ascending: false }).limit(100)
    : { data: [] };

  const notes = (data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    audience: String(row.audience),
    updatedAt: new Date(String(row.updated_at)).toLocaleDateString('en-GB', { dateStyle: 'medium' }),
  }));

  return (
    <AdminShell current="/admin/assistant" isStaff>
      <AdminHeading
        title="Assistant notes"
        lead="Write what the assistant may say, in the words you would use with a candidate. It answers on the website and on WhatsApp from these public notes and from Site settings. If a question is not covered, it says so. It does not decide a visa, promise a job, or take a payment. Staff-only notes are for the legal review draft and are not shown to visitors."
      />
      <AssistantNotes notes={notes} />
    </AdminShell>
  );
}
