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
    socials: z.object({ instagram: url, facebook: url, linkedin: url, youtube: url }),
  }),
  announcement: z.object({ enabled: z.boolean(), text: text(240), linkLabel: text(60), href: url }),
  navigation: z.object({ items: z.array(nav).max(10), headerCta: z.object({ label: text(40), href: url, labels }) }),
  footer: z.object({ blurb: text(400) }),
  applications: z.object({ requirePaidAssessment: z.boolean(), allowQuickApply: z.boolean(), filmUrl: url, filmLabel: text(80) }),
  seo: z.object({
    defaultTitle: text(80),
    defaultDescription: text(200),
    ogImage: url,
    pages: z.object(
      Object.fromEntries(
        STATIC_SEO_PAGES.map(({ key }) => [key, z.object({ title: text(80), description: text(200), ogTitle: text(90), ogImage: url })]),
      ) as Record<StaticSeoPage, z.ZodObject<{ title: z.ZodString; description: z.ZodString; ogTitle: z.ZodString; ogImage: typeof url }>>,
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
    mentionPackageInJobAlerts: z.boolean(),
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
