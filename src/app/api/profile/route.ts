import { NextResponse } from 'next/server';
import { profileSchema } from '@/lib/validation-profile';
import { getServerSupabase } from '@/lib/supabase/server';
import { getSessionCandidate } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * Saves the candidate's own profile.
 *
 * Written through the request-scoped client, not the service role, so RLS is
 * the thing deciding whose profile this is. The candidate id comes from the
 * session and is never read from the body.
 *
 * Experience and education are replaced wholesale rather than diffed. The form
 * sends the complete list, rows have no stable client-side identity, and a
 * partial diff on a list someone has just reordered is a good way to lose a job
 * they spent ten minutes typing.
 */
export async function PUT(request: Request) {
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const input = parsed.data;

  const { error: profileError } = await supabase.from('candidate_profiles').upsert(
    {
      candidate_id: candidate.id,
      headline: input.headline || null,
      summary: input.summary || null,
      linkedin_url: input.linkedinUrl || null,
      skills: input.skills,
      languages: input.languages,
      availability: input.availability ?? null,
      relocation_ready: input.relocationReady,
      /* "Complete" means they got to the end and saved, not that every field is
         filled. A profile with three honest lines beats one padded to satisfy a
         progress bar. */
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'candidate_id' },
  );

  if (profileError) {
    console.error('[profile] upsert failed', profileError);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  await supabase.from('candidate_experiences').delete().eq('candidate_id', candidate.id);
  if (input.experiences.length > 0) {
    const { error } = await supabase.from('candidate_experiences').insert(
      input.experiences.map((item, index) => ({
        candidate_id: candidate.id,
        employer: item.employer,
        title: item.title,
        location: item.location || null,
        /* Stored as the first of the month; the column is a date and the form
           only ever offers month precision. */
        start_month: item.startMonth ? `${item.startMonth}-01` : null,
        end_month: item.isCurrent || !item.endMonth ? null : `${item.endMonth}-01`,
        is_current: item.isCurrent,
        description: item.description || null,
        sector: item.sector ?? null,
        sort_order: index,
      })),
    );
    if (error) {
      console.error('[profile] experiences insert failed', error);
      return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
    }
  }

  await supabase.from('candidate_education').delete().eq('candidate_id', candidate.id);
  if (input.education.length > 0) {
    const { error } = await supabase.from('candidate_education').insert(
      input.education.map((item, index) => ({
        candidate_id: candidate.id,
        institution: item.institution,
        qualification: item.qualification,
        field: item.field || null,
        start_year: item.startYear ?? null,
        end_year: item.endYear ?? null,
        sort_order: index,
      })),
    );
    if (error) {
      console.error('[profile] education insert failed', error);
      return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ saved: true });
}
