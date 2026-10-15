import { renderToBuffer } from '@react-pdf/renderer';
import { ReportDocument, type ReportData } from '@/lib/report/ReportDocument';
import { canReceiveReport, getSessionCandidate, getSessionStaff } from '@/lib/auth';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { sectorLabel, SECTOR_SLUGS, type SectorSlug } from '@/lib/data/sectors';
import { getSiteSettings } from '@/lib/cms/data';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * The skills report as a downloadable PDF.
 *
 * Rendered on request rather than stored: a report is small, changes when the
 * cohort is re-ranked, and keeping a stale copy in a bucket means a candidate
 * can be holding a percentile that no longer matches the one an employer sees.
 *
 * A candidate can fetch only their own, and only once they have proved the
 * email address. Nothing earlier in the funnel waits on that proof, because a
 * funnel that stalls on an email arriving in the right browser loses people
 * for reasons they cannot see. This is the point where it has to hold: the
 * report is delivered to that address, and it names them, their score and
 * their rank against the cohort.
 *
 * Staff can fetch any, with `?candidate=`, because reviewing a report is their
 * job.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const requested = url.searchParams.get('candidate');

  const staff = await getSessionStaff();
  const candidate = staff ? null : await getSessionCandidate();

  if (!staff && !candidate) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (candidate && !canReceiveReport(candidate)) {
    /* 403 and not 404: they have a report, and telling them so is how they
       learn to go and click the link in their email. */
    return new Response('Email address not verified', { status: 403 });
  }

  const candidateId = staff ? requested : candidate?.id;
  if (!candidateId) return new Response('Not found', { status: 404 });

  const admin = getAdminSupabase();
  if (!admin) return new Response('Storage not configured', { status: 503 });

  const [{ data: person }, { data: report }] = await Promise.all([
    admin.from('candidates').select('full_name, sector').eq('id', candidateId).maybeSingle(),
    admin
      .from('reports')
      .select(
        'overall_score, english_cefr, skills_score, experience_score, percentile, breakdown, generated_at, english_source, english_certified',
      )
      .eq('candidate_id', candidateId)
      .maybeSingle(),
  ]);

  if (!person || !report) return new Response('Report not ready', { status: 404 });

  const sector: SectorSlug = (SECTOR_SLUGS as readonly string[]).includes(person.sector as string)
    ? (person.sector as SectorSlug)
    : SECTOR_SLUGS[0];

  const { cohort: COHORT } = await getSiteSettings();
  const data: ReportData = {
    name: person.full_name as string,
    sector: sectorLabel(sector),
    cohortName: COHORT.name,
    overall: report.overall_score as number,
    percentile: (report.percentile as number | null) ?? null,
    english: report.english_cefr as string,
    englishCertified: Boolean(report.english_certified),
    englishNote: report.english_certified
      ? 'Certified assessment'
      : 'S&A assessment, not certified',
    skills: report.skills_score as number,
    experience: report.experience_score as number,
    breakdown: Array.isArray(report.breakdown)
      ? (report.breakdown as { label?: string; score?: number }[]).map((axis) => ({
          label: axis.label ?? '',
          score: axis.score ?? 0,
        }))
      : [],
    generatedAt: new Date(report.generated_at as string).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    /* Short, stable, and tied to the candidate row, so a report handed to an
       employer can be traced back without exposing the full id. */
    reference: `AV-${COHORT.id.replace(/\D/g, '') || '01'}-${candidateId.slice(0, 8).toUpperCase()}`,
  };

  const buffer = await renderToBuffer(<ReportDocument data={data} />);

  return new Response(new Uint8Array(buffer), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="avsar-skills-report-${data.reference}.pdf"`,
      /* Never cached by a shared cache: this is one person's document. */
      'cache-control': 'private, no-store',
    },
  });
}
