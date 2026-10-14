import { BRAND, ENTITY } from '@/lib/data/brand';
import type { Locale } from '@/lib/i18n';

/**
 * Site settings: the public, editable configuration of the site.
 *
 * Defaults live here and are what the site uses until an admin saves a value,
 * so a fresh deployment is complete rather than blank. Stored values are merged
 * over the defaults key by key, so adding a setting in code never needs a data
 * migration.
 *
 * NEVER put a secret in settings. The table is readable by anyone.
 *
 * The legal entity (the company that takes payment, its registration number and
 * registered address) is deliberately NOT here. It lives in src/lib/data/brand.ts
 * because it has to match the payment provider's merchant record exactly, and a
 * content editor should not be able to change it.
 */

export type NavItem = { label: string; labelHi?: string; labelAr?: string; href: string };

export type SiteSettings = {
  general: {
    siteName: string;
    tagline: string;
    supportPhone: string;
    whatsapp: string;
    supportEmail: string;
    officeAddress: string;
    officeHours: string;
    socials: { instagram: string; facebook: string; linkedin: string; youtube: string };
  };
  announcement: { enabled: boolean; text: string; linkLabel: string; href: string };
  navigation: { items: NavItem[]; headerCta: { label: string; href: string } };
  footer: { blurb: string };
  applications: {
    /** When true, a candidate must have paid for the assessment before applying. Off by default: applying should be free and fast. */
    requirePaidAssessment: boolean;
    /** Show the one-step "create account and apply" form on job pages. */
    allowQuickApply: boolean;
  };
  seo: { defaultTitle: string; defaultDescription: string; ogImage: string };
};

export const SETTINGS_KEYS = ['general', 'announcement', 'navigation', 'footer', 'applications', 'seo'] as const;
export type SettingsKey = (typeof SETTINGS_KEYS)[number];

export const DEFAULT_SETTINGS: SiteSettings = {
  general: {
    siteName: BRAND.name,
    tagline: BRAND.slogan,
    supportPhone: ENTITY.phone,
    whatsapp: ENTITY.phone,
    supportEmail: ENTITY.supportEmail,
    officeAddress: ENTITY.registeredAddress,
    officeHours: 'Monday to Friday, 10:00 to 19:00 IST',
    socials: { instagram: '', facebook: '', linkedin: '', youtube: '' },
  },
  announcement: {
    enabled: true,
    text: 'We never ask for money on WhatsApp or by bank transfer. Every payment happens on this website.',
    linkLabel: 'How to stay safe',
    href: '/stay-safe',
  },
  navigation: {
    items: [
      { label: 'Jobs', labelHi: 'नौकरियाँ', labelAr: 'الوظائف', href: '/jobs' },
      { label: 'How it works', labelHi: 'यह कैसे काम करता है', labelAr: 'كيف يعمل', href: '/how-it-works' },
      { label: 'Why Portugal', labelHi: 'पुर्तगाल क्यों', labelAr: 'لماذا البرتغال', href: '/why-portugal' },
      { label: 'Visa & relocation', labelHi: 'वीज़ा और स्थानांतरण', labelAr: 'التأشيرة والانتقال', href: '/visa-and-relocation' },
      { label: 'FAQ', labelHi: 'सवाल-जवाब', labelAr: 'الأسئلة الشائعة', href: '/faq' },
      { label: 'Employers', labelHi: 'नियोक्ता', labelAr: 'أصحاب العمل', href: '/employers' },
    ],
    headerCta: { label: 'Apply now', href: '/jobs' },
  },
  footer: {
    blurb: 'Recruitment from India to Portugal, with real employers, legal contracts and support from your first application to your first month at work.',
  },
  applications: { requirePaidAssessment: false, allowQuickApply: true },
  seo: {
    defaultTitle: `${BRAND.name} · Jobs in Portugal for Indian talent`,
    defaultDescription:
      'Apply for real jobs in Portugal from India. Free to apply, no placement fees for candidates, UPI accepted, visa and relocation support included.',
    ogImage: '/brand/og.png',
  },
};

/** Merge stored rows over defaults, one level deep per key. */
export function mergeSettings(rows: { key: string; value: unknown }[]): SiteSettings {
  const out = structuredClone(DEFAULT_SETTINGS) as SiteSettings;
  for (const row of rows) {
    if (!(SETTINGS_KEYS as readonly string[]).includes(row.key)) continue;
    const key = row.key as SettingsKey;
    if (row.value && typeof row.value === 'object') {
      (out as Record<string, unknown>)[key] = { ...(out[key] as object), ...(row.value as object) };
    }
  }
  return out;
}

/** Label for the current locale, falling back to English. */
export function navLabel(item: NavItem, locale: Locale): string {
  if (locale === 'hi' && item.labelHi) return item.labelHi;
  if (locale === 'ar' && item.labelAr) return item.labelAr;
  return item.label;
}

/**
 * Prefix a site path with the locale. Paths outside the candidate site
 * (employers, admin, api, assets) and absolute URLs are returned untouched.
 */
export function localHref(locale: Locale, href: string): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  if (/^\/(employers|admin|api|auth|brand|video|positions|walkthrough)(\/|$|\?|#)/.test(href)) return href;
  if (/^\/(en|hi|ar)(\/|$|\?|#)/.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

/** wa.me link from a phone number in any format. */
export function whatsappHref(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : '';
}
