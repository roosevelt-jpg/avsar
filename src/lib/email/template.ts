import { BRAND, ENTITY } from '@/lib/data/brand';

/**
 * The shell every transactional message is poured into.
 *
 * Written the way email has to be written rather than the way the site is:
 * tables for layout, every style inline, nothing that depends on a stylesheet
 * surviving Gmail. What looks like a step backwards is the only thing that
 * renders the same in Gmail, Apple Mail and Outlook.
 *
 * Two deliberate restrictions:
 *
 *  - No web font. Clients strip the link or ignore the face, and a message
 *    that falls back unevenly looks worse than one that never tried. The site's
 *    typography does not travel; its colour and its spacing do.
 *  - One image, the mark, and the message reads completely without it. Images
 *    are blocked by default in a lot of inboxes, so the name is live text
 *    beside it rather than part of the picture.
 */

const INK = '#1B1A17';
const PAPER = '#F7F5F0';
const SURFACE = '#FFFFFF';
const TERRACOTTA = '#B9583A';
const MUTED = '#6E6A61';
const LINE = '#E3DFD6';

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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
  /** Absolute, because an email has no origin of its own. */
  origin: string;
};

export function renderEmail(layout: EmailLayout): string {
  const { preheader, heading, paragraphs, action, fallbackNote, closing, origin } = layout;

  const body = paragraphs
    .map(
      (text) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${INK};">${escape(text)}</p>`,
    )
    .join('');

  /* A button made of a table, because a padded anchor collapses in Outlook. */
  const button = action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
<tr><td align="center" bgcolor="${TERRACOTTA}" style="border-radius:12px;">
<a href="${escape(action.url)}" style="display:inline-block;padding:15px 30px;font-family:${FONT};font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:12px;">${escape(action.label)}</a>
</td></tr></table>`
    : '';

  /* The same link again as text. Some clients will not open a styled button,
     and some readers will not press one they cannot see the destination of. */
  const fallback =
    action && fallbackNote
      ? `<p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:${MUTED};">${escape(fallbackNote)}</p>
<p style="margin:6px 0 0;font-size:13px;line-height:1.5;word-break:break-all;"><a href="${escape(action.url)}" style="color:${TERRACOTTA};">${escape(action.url)}</a></p>`
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

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escape(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:${PAPER};">
<div style="display:none;font-size:1px;color:${PAPER};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escape(preheader)}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${PAPER};">
<tr><td align="center" style="padding:28px 16px 40px;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;font-family:${FONT};">

<tr><td bgcolor="${INK}" style="background-color:${INK};border-radius:20px 20px 0 0;padding:26px 32px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="padding-right:12px;vertical-align:middle;"><img src="${origin}/brand/email-mark.png" width="63" height="36" alt="" style="display:block;border:0;"></td>
<td style="vertical-align:middle;font-family:${FONT};font-size:20px;font-weight:600;color:${PAPER};letter-spacing:-0.02em;">${escape(BRAND.name)}</td>
</tr></table>
</td></tr>

<tr><td bgcolor="${SURFACE}" style="background-color:${SURFACE};padding:36px 32px 32px;border-left:1px solid ${LINE};border-right:1px solid ${LINE};">
<h1 style="margin:0 0 18px;font-size:25px;line-height:1.25;font-weight:600;color:${INK};letter-spacing:-0.02em;">${escape(heading)}</h1>
${body}${button}${fallback}${tail}
</td></tr>

<tr><td bgcolor="${SURFACE}" style="background-color:${SURFACE};padding:0 32px 28px;border-left:1px solid ${LINE};border-right:1px solid ${LINE};border-bottom:1px solid ${LINE};border-radius:0 0 20px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${LINE};">
<tr><td style="padding-top:20px;font-size:12px;line-height:1.6;color:${MUTED};">
<strong style="color:${INK};font-weight:600;">${escape(BRAND.name)}</strong> &middot; ${escape(BRAND.slogan)}<br>
${escape(ENTITY.legalName)}, ${escape(ENTITY.jurisdiction)}<br>
<a href="mailto:${escape(ENTITY.supportEmail)}" style="color:${MUTED};">${escape(ENTITY.supportEmail)}</a>
</td></tr></table>
</td></tr>

</table>
</td></tr></table>
</body>
</html>`;
}
