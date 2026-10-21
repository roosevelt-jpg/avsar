import { renderToBuffer } from '@react-pdf/renderer';
import { LegalDocument } from '@/lib/report/LegalDocument';
import { getSessionCandidate, hasPaid } from '@/lib/auth';
import { getSiteSettings } from '@/lib/cms/data';
import { deliveredReviewFor } from '@/lib/legal/review';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * The delivered preliminary legal review, as a PDF.
 *
 * Only after a person has delivered it. A draft is not a document the
 * candidate should be able to download.
 */
export async function GET() {
  const candidate = await getSessionCandidate();
  if (!candidate) return new Response('Unauthorized', { status: 401 });
  if (!hasPaid(candidate)) return new Response('Payment required', { status: 402 });

  const review = await deliveredReviewFor(candidate.id);
  if (!review) return new Response('Legal review not ready', { status: 404 });

  const settings = await getSiteSettings();
  const buffer = await renderToBuffer(
    <LegalDocument
      data={{
        siteName: settings.general.siteName,
        name: candidate.fullName,
        summary: review.summary,
        requirements: review.requirements,
        missingDocuments: review.missingDocuments,
        issues: review.issues,
        deliveredAt: review.deliveredAt
          ? new Date(review.deliveredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
          : '',
      }}
    />,
  );

  const safeName = candidate.fullName.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'candidate';
  return new Response(new Uint8Array(buffer), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${safeName}-legal-review.pdf"`,
      'cache-control': 'private, no-store',
    },
  });
}
