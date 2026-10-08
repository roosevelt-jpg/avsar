import Image from 'next/image';
import Link from 'next/link';
import { BRAND, ENTITY } from '@/lib/data/brand';
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
      {/* One mark in the footer, and it is the parent's. The recruitment
          wordmark is already in the header of every page; repeating it here
          competed with the thing that actually lends credibility. */}
      <div className="flex flex-wrap items-center justify-between gap-6">
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
      {/*
        The parent mark. A candidate abroad is being asked to send money to a
        company they have never heard of, and the one thing that makes that
        reasonable is that it belongs to a business with a name and an address.
        Hiding the parent would be the strange choice.

        Served at 320 wide and rendered at 160, so it stays sharp on a phone.
      */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-dark-line pt-6">
        <a
          href="https://www.smithandadams.com"
          target="_blank"
          rel="noopener noreferrer"
          className="t-colors opacity-70 hover:opacity-100"
        >
          <Image
            src="/smith-adams-group-light-320.png"
            alt={`${BRAND.parent} Group`}
            width={320}
            height={68}
            className="h-auto w-[160px]"
          />
        </a>
        <p className="m-0 font-mono text-[12px] tracking-[0.04em] text-dark-muted">
          {BRAND.slogan}
        </p>
        <p className="m-0 font-mono text-[12px] text-dark-muted">{t.footerLegal}</p>
      </div>

      {/*
        Who is actually being paid.

        The legal name, the licence number and the registered address, in full,
        because the company a candidate pays is not the name above the door and
        they should not have to find that out from their bank statement. It is
        also the first thing a payment provider's compliance review looks for on
        a live site, and the cheapest place to put it is where it already
        belongs.
      */}
      <div className="mt-6 flex flex-col gap-1 border-t border-dark-line pt-6 font-mono text-[12px] leading-[1.6] text-dark-muted">
        <p className="m-0">
          {ENTITY.legalName} · {ENTITY.registrationLabel} {ENTITY.registrationNumber}
        </p>
        <p className="m-0">{ENTITY.registeredAddress}</p>
        <p className="m-0">
          <a href={`tel:${ENTITY.phone.replace(/\s/g, '')}`} className="hover:text-paper t-colors">
            {ENTITY.phone}
          </a>
          {' · '}
          <a href={`mailto:${ENTITY.supportEmail}`} className="hover:text-paper t-colors">
            {ENTITY.supportEmail}
          </a>
        </p>
        <p className="m-0">
          Trading as {ENTITY.tradingAs}. Charges appear as {ENTITY.statementDescriptor}.
        </p>
      </div>
    </footer>
  );
}
