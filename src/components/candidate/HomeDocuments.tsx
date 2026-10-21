import Link from 'next/link';
import { getSessionCandidate } from '@/lib/auth';
import { candidateEntitlements } from '@/lib/payments/entitlements';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { deliveredReviewFor } from '@/lib/legal/review';
import { getDictionary, localePath, type Locale } from '@/lib/i18n';

/**
 * On the home page, the same downloads the dashboard offers, once each file exists.
 *
 * A visitor who is not signed in sees nothing here. The marketing page stays
 * the marketing page. A candidate who has a report, a prepared CV, or a
 * delivered legal review gets the links without hunting for the dashboard.
 */
export async function HomeDocuments({ locale }: { locale: Locale }) {
  const candidate = await getSessionCandidate();
  if (!candidate) return null;

  const owns = await candidateEntitlements(candidate.id, candidate.paymentStatus);
  const admin = getAdminSupabase();
  const [{ data: pack }, review] = await Promise.all([
    admin
      ? admin.from('career_packs').select('candidate_id').eq('candidate_id', candidate.id).maybeSingle()
      : Promise.resolve({ data: null }),
    owns.visa ? deliveredReviewFor(candidate.id) : Promise.resolve(null),
  ]);

  const d = getDictionary(locale).dash;
  const items = [
    owns.skills && candidate.emailConfirmed
      ? { href: localePath(locale, '/dashboard/report.pdf'), label: d.download }
      : null,
    pack ? { href: localePath(locale, '/dashboard/cv.pdf'), label: d.downloadCv } : null,
    review ? { href: localePath(locale, '/dashboard/legal.pdf'), label: d.downloadLegal } : null,
  ].filter((item): item is { href: string; label: string } => item !== null);

  if (items.length === 0) return null;

  return (
    <section className="border-b border-[rgba(22,50,79,0.12)] bg-[#fbfcfe]">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
        <p className="m-0 text-[14px] font-medium text-[#16324f]">{d.documents}</p>
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="text-[14px] text-[#16324f] underline decoration-[#e7b48a] underline-offset-4">
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
