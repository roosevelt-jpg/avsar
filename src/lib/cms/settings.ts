import { BRAND, ENTITY } from '@/lib/data/brand';
import { isLocale, localePath, type Locale } from '@/lib/i18n/path';

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

export type NavItem = {
  label: string;
  /** Kept so a saved Hindi or Arabic label from the console still wins. */
  labelHi?: string;
  labelAr?: string;
  /** Other languages, keyed by locale. Missing keys fall back to English. */
  labels?: Partial<Record<Locale, string>>;
  href: string;
};

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
  navigation: { items: NavItem[]; headerCta: { label: string; href: string; labels?: Partial<Record<Locale, string>> } };
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
      {
        label: 'Jobs',
        labelHi: 'नौकरियाँ',
        labelAr: 'الوظائف',
        labels: { bn: 'চাকরি', mr: 'नोकऱ्या', te: 'ఉద్యోగాలు', ta: 'வேலைகள்', ur: 'نوکریاں', gu: 'નોકરીઓ', kn: 'ಉದ್ಯೋಗಗಳು', or: 'ଚାକିରି', ml: 'ജോലികൾ', pa: 'ਨੌਕਰੀਆਂ', as: 'চাকৰি' },
        href: '/jobs',
      },
      {
        label: 'How it works',
        labelHi: 'यह कैसे काम करता है',
        labelAr: 'كيف يعمل',
        labels: { bn: 'কীভাবে কাজ করে', mr: 'हे कसे काम करते', te: 'ఇది ఎలా పని చేస్తుంది', ta: 'எப்படி வேலை செய்கிறது', ur: 'یہ کیسے کام کرتا ہے', gu: 'આ કેવી રીતે કામ કરે છે', kn: 'ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ', or: 'ଏହା କିପରି କାମ କରେ', ml: 'എങ്ങനെ പ്രവർത്തിക്കുന്നു', pa: 'ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ', as: 'এইটো কেনেকৈ কাম কৰে' },
        href: '/how-it-works',
      },
      {
        label: 'Why Portugal',
        labelHi: 'पुर्तगाल क्यों',
        labelAr: 'لماذا البرتغال',
        labels: { bn: 'পর্তুগাল কেন', mr: 'पोर्तुगाल का', te: 'పోర్చుగల్ ఎందుకు', ta: 'ஏன் போர்ச்சுகல்', ur: 'پرتگال کیوں', gu: 'પોર્ટુગલ શા માટે', kn: 'ಪೋರ್ಚುಗಲ್ ಏಕೆ', or: 'ପର୍ତ୍ତୁଗାଲ କାହିଁକି', ml: 'എന്തുകൊണ്ട് പോർച്ചുഗൽ', pa: 'ਪੁਰਤਗਾਲ ਕਿਉਂ', as: 'পৰ্তুগাল কিয়' },
        href: '/why-portugal',
      },
      {
        label: 'Visa & relocation',
        labelHi: 'वीज़ा और स्थानांतरण',
        labelAr: 'التأشيرة والانتقال',
        labels: { bn: 'ভিসা ও স্থানান্তর', mr: 'व्हिसा आणि स्थलांतर', te: 'వీసా మరియు తరలింపు', ta: 'விசா மற்றும் இடமாற்றம்', ur: 'ویزا اور منتقلی', gu: 'વિઝા અને સ્થળાંતર', kn: 'ವೀಸಾ ಮತ್ತು ಸ್ಥಳಾಂತರ', or: 'ଭିସା ଏବଂ ସ୍ଥାନାନ୍ତର', ml: 'വിസയും മാറ്റിപ്പാർപ്പും', pa: 'ਵੀਜ਼ਾ ਅਤੇ ਤਬਾਦਲਾ', as: 'ভিছা আৰু স্থানান্তৰ' },
        href: '/visa-and-relocation',
      },
      {
        label: 'FAQ',
        labelHi: 'सवाल-जवाब',
        labelAr: 'الأسئلة الشائعة',
        labels: { bn: 'প্রশ্নোত্তর', mr: 'प्रश्न', te: 'ప్రశ్నలు', ta: 'கேள்விகள்', ur: 'سوالات', gu: 'પ્રશ્નો', kn: 'ಪ್ರಶ್ನೆಗಳು', or: 'ପ୍ରଶ୍ନ', ml: 'ചോദ്യങ്ങൾ', pa: 'ਸਵਾਲ', as: 'প্ৰশ্ন' },
        href: '/faq',
      },
      {
        label: 'Employers',
        labelHi: 'नियोक्ता',
        labelAr: 'أصحاب العمل',
        labels: { bn: 'নিয়োগকর্তা', mr: 'नियोक्ते', te: 'యజమానులు', ta: 'முதலாளிகள்', ur: 'آجر', gu: 'નોકરીદાતાઓ', kn: 'ಉದ್ಯೋಗದಾತರು', or: 'ନିଯୁକ୍ତିଦାତା', ml: 'തൊഴിലുടമകൾ', pa: 'ਮਾਲਕ', as: 'নিয়োগকর্তা' },
        href: '/employers',
      },
    ],
    headerCta: {
      label: 'Apply now',
      href: '/jobs',
      labels: { hi: 'अभी आवेदन करें', bn: 'এখনই আবেদন করুন', mr: 'आत्ता अर्ज करा', te: 'ఇప్పుడే దరఖాస్తు చేయండి', ta: 'இப்போது விண்ணப்பிக்கவும்', ur: 'اب درخواست دیں', gu: 'હમણાં અરજી કરો', kn: 'ಈಗ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ', or: 'ଏବେ ଆବେଦନ କରନ୍ତୁ', ml: 'ഇപ്പോൾ അപേക്ഷിക്കുക', pa: 'ਹੁਣੇ ਅਰਜ਼ੀ ਦਿਓ', as: 'এতিয়াই আবেদন কৰক', ar: 'قدّم الآن' },
    },
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
  const translated = item.labels?.[locale];
  if (translated) return translated;
  if (locale === 'hi' && item.labelHi) return item.labelHi;
  if (locale === 'ar' && item.labelAr) return item.labelAr;
  return item.label;
}

/** Header button, with the same fallback as navigation labels. */
export function ctaLabel(cta: { label: string; labels?: Partial<Record<Locale, string>> }, locale: Locale): string {
  return cta.labels?.[locale] || cta.label;
}

/**
 * Public URL for a candidate path in this language.
 *
 * English has no prefix. Paths outside the candidate site (employers, admin,
 * api, assets) and absolute URLs are returned untouched, as is a path that
 * already names its language.
 */
export function localHref(locale: Locale, href: string): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  if (/^\/(employers|admin|api|auth|dev|brand|video|positions|walkthrough)(\/|$|\?|#)/.test(href)) return href;
  const segment = href.split(/[/?#]/)[1] ?? '';
  if (isLocale(segment)) return href;
  return localePath(locale, href);
}

/** wa.me link from a phone number in any format. */
export function whatsappHref(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : '';
}
