import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { safeUrl } from '@/lib/cms/sanitize';
import { audit } from '@/lib/audit';
import { COMPANY_KEYS, SETTINGS_KEYS, STATIC_SEO_PAGES, type SettingsKey, type StaticSeoPage } from '@/lib/cms/settings';
import { CHARGE_CURRENCIES, INDICATIVE_CURRENCIES, type ChargeCurrency, type IndicativeCurrency } from '@/lib/company/config';
import { EMAIL_IDS, type EmailId } from '@/lib/email/templates';
import type { Permission } from '@/lib/rbac/permissions';

export const runtime = 'nodejs';

const text = (max: number) => z.string().trim().max(max);
const email = z.string().trim().email().max(200);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
/* Integer minor units, capped well above any real price so a typo of extra
   zeros is refused rather than charged. */
const minor = z.number().int().min(0).max(100_000_000);
const url = z.string().trim().max(500).transform((value) => (value ? safeUrl(value) : ''));
const labels = z.record(z.string().max(8), text(80)).optional();
const nav = z.object({ label: text(40).min(1), labelHi: text(40).optional(), labelAr: text(40).optional(), labels, href: url });

/** One schema per settings key. Unknown keys are refused, so nothing arbitrary lands in a public table. */
const schemas = {
  general: z.object({
    siteName: text(80).min(1),
    tagline: text(160),
    supportPhone: text(40),
    whatsapp: text(40),
    supportEmail: z.string().trim().email().max(200),
    officeAddress: text(500),
    officeHours: text(160),
    familyVoiceUrl: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .transform((value) => (value ? safeUrl(value) : '')),
    socials: z.object({ instagram: url, facebook: url, linkedin: url, youtube: url, tiktok: url }),
  }),
  announcement: z.object({ enabled: z.boolean(), text: text(240), linkLabel: text(60), href: url }),
  navigation: z.object({ items: z.array(nav).max(10), headerCta: z.object({ label: text(40), href: url, labels }) }),
  footer: z.object({
    blurb: text(400),
    backgroundImage: url,
    backgroundImageAlt: text(160),
    quickLinksTitle: text(60),
    quickLinks: z.array(z.object({ label: text(60).min(1), href: url })).max(10),
    companyTitle: text(60),
    companyLinks: z.array(z.object({ label: text(60).min(1), href: url })).max(10),
    legalLinks: z.array(z.object({ label: text(60).min(1), href: url })).max(8),
    trustBadges: z.array(z.object({ label: text(60).min(1), icon: text(40) })).max(6),
    subscribeTitle: text(80),
    subscribeNote: text(240),
    subscribePlaceholder: text(80),
    followTitle: text(60),
    copyright: text(160),
  }),
  applications: z.object({ requirePaidAssessment: z.boolean(), allowQuickApply: z.boolean(), filmUrl: url, filmLabel: text(80) }),
  seo: z.object({
    defaultTitle: text(80),
    defaultDescription: text(200),
    defaultOgTitle: text(90),
    defaultOgDescription: text(200),
    ogImage: url,
    pages: z.object(
      Object.fromEntries(
        STATIC_SEO_PAGES.map(({ key }) => [
          key,
          z.object({
            title: text(80),
            description: text(200),
            ogTitle: text(90),
            ogDescription: text(200),
            ogImage: url,
          }),
        ]),
      ) as Record<
        StaticSeoPage,
        z.ZodObject<{
          title: z.ZodString;
          description: z.ZodString;
          ogTitle: z.ZodString;
          ogDescription: z.ZodString;
          ogImage: typeof url;
        }>
      >,
    ),
  }),
  company: z.object({
    legalName: text(160).min(1),
    tradingAs: text(80).min(1),
    statementDescriptor: text(40),
    registrationLabel: text(60),
    registrationNumber: text(60),
    registeredAddress: text(300),
    jurisdiction: text(120),
    descriptor: text(200),
    parentBrand: text(80),
    shortName: text(20),
    locations: text(120),
    website: url,
    phone: text(40),
    supportEmail: email,
    employerEmail: email,
    reportEmail: email,
    offices: z.array(z.object({ city: text(60).min(1), address: text(300) })).max(10),
    partner: z.object({
      legalName: text(160),
      registrationLabel: text(60),
      registrationNumber: text(60),
      address: text(300),
      manager: text(120),
      email: email.or(z.literal('')),
    }),
    dataProtectionName: text(120),
    dataProtectionEmail: email,
    financeName: text(120),
    financeEmail: email,
  }),
  pricing: z.object({
    chargeCurrency: z.enum(CHARGE_CURRENCIES as [ChargeCurrency, ...ChargeCurrency[]]),
    feeMinor: z.object({ INR: minor, EUR: minor, AED: minor }),
    skillsReportFeeMinor: z.object({ INR: minor, EUR: minor, AED: minor }),
    visaRequirementsFeeMinor: z.object({ INR: minor, EUR: minor, AED: minor }),
    bundleFeeMinor: z.object({ INR: minor, EUR: minor, AED: minor }),
    vatBasisPoints: z.number().int().min(0).max(3_000),
    indicativeRates: z.object(Object.fromEntries(INDICATIVE_CURRENCIES.map((c) => [c, z.number().positive().max(100_000)])) as Record<IndicativeCurrency, z.ZodNumber>),
    employerPlacementFeeMinor: minor,
  }),
  hiring: z.object({
    shortlistMinScore: z.number().int().min(0).max(99),
    outcomeShortlisted: z.number().int().min(1).max(100_000),
    outcomeHired: z.number().int().min(0).max(100_000),
    outcomeVisible: z.boolean(),
    outcomeBasis: text(600),
    responseDays: z.number().int().min(1).max(120),
    contractYears: z.number().int().min(1).max(10),
    reportWithinDays: z.number().int().min(1).max(60),
    legalReviewWithinDays: z.number().int().min(1).max(90),
    profileMonths: z.number().int().min(1).max(60),
    consentVersion: z.string().trim().regex(/^[a-z0-9.-]{2,30}$/i),
  }).refine((value) => value.outcomeHired <= value.outcomeShortlisted, { message: 'hired_exceeds_shortlisted', path: ['outcomeHired'] }),
  cohort: z.object({
    id: z.string().trim().regex(/^[a-z0-9-]{2,40}$/),
    name: text(60).min(1),
    corridor: text(80),
    closesAt: isoDate,
    reviewUntil: isoDate,
    announceAt: isoDate,
  }),
  emails: z.object(
    Object.fromEntries(
      EMAIL_IDS.map((id) => [id, z.object({ subject: text(200).min(1), heading: text(200).min(1), body: text(4000).min(1), action: text(60) })]),
    ) as Record<EmailId, z.ZodObject<{ subject: z.ZodString; heading: z.ZodString; body: z.ZodString; action: z.ZodString }>>,
  ),
  conversion: z.object({
    trustLines: z.array(text(280).min(1)).min(1).max(5),
    deliverables: z
      .array(z.object({ title: text(80).min(1), timing: text(400).min(1) }))
      .min(1)
      .max(6),
    offerHeading: text(120).min(1),
    offerBody: text(800).min(1),
    offerPrimaryLabel: text(60).min(1),
    offerSecondaryLabel: text(60).min(1),
    stickyCtaLabel: text(60).min(1),
    pricingLead: text(600).min(1),
    pricingFeatures: z.array(text(160).min(1)).min(1).max(10),
    pricingTitle: text(80).min(1),
    pricingQuestions: text(80).min(1),
    pricingStartCta: text(60).min(1),
    candidateEyebrow: text(40).min(1),
    candidatePeriod: text(40).min(1),
    employerEyebrow: text(60).min(1),
    employerPeriod: text(40).min(1),
    employerNote: text(200).min(1),
    employerFeatures: z.array(text(160).min(1)).min(1).max(8),
    partnerEyebrow: text(60).min(1),
    partnerPrice: text(40).min(1),
    partnerNote: text(200).min(1),
    partnerFeatures: z.array(text(160).min(1)).min(1).max(8),
    bookCall: text(40).min(1),
    contactSales: text(40).min(1),
    reportsHeading: text(80).min(1),
    storiesEyebrow: text(80).min(1),
    storiesTitle: text(80).min(1),
    storiesIntro: text(300).min(1),
    pricingFaq: z.array(z.object({ question: text(160).min(1), answer: text(800).min(1) })).min(1).max(8),
    mentionPackageInJobAlerts: z.boolean(),
  }),
  employerLanding: z.object({
    wordmarkSuffix: text(40).min(1),
    headerLinks: z.array(z.object({ label: text(60).min(1), href: text(120).min(1) })).min(1).max(10),
    navTalent: text(40).min(1),
    navHow: text(40).min(1),
    navPricing: text(40).min(1),
    navCandidates: text(40).min(1),
    headerCtaLabel: text(60).min(1),
    ctaLabel: text(60).min(1),
    ctaHref: text(120).min(1),
    secondaryCtaLabel: text(60).min(1),
    secondaryCtaHref: text(120).min(1),
    eyebrow: text(40).min(1),
    headline: text(200).min(1),
    accentWord: text(40),
    intro: text(500).min(1),
    badgeLabel: text(120).min(1),
    badgeSubtext: text(120),
    badgeHref: text(120),
    slides: z
      .array(z.object({ src: text(300).min(1), alt: text(160) }))
      .min(1)
      .max(8),
    statsCandidatesValue: text(40).min(1),
    statsCandidates: text(80).min(1),
    statsIndustriesValue: text(40).min(1),
    statsIndustries: text(80).min(1),
    statsPlacedValue: text(40).min(1),
    statsPlaced: text(80).min(1),
    hiringTimeValue: text(40).min(1),
    hiringTimeLabel: text(80).min(1),
    reasonsTitle: text(80).min(1),
    reasons: z
      .array(z.object({ icon: text(40).min(1), title: text(80).min(1), body: text(200).min(1) }))
      .min(1)
      .max(6),
    industriesTitle: text(120).min(1),
    industriesImage: text(300).min(1),
    industriesImageAlt: text(160),
    industries: z
      .array(z.object({ icon: text(40).min(1), label: text(80).min(1) }))
      .min(1)
      .max(8),
    stepsTitle: text(80).min(1),
    steps: z.array(z.object({ title: text(80).min(1), body: text(300).min(1) })).min(1).max(6),
    closingTitle: text(120).min(1),
    closingBody: text(300).min(1),
    contactTitle: text(120).min(1),
    contactNote: text(200).min(1),
    searchHeading: text(80).min(1),
  }),
  employerRegistration: z.object({
    headerLinks: z.array(z.object({ label: text(60).min(1), href: text(120).min(1) })).min(1).max(10),
    headerCtaLabel: text(60).min(1),
    headerCtaHref: text(120).min(1),
    eyebrow: text(60).min(1),
    headline: text(200).min(1),
    intro: text(600).min(1),
    slides: z.array(z.object({ src: text(300).min(1), alt: text(160) })).min(1).max(8),
    highlights: z.array(z.object({ icon: text(40).min(1), label: text(80).min(1) })).min(1).max(6),
    howTitle: text(120).min(1),
    howSteps: z.array(z.object({ icon: text(40).min(1), title: text(80).min(1), body: text(200).min(1) })).min(1).max(6),
    quote: text(500),
    quoteAttribution: text(160),
    quoteImage: text(300),
    quoteImageAlt: text(160),
    formTitle: text(120).min(1),
    formIntro: text(300).min(1),
    step1Label: text(60).min(1),
    step2Label: text(60).min(1),
    step3Label: text(60).min(1),
    companySectionTitle: text(80).min(1),
    contactSectionTitle: text(80).min(1),
    companyNameLabel: text(60).min(1),
    companyNamePlaceholder: text(80),
    industryLabel: text(60).min(1),
    countryLabel: text(60).min(1),
    cityLabel: text(60).min(1),
    cityPlaceholder: text(80),
    websiteLabel: text(60).min(1),
    websitePlaceholder: text(80),
    companySizeLabel: text(60).min(1),
    fullNameLabel: text(60).min(1),
    fullNamePlaceholder: text(80),
    jobTitleLabel: text(60).min(1),
    jobTitlePlaceholder: text(80),
    emailLabel: text(60).min(1),
    emailPlaceholder: text(80),
    phoneLabel: text(60).min(1),
    phonePlaceholder: text(80),
    industryOptions: z.array(text(80).min(1)).min(1).max(20),
    countryOptions: z.array(text(80).min(1)).min(1).max(20),
    companySizeOptions: z.array(text(40).min(1)).min(1).max(12),
    roleTitleLabel: text(60).min(1),
    roleTitlePlaceholder: text(80),
    openingsLabel: text(60).min(1),
    openingsPlaceholder: text(40),
    roleCityLabel: text(60).min(1),
    roleCityPlaceholder: text(80),
    employmentLabel: text(60).min(1),
    timelineLabel: text(60).min(1),
    notesLabel: text(80).min(1),
    notesPlaceholder: text(160),
    employmentOptions: z.array(text(40).min(1)).min(1).max(12),
    timelineOptions: z.array(text(80).min(1)).min(1).max(12),
    continueToHiring: text(80).min(1),
    continueToReview: text(80).min(1),
    backLabel: text(40).min(1),
    submitLabel: text(60).min(1),
    bookConsultationLabel: text(80).min(1),
    bookConsultationHref: text(120).min(1),
    privacyNote: text(200).min(1),
    successTitle: text(120).min(1),
    successBody: text(300).min(1),
    hiringSectionTitle: text(80).min(1),
    reviewSectionTitle: text(80).min(1),
  }),
  jobsBoard: z.object({
    heroEyebrow: text(60).min(1),
    heroHeadline: text(160).min(1),
    heroAccentWord: text(40),
    heroIntro: text(500).min(1),
    heroImage: text(300).min(1),
    heroImageAlt: text(160),
    searchKeywordPlaceholder: text(80).min(1),
    searchLocationLabel: text(40).min(1),
    searchCategoryLabel: text(40).min(1),
    searchButton: text(40).min(1),
    filterTitle: text(60).min(1),
    clearAll: text(40).min(1),
    categoryHeading: text(60).min(1),
    experienceHeading: text(60).min(1),
    employmentHeading: text(60).min(1),
    salaryHeading: text(60).min(1),
    salaryMinLabel: text(20).min(1),
    salaryMaxLabel: text(20).min(1),
    experienceEntry: text(40).min(1),
    experienceMid: text(40).min(1),
    experienceSenior: text(40).min(1),
    resultsHeading: text(80).min(1),
    sortLabel: text(40).min(1),
    sortNewest: text(40).min(1),
    sortSalary: text(40).min(1),
    verifiedBadge: text(40).min(1),
    viewDetails: text(40).min(1),
    applyNow: text(40).min(1),
    statsVacanciesValue: text(40).min(1),
    statsVacancies: text(80).min(1),
    statsEmployersValue: text(40).min(1),
    statsEmployers: text(80).min(1),
    statsPlacedValue: text(40).min(1),
    statsPlaced: text(80).min(1),
    emptyTitle: text(120).min(1),
    emptyBody: text(300).min(1),
  }),
  vsl: z.object({
    eyebrow: text(80),
    headline: text(160).min(1),
    subhead: text(500).min(1),
    videoUrl: url,
    videoPoster: url,
    videoTitle: text(120),
    highlights: z.array(text(200).min(1)).min(1).max(6),
    primaryCtaLabel: text(60).min(1),
    secondaryCtaLabel: text(60).min(1),
    stickyCtaLabel: text(60).min(1),
  }),
} as const;

