import { formatFee, type PricingSettings } from '@/lib/company/config';
import type { HiringSettings } from '@/lib/company/config';
import type { SiteSettings } from '@/lib/cms/settings';

/**
 * Facts the assistant may state even when no note was uploaded: they come
 * from Site settings, which staff edit, not from the model's own memory.
 */
export function companyFacts(settings: SiteSettings, pricing: PricingSettings, hiring: HiringSettings): { title: string; text: string } {
  const fee = formatFee(pricing);
  const text = [
    `The company on this website is ${settings.general.siteName}.`,
    `Support phone ${settings.general.supportPhone}. WhatsApp ${settings.general.whatsapp}. Email ${settings.general.supportEmail}.`,
    `Office hours: ${settings.general.officeHours}.`,
    `Applying and the skills test are free. Joining the recruitment database is free.`,
    `The optional career package costs ${fee}. It is paid on this website only, with a receipt. Never cash, never a WhatsApp transfer, never an agent.`,
    `The package does not change shortlist chances and does not guarantee an interview, a job or a visa.`,
    `A score above ${hiring.shortlistMinScore / 10} out of 10 qualifies for the shortlist.`,
    `A clear answer, yes or no, is aimed for within ${hiring.responseDays} days of a completed application.`,
    `The preliminary legal review is aimed for within ${hiring.legalReviewWithinDays} working days after the documents are in. It is a review of the documents provided. It is not a visa decision.`,
    `A full refund of the package is available within 14 days if the report and CV have not been downloaded.`,
  ].join(' ');
  return { title: 'Site settings', text };
}
