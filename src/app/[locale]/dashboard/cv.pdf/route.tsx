import { renderToBuffer } from '@react-pdf/renderer';
import { CvDocument, type CvData, type CvTemplate } from '@/lib/report/CvDocument';
import { getSessionCandidate } from '@/lib/auth';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { positionLabel } from '@/lib/data/positions';
import type { CareerPack } from '@/lib/cv/coach-schema';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isTemplate(value: string | null): value is CvTemplate {
  return value === 'standard' || value === 'europass' || value === 'professional';
}

/**
 * The candidate's rewritten CV, as a PDF.
 *
 * Rendered per request rather than stored, because the candidate can pick a
 * different template at any time and a stored file would go stale the moment
 * they regenerate the pack.
 *
 * Their own only. Unlike the skills report, there is no staff route here: a CV
 * is a document the candidate sends out under their own name, and nobody else
 * needs to pull it from this endpoint.
 */
export async function GET(request: Request) {
  const candidate = await getSessionCandidate();
  if (!candidate) return new Response('Unauthorized', { status: 401 });

  const admin = getAdminSupabase();
  if (!admin) return new Response('Storage not configured', { status: 503 });

  const { data: pack } = await admin
    .from('career_packs')
    .select('improved_cv')
    .eq('candidate_id', candidate.id)
    .maybeSingle();

  if (!pack?.improved_cv) return new Response('Career pack not ready', { status: 404 });

  const { data: profile } = await admin
    .from('candidate_profiles')
    .select('country')
    .eq('candidate_id', candidate.id)
    .maybeSingle();

  const url = new URL(request.url);
  const templateParam = url.searchParams.get('template');
  const template: CvTemplate = isTemplate(templateParam) ? templateParam : 'standard';

  const { data: contact } = await admin
    .from('candidates')
    .select('city_state, phone, email')
    .eq('id', candidate.id)
    .maybeSingle();

  const data: CvData = {
    name: candidate.fullName,
    email: candidate.email,
    phone: (contact?.phone as string | null) ?? '',
    location: [contact?.city_state, profile?.country].filter(Boolean).join(', '),
    position: positionLabel(candidate.position ?? ''),
    cv: pack.improved_cv as CareerPack['improvedCv'],
  };

  const buffer = await renderToBuffer(<CvDocument data={data} template={template} />);

  const safeName = data.name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'candidate';

  return new Response(new Uint8Array(buffer), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${safeName}-CV-${template}.pdf"`,
      'cache-control': 'private, no-store',
    },
  });
}
