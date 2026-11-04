/**
 * The shell every transactional message is poured into.
 *
 * Written the way email has to be written rather than the way the site is:
 * tables for layout, every style inline, nothing that depends on a stylesheet
 * surviving Gmail. Brand colours match the mockup Master Spec (navy + gold).
 */

const NAVY = '#142438';
const GOLD = '#b28a49';
const PAPER = '#F7F4EE';
const SURFACE = '#FFFFFF';
const INK = '#142438';
const MUTED = '#5C7084';
const LINE = '#D9E0E8';

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type EmailSocial = { label: string; url: string };

export type EmailLayout = {
  /** The line the inbox shows beside the subject. */
  preheader: string;
  heading: string;
  /** Already-escaped-on-the-way-in plain strings, one per paragraph. */
  paragraphs: string[];
  action?: { label: string; url: string };
  /** Under the button, for the client that will not open it. */
  fallbackNote?: string;
  /** Quiet lines above the legal footer. */
  closing?: string[];
  /** In the footer, where a reader looking for the way out looks for it. */
  unsubscribe?: { label: string; url: string };
  /** Absolute, because an email has no origin of its own. */
  origin: string;
  /** Name and footer lines, from Settings. See `emailBrand` in compose.ts. */
  brand: EmailBrand;
};

export type EmailBrand = {
  name: string;
  slogan: string;
  legalName: string;
  jurisdiction: string;
  supportEmail: string;
  /** Registered / office address for the footer. */
  address: string;
  phone: string;
  website: string;
  socials: EmailSocial[];
};

export function renderEmail(layout: EmailLayout): string {
  const { preheader, heading, paragraphs, action, fallbackNote, closing, unsubscribe, origin, brand } =
    layout;

  const body = paragraphs
    .map(
      (text) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${INK};">${escape(text)}</p>`,
    )
    .join('');

  /* A button made of a table, because a padded anchor collapses in Outlook. */
  const button = action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
<tr><td align="center" bgcolor="${GOLD}" style="border-radius:8px;">
<a href="${escape(action.url)}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;font-weight:600;color:${NAVY};text-decoration:none;border-radius:8px;">${escape(action.label)} →</a>
</td></tr></table>`
    : '';

  const fallback =
    action && fallbackNote
      ? `<p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:${MUTED};">${escape(fallbackNote)}</p>
<p style="margin:6px 0 0;font-size:13px;line-height:1.5;word-break:break-all;"><a href="${escape(action.url)}" style="color:${GOLD};">${escape(action.url)}</a></p>`
      : '';

  const tail = closing?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;border-top:1px solid ${LINE};">
<tr><td style="padding-top:20px;">${closing
        .map(
          (text) =>
            `<p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:${MUTED};">${escape(text)}</p>`,
        )
        .join('')}</td></tr></table>`
    : '';

  const socialLinks = brand.socials
    .map(
      (social) =>
        `<a href="${escape(social.url)}" style="color:${MUTED};text-decoration:underline;margin-right:12px;">${escape(social.label)}</a>`,
    )
    .join('');

  const addressBlock = [
    brand.address ? escape(brand.address).replace(/\n/g, '<br>') : '',
    brand.phone
      ? `<a href="tel:${escape(brand.phone.replace(/\s/g, ''))}" style="color:${MUTED};" dir="ltr">${escape(brand.phone)}</a>`
      : '',
    brand.website
      ? `<a href="${escape(brand.website)}" style="color:${MUTED};">${escape(brand.website.replace(/^https?:\/\//, ''))}</a>`
      : '',
  ]
    .filter(Boolean)
    .join('<br>');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escape(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:${PAPER};width:100%;-webkit-text-size-adjust:100%;">
<div style="display:none;font-size:1px;color:${PAPER};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escape(preheader)}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${PAPER};width:100%;">
<tr><td align="center" style="padding:28px 12px 40px;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;font-family:${FONT};">

<tr><td bgcolor="${NAVY}" style="background-color:${NAVY};border-radius:12px 12px 0 0;padding:22px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="vertical-align:middle;">
<img src="${escape(origin)}/brand/email-mark.png" width="210" height="40" alt="${escape(brand.name)}" style="display:block;border:0;width:210px;height:40px;max-width:100%;">
</td>
</tr></table>
</td></tr>

<tr><td bgcolor="${SURFACE}" style="background-color:${SURFACE};padding:28px 24px 28px;border-left:1px solid ${LINE};border-right:1px solid ${LINE};">
<h1 style="margin:0 0 18px;font-size:22px;line-height:1.25;font-weight:600;color:${INK};letter-spacing:-0.02em;">${escape(heading)}</h1>
${body}${button}${fallback}${tail}
</td></tr>

<tr><td bgcolor="${SURFACE}" style="background-color:${SURFACE};padding:0 24px 28px;border-left:1px solid ${LINE};border-right:1px solid ${LINE};border-bottom:1px solid ${LINE};border-radius:0 0 12px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${LINE};">
<tr><td style="padding-top:20px;font-size:12px;line-height:1.65;color:${MUTED};">
<strong style="color:${INK};font-weight:600;">${escape(brand.name)}</strong>${brand.slogan ? ` &middot; ${escape(brand.slogan)}` : ''}<br>
${escape(brand.legalName)}${brand.jurisdiction ? `, ${escape(brand.jurisdiction)}` : ''}<br>
${addressBlock ? `${addressBlock}<br>` : ''}
<a href="mailto:${escape(brand.supportEmail)}" style="color:${MUTED};">${escape(brand.supportEmail)}</a>
${socialLinks ? `<br><br>${socialLinks}` : ''}
${
  unsubscribe
    ? `<br><br><a href="${escape(unsubscribe.url)}" style="color:${MUTED};">${escape(unsubscribe.label)}</a>`
    : ''
}
</td></tr></table>
</td></tr>

</table>
</td></tr></table>
</body>
</html>`;
}
