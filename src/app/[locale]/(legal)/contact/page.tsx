import { notFound } from 'next/navigation';
import { DraftNotice } from '@/components/ui/DraftNotice';
import { getDictionary, isLocale } from '@/lib/i18n';

export const metadata = { title: 'Contact' };

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <>
      <h1>{t.footerContact}</h1>

      <DraftNotice note="Placeholder details. Replace with the registered entity name, address and the real support channels." />

      <h2>Candidates</h2>
      <p>WhatsApp +91 80 0000 0000 · support@avsar.example</p>

      <h2>Employers</h2>
      <p>employers@avsar.example</p>

      <h2>Report a fee you were asked to pay</h2>
      <p>
        No one is authorised to charge a candidate anything beyond the assessment fee paid on this
        site. If an agent or intermediary asks for money, report it to report@avsar.example. Reports
        can be anonymous.
      </p>
    </>
  );
}
