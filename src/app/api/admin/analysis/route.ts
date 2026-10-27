import { NextResponse } from 'next/server';
import { apiPermission } from '@/lib/rbac/server';
import { conversionFacts, writeBriefing } from '@/lib/console/analysis';

export const runtime = 'nodejs';

/** A briefing from this week's counts. The counts are the source. The model only restates them. */
export async function POST() {
  const guard = await apiPermission('dashboard.view');
  if (guard instanceof NextResponse) return guard;
  const facts = await conversionFacts(7);
  const briefing = await writeBriefing(facts);
  return NextResponse.json({ facts, briefing });
}
