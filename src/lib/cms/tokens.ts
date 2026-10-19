import { formatFee, formatIndicative, formatMoney } from '@/lib/company/config';
import type { SiteSettings } from './settings';

/**
 * Placeholders an editor can type into any CMS text: {{fee_inr}}, {{support_phone}}.
 *
 * They exist so a number set in Settings (the fee, the response time, the
 * published odds, the company details) is written in one place. If the fee
 * changes, every page that mentions it changes with it, instead of one page
 * quietly disagreeing.
 */

export const TOKEN_HELP: { token: string; meaning: string }[] = [
  { token: '{{fee_inr}}', meaning: 'Career package price (in rupees, or the charged currency with rupees as a guide)' },
  { token: '{{fee}}', meaning: 'Career package price exactly as charged, e.g. AED 105' },
  { token: '{{employer_fee}}', meaning: 'Placement fee the employer pays, in euros' },
  { token: '{{response_days}}', meaning: 'Working days to an answer' },
  { token: '{{report_days}}', meaning: 'Days to deliver the package report' },
  { token: '{{profile_months}}', meaning: 'Months a profile stays in the database' },
  { token: '{{contract_years}}', meaning: 'Typical contract length in years' },
  { token: '{{shortlist_hired}}', meaning: 'Shortlisted candidates historically hired, out of shortlist_size' },
  { token: '{{shortlist_size}}', meaning: 'Shortlisted candidates the historical figure is out of' },
  { token: '{{shortlist_score}}', meaning: 'Assessment score out of 10 a candidate must be above to be shortlisted' },
  { token: '{{outcome_basis}}', meaning: 'The sentence that must accompany the historical figure' },
  { token: '{{legal_name}}', meaning: 'Legal name of the company that takes payment' },
  { token: '{{registration}}', meaning: 'Its registration, e.g. Trade licence 1174293' },
  { token: '{{registered_address}}', meaning: 'Its registered address' },
  { token: '{{jurisdiction}}', meaning: 'Governing law and courts' },
  { token: '{{statement_descriptor}}', meaning: 'What the card or UPI statement shows' },
  { token: '{{partner_name}}', meaning: 'Portuguese placement partner' },
  { token: '{{partner_registration}}', meaning: 'Partner registration, e.g. NIPC 517818817' },
  { token: '{{partner_address}}', meaning: 'Partner address' },
  { token: '{{offices}}', meaning: 'Offices as a list (put it on a line of its own)' },
  { token: '{{office_hours}}', meaning: 'Office hours (Site settings)' },
  { token: '{{dpo_name}}', meaning: 'Data protection contact' },
  { token: '{{dpo_email}}', meaning: 'Data protection email' },
  { token: '{{finance_email}}', meaning: 'Finance and refunds email' },
  { token: '{{employer_email}}', meaning: 'Employer enquiries email' },
  { token: '{{report_email}}', meaning: 'Scam and fraud reports email' },
  { token: '{{consent_version}}', meaning: 'Current version of the terms candidates agree to' },
  { token: '{{support_phone}}', meaning: 'Support phone (Site settings)' },
  { token: '{{support_email}}', meaning: 'Support email (Site settings)' },
  { token: '{{whatsapp}}', meaning: 'WhatsApp number (Site settings)' },
  { token: '{{whatsapp_digits}}', meaning: 'WhatsApp digits, for https://wa.me/{{whatsapp_digits}} links' },
  { token: '{{brand}}', meaning: 'Site name (Site settings)' },
];

export function tokenValues(settings: SiteSettings): Record<string, string> {
  const { company, pricing, hiring } = settings;
  const fee = formatFee(pricing).replace(/[\u2066\u2069]/g, '');
  return {
    /* The amount actually charged, with the rupee figure as a guide when the
       charge is in another currency, so the page never quotes a price the
       checkout will not show. */
    fee_inr: pricing.chargeCurrency === 'INR' ? fee : `${fee} (about ${formatIndicative(pricing, 'INR')})`,
    fee,
    employer_fee: formatMoney(pricing.employerPlacementFeeMinor, 'EUR').replace(/[\u2066\u2069]/g, ''),
    response_days: String(hiring.responseDays),
    report_days: String(hiring.reportWithinDays),
    profile_months: String(hiring.profileMonths),
    contract_years: String(hiring.contractYears),
    shortlist_hired: String(hiring.outcomeHired),
    shortlist_size: String(hiring.outcomeShortlisted),
    shortlist_score: String(hiring.shortlistMinScore / 10),
    outcome_basis: hiring.outcomeBasis,
    legal_name: company.legalName,
    registration: [company.registrationLabel, company.registrationNumber].filter(Boolean).join(' '),
    registered_address: company.registeredAddress,
    jurisdiction: company.jurisdiction,
    statement_descriptor: company.statementDescriptor,
    partner_name: company.partner.legalName,
    partner_registration: [company.partner.registrationLabel, company.partner.registrationNumber].filter(Boolean).join(' '),
    partner_address: company.partner.address,
    offices: company.offices.map((office) => `- **${office.city}**: ${office.address}`).join('\n'),
    office_hours: settings.general.officeHours,
    dpo_name: company.dataProtectionName,
    dpo_email: company.dataProtectionEmail,
    finance_email: company.financeEmail,
    employer_email: company.employerEmail,
    report_email: company.reportEmail,
    consent_version: hiring.consentVersion,
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
