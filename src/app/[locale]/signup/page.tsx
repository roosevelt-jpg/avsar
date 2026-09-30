import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Wordmark } from '@/components/ui/Wordmark';
import { SignupFlow } from '@/components/candidate/SignupFlow';
import { OrderSummary } from '@/components/candidate/OrderSummary';
import { getDictionary, isLocale } from '@/lib/i18n';
import { POSITIONS, positionBySlug, type PositionSlug } from '@/lib/data/positions';
import { availablePaymentMethods, getPaymentProvider } from '@/lib/payments';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const metadata = { title: 'Register for Cohort 01' };

export default async function SignupPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ position?: string; status?: string; receipt?: string; session_id?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const t = getDictionary(locale);

  /* Position carried over from the landing page's selector. */
  const initialPosition: PositionSlug = positionBySlug(query.position ?? '')
    ? (query.position as PositionSlug)
    : POSITIONS[0].slug;

  /**
   * The success screen is only shown after the session is confirmed with the
   * provider. `?status=success` on its own proves nothing: anyone can type it.
   */
  let confirmedReceipt: string | undefined;
  if (query.status === 'success' && query.session_id) {
    const provider = getPaymentProvider();
    try {
      const { paid, paymentId } = await provider.confirmSession(query.session_id);
      if (paid) {
        confirmedReceipt = query.receipt;

        /* Mark it paid here too. The webhook is the source of truth, but it can
           arrive after the candidate is already looking at this page. */
        const supabase = getAdminSupabase();
        if (supabase) {
          await supabase
            .from('payments')
            .update({ status: 'paid', provider_payment_id: paymentId, paid_at: new Date().toISOString() })
            .eq('provider_order_id', query.session_id)
            .neq('status', 'paid');
        }
      }
    } catch (error) {
      console.error('[signup] session confirmation failed', error);
    }
  }

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-[clamp(20px,4cqi,56px)] py-[18px]">
        <Wordmark href={`/${locale}`} />
        <p className="m-0 text-[14px] text-muted">
          <Link href={`/${locale}/contact`} className="prose-link">
            {t.signup.help}
          </Link>
        </p>
      </header>

      <main className="flex flex-col gap-[clamp(28px,4cqi,56px)] px-[clamp(20px,4cqi,56px)] py-[clamp(36px,6cqi,72px)] lg:flex-row lg:items-start">
        <SignupFlow
          locale={locale}
          t={t}
          initialPosition={initialPosition}
          confirmedReceipt={confirmedReceipt}
          availableMethods={availablePaymentMethods()}
          provider={getPaymentProvider().name}
          providerMode={process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox'}
        />
        {!confirmedReceipt && <OrderSummary t={t} />}
      </main>
    </>
  );
}
