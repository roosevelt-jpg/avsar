import { notFound } from 'next/navigation';
import { AssessmentRunner } from '@/components/candidate/AssessmentRunner';
import { getDictionary, isLocale } from '@/lib/i18n';
import { itemsForSection, toClientItem, type SectionId } from '@/lib/assessment/items';
import { SECTOR_SLUGS, type SectorSlug } from '@/lib/data/sectors';
import { getServerSupabase } from '@/lib/supabase/server';

export const metadata = { title: 'Assessment' };

/** Wall-clock budget for the whole assessment, from the handoff's 60-90 min. */
const SECTION_SECONDS = 90 * 60;

export default async function AssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ section?: string; sector?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const t = getDictionary(locale);

  const section: SectionId = isSection(query.section) ? query.section : 'english';
  const sector: SectorSlug =
    query.sector && (SECTOR_SLUGS as readonly string[]).includes(query.sector)
      ? (query.sector as SectorSlug)
      : SECTOR_SLUGS[0];

  /**
   * The attempt and its deadline are server state. Without Supabase there is no
   * attempt to resume, so the runner keeps answers in memory and the timer
   * starts from the full budget.
   */
  const supabase = await getServerSupabase();
  let attemptId: string | null = null;
  let secondsRemaining = SECTION_SECONDS;

  if (supabase) {
    const { data } = await supabase
      .from('assessment_attempts')
      .select('id, expires_at')
      .eq('section', section)
      .is('submitted_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      attemptId = data.id as string;
      const expiresAt = new Date(data.expires_at as string).getTime();
      secondsRemaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    }
  }

  /* `toClientItem` strips the answer key before the items cross to the browser. */
  const items = itemsForSection(section, sector, attemptId ?? 'preview').map(toClientItem);

  return (
    <AssessmentRunner
      locale={locale}
      t={t}
      items={items}
      currentSection={section}
      attemptId={attemptId}
      secondsRemaining={secondsRemaining}
    />
  );
}

function isSection(value: string | undefined): value is SectionId {
  return value === 'skills' || value === 'experience' || value === 'english' || value === 'profile';
}
