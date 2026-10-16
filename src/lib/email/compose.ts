import { getSiteSettings } from '@/lib/cms/data';
import type { SiteSettings } from '@/lib/cms/settings';
import { renderEmail, type EmailBrand } from './template';
import { fillTemplate, paragraphsOf, type EmailId } from './templates';

export function emailBrand(settings: SiteSettings): EmailBrand {
  const socials = (
    [
      ['Instagram', settings.general.socials.instagram],
      ['Facebook', settings.general.socials.facebook],
      ['LinkedIn', settings.general.socials.linkedin],
      ['YouTube', settings.general.socials.youtube],
    ] as const
  )
    .filter(([, url]) => Boolean(url))
    .map(([label, url]) => ({ label, url }));

  return {
    name: settings.general.siteName,
    slogan: settings.general.tagline,
    legalName: settings.company.legalName,
    jurisdiction: settings.company.jurisdiction,
    supportEmail: settings.general.supportEmail,
    /* Prefer the registered address; fall back to the public office lines. */
    address: settings.company.registeredAddress || settings.general.officeAddress.split('\n')[0] || '',
    phone: settings.general.supportPhone || settings.company.phone,
    website: settings.company.website,
    socials,
  };
}

export type ComposedEmail = { subject: string; text: string; html: string };

/**
 * Builds one email from its template in Settings › Emails.
 *
 * `values` fill the message's placeholders; the site name and support
 * contacts are always available. `extra` paragraphs go after the template's
 * own, for lists the template cannot know, such as the jobs in an alert.
 */
export async function composeEmail(
  id: EmailId,
  values: Record<string, string>,
  options: {
    origin: string;
    actionUrl?: string;
    extra?: string[];
    fallbackNote?: string;
    closing?: string[];
    unsubscribe?: { label: string; url: string };
  },
): Promise<ComposedEmail> {
  const settings = await getSiteSettings();
  const template = settings.emails[id];
  const all = {
    site_name: settings.general.siteName,
    support_email: settings.general.supportEmail,
    support_phone: settings.general.supportPhone,
    ...values,
  };
  const subject = fillTemplate(template.subject, all).replace(/\s+/g, ' ').trim().slice(0, 200);
  const heading = fillTemplate(template.heading, all).trim();
  const paragraphs = [...paragraphsOf(fillTemplate(template.body, all)), ...(options.extra ?? [])];
  const label = fillTemplate(template.action, all).trim();
  const action = label && options.actionUrl ? { label, url: options.actionUrl } : undefined;

  const brand = emailBrand(settings);
  const text = [
    paragraphs.join('\n\n'),
    ...(action ? [`${action.label}: ${action.url}`] : []),
    ...(options.closing?.length ? [options.closing.join('\n')] : []),
    ...(options.unsubscribe ? [`${options.unsubscribe.label}: ${options.unsubscribe.url}`] : []),
    brand.name,
    brand.legalName,
    brand.address,
    brand.phone,
    brand.supportEmail,
    brand.website,
    ...brand.socials.map((social) => `${social.label}: ${social.url}`),
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    subject,
    text,
    html: renderEmail({
      preheader: paragraphs[1] ?? paragraphs[0] ?? heading,
      heading,
      paragraphs,
      action,
      fallbackNote: options.fallbackNote,
      closing: options.closing,
      unsubscribe: options.unsubscribe,
      origin: options.origin,
      brand,
    }),
  };
}
