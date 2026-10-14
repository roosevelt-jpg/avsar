import { ASSESSMENT_FEE, CONTRACT_YEARS, RESPONSE_DAYS, SELECTION_FUNNEL, applicantHireRate } from '@/lib/data/brand';
import type { SiteSettings } from './settings';

/**
 * Placeholders an editor can type into any CMS text: {{fee_inr}}, {{support_phone}}.
 *
 * They exist so a number that is decided in code (the fee, the response time,
 * the published odds) is written in one place. If the fee changes, every page
 * that mentions it changes with it, instead of one page quietly disagreeing.
 */

export const TOKEN_HELP: { token: string; meaning: string }[] = [
  { token: '{{fee_inr}}', meaning: 'Assessment fee in rupees' },
  { token: '{{response_days}}', meaning: 'Days to an answer' },
  { token: '{{contract_years}}', meaning: 'Typical contract length in years' },
  { token: '{{hire_rate}}', meaning: 'Applicants hired, per hundred' },
  { token: '{{funnel_call}}', meaning: 'Applicants per hundred who reach a call' },
  { token: '{{funnel_presented}}', meaning: 'Applicants per hundred presented to an employer' },
  { token: '{{support_phone}}', meaning: 'Support phone (Site settings)' },
  { token: '{{support_email}}', meaning: 'Support email (Site settings)' },
  { token: '{{whatsapp}}', meaning: 'WhatsApp number (Site settings)' },
  { token: '{{whatsapp_digits}}', meaning: 'WhatsApp digits, for https://wa.me/{{whatsapp_digits}} links' },
  { token: '{{brand}}', meaning: 'Site name (Site settings)' },
];

export function tokenValues(settings: SiteSettings): Record<string, string> {
  const funnel = SELECTION_FUNNEL.perHundredApplicants;
  return {
    fee_inr: `₹${ASSESSMENT_FEE.inr.toLocaleString('en-IN')}`,
    response_days: String(RESPONSE_DAYS),
    contract_years: String(CONTRACT_YEARS),
    hire_rate: String(applicantHireRate()),
    funnel_call: String(funnel.reachAssessmentCall),
    funnel_presented: String(funnel.presentedToEmployer),
    support_phone: settings.general.supportPhone,
    support_email: settings.general.supportEmail,
    whatsapp: settings.general.whatsapp,
    whatsapp_digits: settings.general.whatsapp.replace(/[^\d]/g, ''),
    brand: settings.general.siteName,
  };
}

/** Replace every known {{token}} in a string. Unknown tokens are left visible so an editor notices. */
export function applyTokens(text: string, values: Record<string, string>): string {
  if (!text.includes('{{')) return text;
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (whole, key: string) => values[key] ?? whole);
}

/** Deep-apply tokens to every string inside block data. */
export function applyTokensDeep<T>(value: T, values: Record<string, string>): T {
  if (typeof value === 'string') return applyTokens(value, values) as T;
  if (Array.isArray(value)) return value.map((item) => applyTokensDeep(item, values)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value)) out[key] = applyTokensDeep(inner, values);
    return out as T;
  }
  return value;
}
