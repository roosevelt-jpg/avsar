import { notFound, redirect } from 'next/navigation';
import { AssessmentRunner } from '@/components/candidate/AssessmentRunner';
import { getDictionary, isLocale } from '@/lib/i18n';
import {
  itemsForSection,
  toClientItem,
  toDisplayOption,
  SECTION_ORDER,
  type SectionId,
} from '@/lib/assessment/items';
import { SECTOR_SLUGS, type SectorSlug } from '@/lib/data/sectors';
import { getServerSupabase } from '@/lib/supabase/server';
import { secondsUntil } from '@/lib/clock';
import { requireCandidate } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const metadata = { title: 'Assessment' };

/** Wall-clock budget for the whole assessment, from the handoff's 60-90 min. */
const SECTION_SECONDS = 90 * 60;

export default async function AssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const t = getDictionary(locale);

  /* Falls back to the first section. Which one the candidate actually resumes
     at is decided below, from what the server knows is already submitted. */
  let section: SectionId = isSection(query.section) ? query.section : 'skills';

  /* The sector comes from the candidate record, not the query string: it
     decides which items they are scored on, so it is not theirs to pick here. */
  let sector: SectorSlug = SECTOR_SLUGS[0];
  let position: string | undefined;

  /**
   * The attempt and its deadline are server state. Without Supabase there is no
   * attempt to resume, so the runner keeps answers in memory and the timer
   * starts from the full budget.
   */
  let attemptId: string | null = null;
  let secondsRemaining = SECTION_SECONDS;
  const savedAnswers: Record<string, number> = {};

  if (isSupabaseConfigured()) {
    const candidate = await requireCandidate(locale, `/${locale}/assessment?section=${section}`);

    if ((SECTOR_SLUGS as readonly string[]).includes(candidate.sector ?? '')) {
      sector = candidate.sector as SectorSlug;
    }
    position = candidate.position ?? undefined;

    /* No payment check. The assessment is free to sit; the fee unlocks the
       report, the career pack and the CV when it is done. The profile is the
       only thing needed first, because the questions are chosen from it. */
    if (!candidate.profileComplete) {
      redirect(`/${locale}/signup?resume=profile`);
    }

    const supabase = await getServerSupabase();

    /* No section asked for: resume at the first one that is not yet in. */
    if (!isSection(query.section)) {
      const { data: done } = (await supabase
        ?.from('assessment_attempts')
        .select('section, submitted_at')
        .not('submitted_at', 'is', null)) ?? { data: null };

      const submitted = new Set((done ?? []).map((row) => row.section as string));
      const next = SECTION_ORDER.find((candidateSection) => !submitted.has(candidateSection));
      if (!next) redirect(`/${locale}/dashboard`);
      section = next;
    }

    /* start_assessment_attempt is idempotent and sets expires_at itself. The
       candidate cannot choose their own deadline, which is the entire point of
       a server-side timer. */
    const { data, error } = (await supabase?.rpc('start_assessment_attempt', {
      p_section: section,
    })) ?? { data: null, error: null };

    if (error) {
      console.error('[assessment] could not start attempt', error);
    }

    const attempt = Array.isArray(data) ? data[0] : data;
    if (attempt) {
      attemptId = attempt.id as string;
      secondsRemaining = secondsUntil(attempt.expires_at as string);

      /* Answers already given in this section. Autosave is worthless if
         returning to a half-finished section shows every question blank: the
         candidate re-answers work they already did, against a clock that never
         stopped. */
      const { data: rows } = (await supabase
        ?.from('assessment_answers')
        .select('item_id, option_index')
        .eq('attempt_id', attemptId)) ?? { data: null };

      for (const row of rows ?? []) {
        savedAnswers[row.item_id as string] = row.option_index as number;
      }
    }
  }

  /*
    `toClientItem` strips the answer key, puts the options in this candidate's
    own order and renders the item in their language.

    The seed is the attempt, so the order survives a reload and a resume, and
    the saved answers have to be translated into the same order or a resumed
    section shows the wrong option already selected.
  */
  const seed = attemptId ?? 'preview';
  const pool = itemsForSection(section, sector, seed, position);
  const items = pool.map((item) => toClientItem(item, seed, locale));

  for (const item of pool) {
    const stored = savedAnswers[item.id];
    if (stored !== undefined) savedAnswers[item.id] = toDisplayOption(item, seed, stored);
  }

  return (
    <AssessmentRunner
      /**
       * Remount on every section.
       *
       * The route does not change between sections, only the search param, so
       * React keeps the same component instance and its question index with it.
       * Skills has 12 items and experience has 8: carrying index 11 across
       * lands past the end of the new list and the runner renders an empty
       * state. The key forces fresh state per section.
       */
      key={section}
      locale={locale}
      t={t}
      items={items}
      currentSection={section}
      attemptId={attemptId}
      secondsRemaining={secondsRemaining}
      savedAnswers={savedAnswers}
    />
  );
}

function isSection(value: string | undefined): value is SectionId {
  return value === 'skills' || value === 'experience' || value === 'english' || value === 'profile';
}
