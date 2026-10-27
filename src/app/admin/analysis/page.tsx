import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { AnalysisTool } from '@/components/admin/AnalysisTool';
import { conversionFacts } from '@/lib/console/analysis';
import { requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Analysis' };
export const dynamic = 'force-dynamic';

/** The week's conversion counts, and a briefing that is allowed to restate them. */
export default async function AnalysisPage() {
  await requirePermission('dashboard.view', '/admin/analysis');
  const facts = await conversionFacts(7);
  return (
    <AdminShell current="/admin/analysis" isStaff>
      <AdminHeading
        title="Analysis"
        lead="The same figures an applicant sees on their dashboard, the figures an employer sees on theirs, and the pay path. The briefing uses these counts and nothing else."
      />
      <AnalysisTool facts={facts} />
    </AdminShell>
  );
}