const bodySchema = z.object({ key: z.enum(SETTINGS_KEYS), value: z.unknown() });

/* Application rules change who can apply, which is a recruitment decision,
   not a content one. The company sections hold the legal entity and the
   price, which must match the merchant account, so only super admins. */
function permissionFor(key: SettingsKey): Permission {
  if (key === 'applications') return 'jobs.publish';
  if ((COMPANY_KEYS as readonly string[]).includes(key)) return 'company.manage';
  return 'settings.manage';
}

export async function PUT(request: Request) {
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const guard = await apiPermission(permissionFor(body.data.key));
  if (guard instanceof NextResponse) return guard;

  const parsed = schemas[body.data.key].safeParse(body.data.value);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation_failed', issues: parsed.error.flatten() }, { status: 422 });
  }

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { error } = await admin
    .from('site_settings')
    .upsert({ key: body.data.key, value: parsed.data, updated_by: guard.userId, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: 'storage_failed' }, { status: 500 });

  /* The company sections are few, small and consequential, so the audit keeps
     the whole saved value: who changed the price, and to what, is answerable. */
  const detail = (COMPANY_KEYS as readonly string[]).includes(body.data.key) ? { value: parsed.data } : undefined;
  await audit(guard.userId, 'settings.update', `settings:${body.data.key}`, detail);
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}
