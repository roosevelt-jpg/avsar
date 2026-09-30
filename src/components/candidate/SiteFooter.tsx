import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { getDictionary, type Locale } from '@/lib/i18n';

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const links = [
    { href: `/${locale}/terms`, label: t.footerTerms },
    { href: `/${locale}/refund-policy`, label: t.footerRefund },
    { href: `/${locale}/delivery`, label: t.footerDelivery },
    { href: `/${locale}/privacy`, label: t.footerPrivacy },
    { href: `/${locale}/selection-rules`, label: t.selectionRules },
    { href: `/${locale}/contact`, label: t.footerContact },
  ];

  return (
    <footer className="bg-ink px-[clamp(20px,4cqi,56px)] py-[clamp(40px,6cqi,64px)] text-dark-muted-2">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <Wordmark tone="dark" />
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-dark-muted-2 underline underline-offset-[3px] hover:text-paper t-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="mt-8 border-t border-dark-line pt-6 font-mono text-[12px] text-dark-muted">
        {t.footerLegal}
      </p>
    </footer>
  );
}
