import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { AnalysisTool } from '@/components/admin/AnalysisTool';
import { LiveUpdates } from '@/components/admin/analytics/LiveUpdates';
import { briefingFromFacts, conversionFacts } from '@/lib/console/analysis';
import { requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Insights and analysis' };
export const dynamic = 'force-dynamic';

/** Live counts from both desks, and a briefing that is allowed to restate them. */
export default async function AnalysisPage() {
  await requirePermission('dashboard.view', '/admin/analysis');
  const facts = await conversionFacts(7);
  const insight = briefingFromFacts(facts);
  return (
    <AdminShell current="/admin/analysis" isStaff>
      <AdminHeading
        title="Insights and analysis"
        lead="The applicant dashboard, the employer dashboard, payment, and the open work. The figures and the insight update as those change."
        actions={<LiveUpdates generatedAt={new Date().toISOString()} pollMs={20_000} />}
      />
      <div className="mt-6">
        <AnalysisTool facts={facts} insight={insight} />
      </div>
    </AdminShell>
  );
}
