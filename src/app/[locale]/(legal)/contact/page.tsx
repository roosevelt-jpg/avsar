import { notFound } from 'next/navigation';
import { EntityDetails } from '@/components/ui/EntityDetails';
import { getDictionary, isLocale } from '@/lib/i18n';
import { ENTITY, RESPONSE_DAYS } from '@/lib/data/brand';

export const metadata = { title: 'Contact' };

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <>
      <h1>{t.footerContact}</h1>

      <h2>Registered office</h2>
      <EntityDetails />

      <h2>Candidates</h2>
      <p>
        <span className="font-mono">{ENTITY.supportEmail}</span>
        <br />
        We answer within two working days, and give a decision on an application within{' '}
        {RESPONSE_DAYS} days.
      </p>

      <h2>Employers</h2>
      <p>
        <span className="font-mono">{ENTITY.employerEmail}</span>
      </p>

      <h2>If anyone asks you for money</h2>
      <p>
        Nobody is authorised to charge a candidate anything beyond the assessment fee paid on this
        site. Not an agent, not an intermediary, not anyone claiming to represent us. If it happens,
        tell us at <span className="font-mono">{ENTITY.reportEmail}</span>. You can do it without
        giving your name, and it will not affect your application.
      </p>
    </>
  );
}
