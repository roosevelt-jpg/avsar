import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/candidate/SiteHeader';
import { SiteFooter } from '@/components/candidate/SiteFooter';
import { isLocale } from '@/lib/i18n';

export default async function LegalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-[760px] px-[clamp(20px,4cqi,56px)] py-[clamp(40px,6cqi,80px)]">
        <div className="[&_h1]:m-0 [&_h1]:mb-6 [&_h1]:text-[clamp(30px,4.4cqi,52px)] [&_h1]:font-semibold [&_h1]:leading-[1.08] [&_h1]:tracking-[-0.035em] [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-[21px] [&_h2]:font-semibold [&_li]:mb-2 [&_p]:my-4 [&_p]:text-[16px] [&_p]:leading-[1.65] [&_p]:text-ink-2 [&_ul]:my-4 [&_ul]:pl-5 [&_ul]:text-[16px] [&_ul]:leading-[1.65] [&_ul]:text-ink-2">
          {children}
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
