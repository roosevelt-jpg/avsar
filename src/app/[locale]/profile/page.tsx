import { notFound } from 'next/navigation';
import { Wordmark } from '@/components/ui/Wordmark';
import { AccountMenu } from '@/components/auth/AccountMenu';
import { CvUpload } from '@/components/candidate/CvUpload';
import { VoiceIntro } from '@/components/candidate/VoiceIntro';
import { ProfileForm } from '@/components/candidate/ProfileForm';
import { getDictionary, isLocale } from '@/lib/i18n';
import { requireCandidate } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getCandidateStatus } from '@/lib/candidate/status';
import type { ProfileInput } from '@/lib/validation-profile';

export const metadata = { title: 'Your profile' };

const EMPTY: ProfileInput = {
  skills: [],
  languages: [],
  relocationReady: true,
  experiences: [],
  education: [],
};

/** Turns a stored `YYYY-MM-DD` back into the `YYYY-MM` the month input wants. */
function toMonth(value: string | null): string {
  return value ? value.slice(0, 7) : '';
}

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  if (!isSupabaseConfigured()) {
    return (
      <>
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-[clamp(20px,4cqi,56px)] py-[18px]">
          <Wordmark href={`/${locale}`} />
        </header>
        <main className="px-[clamp(20px,4cqi,56px)] py-[clamp(36px,6cqi,72px)]">
          <ProfileForm t={t} initial={EMPTY} />
        </main>
      </>
    );
  }

  const candidate = await requireCandidate(locale, `/${locale}/profile`);
  const supabase = await getServerSupabase();
  const status = await getCandidateStatus(candidate.id, candidate.paymentStatus);

  const [profileRow, experienceRows, educationRows, voiceRow] = await Promise.all([
    supabase?.from('candidate_profiles').select('*').eq('candidate_id', candidate.id).maybeSingle(),
    supabase
      ?.from('candidate_experiences')
      .select('*')
      .eq('candidate_id', candidate.id)
      .order('sort_order'),
    supabase
      ?.from('candidate_education')
      .select('*')
      .eq('candidate_id', candidate.id)
      .order('sort_order'),
    supabase
      ?.from('candidate_voice_intros')
      .select('duration_seconds')
      .eq('candidate_id', candidate.id)
      .maybeSingle(),
  ]);

  const stored = profileRow?.data;

  const initial: ProfileInput = {
    headline: stored?.headline ?? undefined,
    summary: stored?.summary ?? undefined,
    linkedinUrl: stored?.linkedin_url ?? undefined,
    skills: (stored?.skills as string[] | null) ?? [],
    languages: (stored?.languages as ProfileInput['languages'] | null) ?? [],
    availability: stored?.availability ?? undefined,
    relocationReady: stored?.relocation_ready ?? true,
    experiences: (experienceRows?.data ?? []).map((row) => ({
      employer: row.employer as string,
      title: row.title as string,
      location: (row.location as string | null) ?? '',
      startMonth: toMonth(row.start_month as string | null),
      endMonth: toMonth(row.end_month as string | null),
      isCurrent: row.is_current as boolean,
      description: (row.description as string | null) ?? '',
    })),
    education: (educationRows?.data ?? []).map((row) => ({
      institution: row.institution as string,
      qualification: row.qualification as string,
      field: (row.field as string | null) ?? '',
      startYear: (row.start_year as number | null) ?? undefined,
      endYear: (row.end_year as number | null) ?? undefined,
    })),
  };

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-[clamp(20px,4cqi,56px)] py-[18px]">
        <Wordmark href={`/${locale}`} />
        <AccountMenu locale={locale} />
      </header>

      <main className="mx-auto max-w-[840px] px-[clamp(20px,4cqi,56px)] py-[clamp(36px,6cqi,72px)]">
        <h1 className="m-0 text-[clamp(28px,4cqi,44px)] font-semibold leading-[1.1] tracking-[-0.03em]">
          {t.profile.title}
        </h1>
        <p className="mt-3 mb-8 max-w-[62ch] text-[16px] leading-[1.6] text-ink-2">
          {t.profile.lead}
        </p>

        <div className="mb-5">
          <CvUpload t={t} alreadyUploaded={status.cvUploaded} />
        </div>

        {/* Next to the CV, because it is the same kind of thing: something the
            candidate gives an employer, not something we mark. */}
        <div className="mb-5">
          <VoiceIntro
            t={t}
            candidateId={candidate.id}
            existingSeconds={(voiceRow?.data?.duration_seconds as number | null) ?? null}
          />
        </div>

        <p className="mb-5 text-[14px] font-medium text-muted">{t.profile.orManual}</p>

        <ProfileForm t={t} initial={initial} />
      </main>
    </>
  );
}
