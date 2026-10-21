import { formatFee, formatProductFee, type PricingSettings } from '@/lib/company/config';
import type { HiringSettings } from '@/lib/company/config';
import type { SiteSettings } from '@/lib/cms/settings';

/**
 * Facts the assistant may state even when no note was uploaded: they come
 * from Site settings, which staff edit, not from the model's own memory.
 */
export function companyFacts(settings: SiteSettings, pricing: PricingSettings, hiring: HiringSettings): { title: string; text: string } {
  const plain = (value: string) => value.replace(/[\u2066\u2069]/g, '');
  const skills = plain(formatProductFee(pricing, 'skills_report'));
  const visa = plain(formatProductFee(pricing, 'visa_requirements'));
  const bundle = plain(formatProductFee(pricing, 'bundle'));
  const separate = plain(formatFee(pricing));
  const text = [
    `The company on this website is ${settings.general.siteName}.`,
    `Support phone ${settings.general.supportPhone}. WhatsApp ${settings.general.whatsapp}. Email ${settings.general.supportEmail}.`,
    `Office hours: ${settings.general.officeHours}.`,
    `The account, the rewritten CV, the skills test, the score and applying are free. Joining the recruitment database is free. Interviews are free.`,
    `The skills report PDF costs ${skills}. The visa-requirements list costs ${visa}. Both together cost ${bundle} instead of ${separate}. Paid on this website only, with a receipt. Never cash, never a WhatsApp transfer, never an agent.`,
    `Buying a report does not change shortlist chances and does not guarantee an interview, a job or a visa.`,
    `A score above ${hiring.shortlistMinScore / 10} out of 10 qualifies for the shortlist.`,
    `A clear answer, yes or no, is aimed for within ${hiring.responseDays} days of a completed application.`,
    `The visa-requirements list is aimed for within ${hiring.legalReviewWithinDays} working days after the documents are in, once it has been bought. It is not a visa decision.`,
    `A full refund of the amount paid is available within 14 days if the paid document has not been downloaded. Downloading the free CV does not affect that refund.`,
    `A contract, housing, the flight and legal support come after a successful offer. The employer pays the placement fee.`,
  ].join(' ');
  return { title: 'Site settings', text };
}
