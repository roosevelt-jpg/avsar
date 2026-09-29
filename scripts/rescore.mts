/**
 * Recomputes every stored report from the answers on record.
 *
 * Needed whenever the item bank, the weights or the scoring rules change: a
 * report written under the old rules is not comparable with one written under
 * the new, and a percentile computed across a mixture of both is meaningless.
 *
 * Reads `.env.local` directly so it can be run without a dev server.
 *
 *   npx tsx scripts/rescore.mts          # report what would change
 *   npx tsx scripts/rescore.mts --write  # apply
 */

import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { buildReport } from '../src/lib/assessment/report';
import { SECTOR_SLUGS, type SectorSlug } from '../src/lib/data/sectors';
import type { AnswerMap } from '../src/lib/assessment/scoring';

const env: Record<string, string> = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  if (!line || line.startsWith('#') || !line.includes('=')) continue;
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const write = process.argv.includes('--write');
const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: reports, error } = await supabase
  .from('reports')
  .select('candidate_id, overall_score, skills_score, experience_score');

if (error) {
  console.error('Could not read reports:', error.message);
  process.exit(1);
}

console.log(`${reports?.length ?? 0} reports on record\n`);

const cohorts = new Set<string>();
let changed = 0;

for (const existing of reports ?? []) {
  const candidateId = existing.candidate_id as string;

  const { data: candidate } = await supabase
    .from('candidates')
    .select('full_name, sector, cohort_id')
    .eq('id', candidateId)
    .maybeSingle();

  if (!candidate) continue;
  cohorts.add(candidate.cohort_id as string);

  const { data: attempts } = await supabase
    .from('assessment_attempts')
    .select('id')
    .eq('candidate_id', candidateId);

  const attemptIds = (attempts ?? []).map((a) => a.id as string);
  if (attemptIds.length === 0) continue;

  const { data: rows } = await supabase
    .from('assessment_answers')
    .select('item_id, option_index')
    .in('attempt_id', attemptIds);

  const answers: AnswerMap = {};
  for (const row of rows ?? []) answers[row.item_id as string] = row.option_index as number;

  const sector: SectorSlug = (SECTOR_SLUGS as readonly string[]).includes(candidate.sector as string)
    ? (candidate.sector as SectorSlug)
    : SECTOR_SLUGS[0];

  const fresh = buildReport(answers, sector);

  const moved =
    fresh.overall_score !== existing.overall_score ||
    fresh.experience_score !== existing.experience_score ||
    fresh.skills_score !== existing.skills_score;

  if (!moved) continue;
  changed += 1;

  console.log(
    `${(candidate.full_name as string).padEnd(34)} overall ${existing.overall_score} -> ${fresh.overall_score}` +
      `   experience ${existing.experience_score} -> ${fresh.experience_score}`,
  );

  if (write) {
    const { error: updateError } = await supabase
      .from('reports')
      .update(fresh)
      .eq('candidate_id', candidateId);
    if (updateError) console.error(`  failed: ${updateError.message}`);
  }
}

console.log(`\n${changed} reports differ.`);

if (!write) {
  console.log('Dry run. Re-run with --write to apply.');
  process.exit(0);
}

/* Percentiles are relative, so every cohort touched has to be re-ranked as a
   whole. Updating one report and leaving the rest would leave a cohort where
   the rankings contradict each other. */
for (const cohortId of cohorts) {
  const { data, error: rankError } = await supabase.rpc('refresh_cohort_percentiles', {
    p_cohort_id: cohortId,
  });
  console.log(rankError ? `${cohortId}: ${rankError.message}` : `${cohortId}: re-ranked ${data} reports`);
}
