import { NextResponse } from 'next/server';
import { getSessionCandidate } from '@/lib/auth';
import { getSiteSettings } from '@/lib/cms/data';
import { writeScoreReading } from '@/lib/console/analysis';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/**
 * A reading of the free score, in the candidate's language when the model is
 * configured. It uses the stored score and the strongest field. It does not
 * write the paid skills report.
 */
export async function POST() {
  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'sign_in' }, { status: 401 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const { data: report } = await admin
    .from('reports')
    .select('overall_score, breakdown')
    .eq('candidate_id', candidate.id)
    .maybeSingle();
  if (!report) return NextResponse.json({ error: 'no_score' }, { status: 404 });

  const score = Number(report.overall_score);
  const breakdown = Array.isArray(report.breakdown)
    ? (report.breakdown as { label?: string; score?: number }[])
    : [];
  const strongest = breakdown.reduce<{ label: string; score: number } | null>((best, entry) => {
    const label = typeof entry.label === 'string' ? entry.label : '';
    const value = typeof entry.score === 'number' ? entry.score : -1;
    if (!label || value < 0) return best;
    if (!best || value > best.score) return { label, score: value };
    return best;
  }, null);

  const settings = await getSiteSettings();
  const reading = await writeScoreReading({
    scoreOutOf10: (score / 10).toFixed(score % 10 === 0 ? 0 : 1),
    strongest: strongest?.label ?? null,
    above: score >= settings.hiring.shortlistMinScore,
    locale: candidate.locale,
  });

  await admin.from('score_readings').upsert({
    candidate_id: candidate.id,
    body: reading,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ reading });
}
