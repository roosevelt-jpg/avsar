import { NextResponse } from 'next/server';
import { getSessionCandidate } from '@/lib/auth';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isAiConfigured } from '@/lib/cv/client';
import { generateCareerPack, unsupportedBullets } from '@/lib/cv/coach';
import { toRatingInput } from '@/lib/cv/redact';
import type { Extraction } from '@/lib/cv/schema';
import type { RatingInput } from '@/lib/cv/redact';

export const runtime = 'nodejs';
export const maxDuration = 300;

/** A candidate may regenerate this a few times, not endlessly. Each costs. */
const MAX_GENERATIONS = 3;

/**
 * Builds the candidate's career pack.
 *
 * Triggered by the candidate, once their report exists. Generated on request
 * rather than automatically with the report: not everyone opens it, and a model
 * pass per candidate across a cohort is the largest single cost in the product.
 */
export async function POST() {
  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  if (!isAiConfigured()) return NextResponse.json({ error: 'ai_unconfigured' }, { status: 503 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: existing } = await admin
    .from('career_packs')
    .select('generation_count')
    .eq('candidate_id', candidate.id)
    .maybeSingle();

  if (existing && (existing.generation_count as number) >= MAX_GENERATIONS) {
    return NextResponse.json({ error: 'generation_limit' }, { status: 429 });
  }

  const { data: report } = await admin
    .from('reports')
    .select('overall_score, english_cefr, skills_score, experience_score, breakdown')
    .eq('candidate_id', candidate.id)
    .maybeSingle();

  /* The pack reads the assessment result, so it cannot be built before one
     exists. Saying so is better than producing generic advice. */
  if (!report) return NextResponse.json({ error: 'report_not_ready' }, { status: 409 });

  /* Prefer the parsed CV when there is one; otherwise the profile they typed. */
  const { data: assessment } = await admin
    .from('cv_assessments')
    .select('profile')
    .eq('candidate_id', candidate.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let profile: RatingInput;

  if (assessment?.profile) {
    profile = toRatingInput({
      ...(assessment.profile as Omit<Extraction, 'protectedAttributes'>),
      protectedAttributes: {
        fullName: '', email: '', phone: '', dateOfBirth: '', statedAge: '',
        statedGender: '', maritalStatus: '', religionOrCaste: '', nationality: '', hasPhoto: false,
        otherPersonalDetails: [],
      },
    } as Extraction);
  } else {
    const [{ data: entered }, { data: experiences }, { data: education }] = await Promise.all([
      admin.from('candidate_profiles').select('*').eq('candidate_id', candidate.id).maybeSingle(),
      admin.from('candidate_experiences').select('*').eq('candidate_id', candidate.id).order('sort_order'),
      admin.from('candidate_education').select('*').eq('candidate_id', candidate.id).order('sort_order'),
    ]);

    profile = {
      roles: (experiences ?? []).map((row) => ({
        employer: row.employer as string,
        title: row.title as string,
        startDate: ((row.start_month as string | null) ?? '').slice(0, 7),
        endDate: ((row.end_month as string | null) ?? '').slice(0, 7),
        isCurrent: row.is_current as boolean,
        country: (row.location as string | null) ?? '',
        responsibilities: row.description ? [row.description as string] : [],
      })),
      totalYearsExperience: [0, 2, 4, 6][candidate.yearsBand ?? 0] ?? 0,
      education: (education ?? []).map((row) => ({
        institution: row.institution as string,
        qualification: row.qualification as string,
        field: (row.field as string | null) ?? '',
        year: String((row.end_year as number | null) ?? ''),
      })),
      certifications: [],
      languages: ((entered?.languages as { language: string; level: string }[] | null) ?? []).map(
        (item) => ({ language: item.language, statedLevel: item.level }),
      ),
      skills: (entered?.skills as string[] | null) ?? [],
      employmentGaps: [],
      documentQuality: 'clear',
    };
  }

  if (profile.roles.length === 0 && profile.skills.length === 0) {
    return NextResponse.json({ error: 'profile_empty' }, { status: 409 });
  }

  try {
    const result = await generateCareerPack({
      fullName: candidate.fullName,
      position: candidate.position ?? '',
      locale: candidate.locale,
      profile,
      report: {
        overall: report.overall_score as number,
        english: report.english_cefr as string,
        skills: report.skills_score as number,
        experience: report.experience_score as number,
        breakdown: (report.breakdown as { label: string; score: number }[]) ?? [],
      },
    });

    const flagged = unsupportedBullets(result.pack, profile);
    if (flagged.length > 0) {
      console.warn('[career-pack] unsupported lines', candidate.id, flagged);
    }

    const { error } = await admin.from('career_packs').upsert(
      {
        candidate_id: candidate.id,
        strengths: result.pack.strengths,
        improvements: result.pack.improvements,
        interview: result.pack.interview,
        improved_cv: result.pack.improvedCv,
        translated: result.pack.translated,
        unsupported_lines: flagged,
        model: result.model,
        prompt_version: result.promptVersion,
        input_tokens: result.usage.inputTokens,
        output_tokens: result.usage.outputTokens,
        generated_at: new Date().toISOString(),
        generation_count: ((existing?.generation_count as number) ?? 0) + 1,
      },
      { onConflict: 'candidate_id' },
    );

    if (error) throw new Error(error.message);

    return NextResponse.json({ ready: true, flagged: flagged.length });
  } catch (error) {
    console.error('[career-pack] failed', error);
    return NextResponse.json({ error: 'generation_failed' }, { status: 500 });
  }
}
