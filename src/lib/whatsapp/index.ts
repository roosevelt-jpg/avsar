import { getAdminSupabase } from '@/lib/supabase/admin';
import { refreshIntegrations } from '@/lib/integrations/runtime';

/**
 * WhatsApp outbound messages.
 *
 * Two providers:
 *  - Meta Cloud API (default): approved templates only outside the 24h window
 *  - Green API (`WHATSAPP_PROVIDER=green`): plain text via GreenAPI instance
 *
 * Candidates in India read WhatsApp long before email. Opt-in is still required
 * for candidate sends. Never throws: a WhatsApp failure must not undo the
 * status change it reports.
 */

export const WHATSAPP_TEMPLATES = {
  /** {{1}} first name, {{2}} job title, {{3}} reference */
  application_received: 3,
  /** {{1}} first name, {{2}} job title, {{3}} what the new stage means */
  application_update: 3,
  /** {{1}} first name, {{2}} job title, {{3}} time in IST and Lisbon */
  interview_scheduled: 3,
  /** {{1}} first name, {{2}} one line from the recruiter. Sent only to people who
      wrote to us and ticked "WhatsApp is fine" (or whose import says so). */
  lead_follow_up: 2,
  /** {{1}} first name, {{2}} score out of 10, {{3}} shortlist line (e.g. "above 7.0" or "below") */
  score_ready: 3,
  /** {{1}} first name, {{2}} package price */
  package_offer: 2,
  /** {{1}} first name, {{2}} amount and what was bought, {{3}} receipt number */
  payment_received: 3,
  /** {{1}} first name */
  legal_review_ready: 1,
  /** {{1}} first name, {{2}} package price. One message, the day after checkout was opened and not paid. */
  checkout_abandoned: 2,
  /** {{1}} candidate first name, {{2}} the three live prices, {{3}} family page URL.
      Sent only after the candidate confirms the other person asked for the page. */
  family_page: 3,
} as const;

export type WhatsAppTemplate = keyof typeof WHATSAPP_TEMPLATES;

const GRAPH_VERSION = 'v21.0';

type MetaConfig = { kind: 'meta'; token: string; phoneNumberId: string };
type GreenConfig = { kind: 'green'; apiUrl: string; instanceId: string; apiToken: string };
type ProviderConfig = MetaConfig | GreenConfig;

function provider(): ProviderConfig | null {
  const mode = (process.env.WHATSAPP_PROVIDER ?? 'meta').trim().toLowerCase();
  if (mode === 'green') {
    const apiUrl = process.env.GREEN_API_URL?.trim().replace(/\/$/, '');
    const instanceId = process.env.GREEN_INSTANCE_ID?.trim();
    const apiToken = process.env.GREEN_API_TOKEN?.trim();
    return apiUrl && instanceId && apiToken ? { kind: 'green', apiUrl, instanceId, apiToken } : null;
  }
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  return token && phoneNumberId ? { kind: 'meta', token, phoneNumberId } : null;
}

export function isWhatsAppConfigured(): boolean {
  return provider() !== null;
}

/** Template parameters are plain text with limits; newlines and long runs of spaces are rejected by Meta. */
function clean(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 300);
}

/** Green API accepts free-form text, so templates become a short readable line. */
function templateAsText(template: WhatsAppTemplate, params: string[]): string {
  const p = params.map(clean);
  switch (template) {
    case 'application_received':
      return `Hi ${p[0] ?? ''}, we received your application for ${p[1] ?? ''} (ref ${p[2] ?? ''}). — S&A Recruitment`;
    case 'application_update':
      return `Hi ${p[0] ?? ''}, update on ${p[1] ?? ''}: ${p[2] ?? ''}. — S&A Recruitment`;
    case 'interview_scheduled':
      return `Hi ${p[0] ?? ''}, interview for ${p[1] ?? ''}: ${p[2] ?? ''}. — S&A Recruitment`;
    case 'lead_follow_up':
      return `Hi ${p[0] ?? ''}, ${p[1] ?? ''}. — S&A Recruitment`;
    case 'score_ready':
      return `Hi ${p[0] ?? ''}, your skills score is ${p[1] ?? ''}/10 (${p[2] ?? ''}). — S&A Recruitment`;
    case 'package_offer':
      return `Hi ${p[0] ?? ''}, the career package is ${p[1] ?? ''}. — S&A Recruitment`;
    case 'payment_received':
      return `Hi ${p[0] ?? ''}, payment received: ${p[1] ?? ''} (receipt ${p[2] ?? ''}). — S&A Recruitment`;
    case 'legal_review_ready':
      return `Hi ${p[0] ?? ''}, your preliminary legal review is ready in your dashboard. — S&A Recruitment`;
    case 'checkout_abandoned':
      return `Hi ${p[0] ?? ''}, you left checkout open for the ${p[1] ?? ''} package. Finish anytime from your dashboard. — S&A Recruitment`;
    case 'family_page':
      return `Hi ${p[0] ?? ''}, share this progress page with your family: ${p[2] ?? ''} (prices: ${p[1] ?? ''}). — S&A Recruitment`;
    default:
      return p.filter(Boolean).join(' · ');
  }
}

function greenChatId(to: string): string {
  const digits = to.replace(/[^\d]/g, '');
  return `${digits}@c.us`;
}

export async function sendWhatsApp(input: {
  candidateId: string;
  applicationId?: string | null;
  template: WhatsAppTemplate;
  params: string[];
}): Promise<void> {
  await refreshIntegrations();
  const settings = provider();
  if (!settings) return;
  const admin = getAdminSupabase();
  if (!admin) return;

  try {
    const { data: candidate } = await admin
      .from('candidates')
      .select('phone, whatsapp_opt_in_at')
      .eq('id', input.candidateId)
      .maybeSingle();

    /* Not opted in is the normal case, not an event worth logging. */
    if (!candidate?.whatsapp_opt_in_at || !candidate.phone) return;

    await deliver(settings, admin, {
      to: String(candidate.phone),
      template: input.template,
      params: input.params,
      candidateId: input.candidateId,
      applicationId: input.applicationId ?? null,
    });
  } catch (error) {
    console.error('[whatsapp] send failed', input.template, error);
  }
}

/**
 * To a number rather than a candidate: someone in the inbox who has not
 * registered. The caller is responsible for consent (the lead's own
 * "WhatsApp is fine" tick); this only refuses a number that is not E.164.
 */
export async function sendWhatsAppToNumber(input: {
  to: string;
  template: WhatsAppTemplate;
  params: string[];
  candidateId?: string | null;
}): Promise<{ sent: boolean }> {
  await refreshIntegrations();
  const settings = provider();
  const admin = getAdminSupabase();
  if (!settings || !admin || !/^\+[1-9]\d{6,14}$/.test(input.to)) return { sent: false };
  try {
    return await deliver(settings, admin, { ...input, candidateId: input.candidateId ?? null, applicationId: null });
  } catch (error) {
    console.error('[whatsapp] send failed', input.template, error);
    return { sent: false };
  }
}

async function deliver(
  settings: ProviderConfig,
  admin: NonNullable<ReturnType<typeof getAdminSupabase>>,
  input: { to: string; template: WhatsAppTemplate; params: string[]; candidateId: string | null; applicationId: string | null },
): Promise<{ sent: boolean }> {
  if (settings.kind === 'green') {
    return deliverGreen(settings, admin, {
      to: input.to,
      body: templateAsText(input.template, input.params),
      template: input.template,
      candidateId: input.candidateId,
      applicationId: input.applicationId,
    });
  }

  const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${settings.phoneNumberId}/messages`, {
    method: 'POST',
    headers: { authorization: `Bearer ${settings.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: input.to.replace(/[^\d]/g, ''),
      type: 'template',
      template: {
        name: input.template,
        language: { code: 'en' },
        components: [{ type: 'body', parameters: input.params.map((text) => ({ type: 'text', text: clean(text) })) }],
      },
    }),
    cache: 'no-store',
  });

  const data = (await response.json().catch(() => null)) as
    | { messages?: { id?: string }[]; error?: { message?: string; code?: number } }
    | null;

  await admin.from('notification_log').insert({
    channel: 'whatsapp',
    template: input.template,
    candidate_id: input.candidateId,
    application_id: input.applicationId,
    status: response.ok ? 'sent' : 'failed',
    provider_id: data?.messages?.[0]?.id ?? null,
    error: response.ok ? null : `${response.status} ${data?.error?.code ?? ''} ${data?.error?.message ?? ''}`.trim().slice(0, 500),
  });
  return { sent: response.ok };
}

async function deliverGreen(
  settings: GreenConfig,
  admin: NonNullable<ReturnType<typeof getAdminSupabase>>,
  input: {
    to: string;
    body: string;
    template: string;
    candidateId: string | null;
    applicationId: string | null;
  },
): Promise<{ sent: boolean }> {
  const url = `${settings.apiUrl}/waInstance${settings.instanceId}/sendMessage/${settings.apiToken}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chatId: greenChatId(input.to), message: input.body.slice(0, 4000) }),
    cache: 'no-store',
  });
  const data = (await response.json().catch(() => null)) as { idMessage?: string; message?: string } | null;
  await admin.from('notification_log').insert({
    channel: 'whatsapp',
    template: input.template,
    candidate_id: input.candidateId,
    application_id: input.applicationId,
    status: response.ok ? 'sent' : 'failed',
    provider_id: data?.idMessage ?? null,
    error: response.ok ? null : `${response.status} ${data?.message ?? ''}`.trim().slice(0, 500),
  });
  return { sent: response.ok };
}

/** A reply inside the 24-hour window, in ordinary text rather than a template. */
export async function sendWhatsAppText(to: string, body: string): Promise<boolean> {
  await refreshIntegrations();
  const settings = provider();
  const admin = getAdminSupabase();
  if (!settings || !admin) return false;
  const digits = to.replace(/[^\d]/g, '');
  if (digits.length < 8) return false;
  try {
    if (settings.kind === 'green') {
      const result = await deliverGreen(settings, admin, {
        to: `+${digits}`,
        body,
        template: 'assistant_reply',
        candidateId: null,
        applicationId: null,
      });
      return result.sent;
    }

    const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${settings.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { authorization: `Bearer ${settings.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: digits,
        type: 'text',
        text: { body: body.slice(0, 4000), preview_url: false },
      }),
      cache: 'no-store',
    });
    const data = (await response.json().catch(() => null)) as { messages?: { id?: string }[]; error?: { message?: string; code?: number } } | null;
    await admin.from('notification_log').insert({
      channel: 'whatsapp',
      template: 'assistant_reply',
      candidate_id: null,
      application_id: null,
      status: response.ok ? 'sent' : 'failed',
      provider_id: data?.messages?.[0]?.id ?? null,
      error: response.ok ? null : `${response.status} ${data?.error?.message ?? ''}`.trim().slice(0, 500),
    });
    return response.ok;
  } catch (error) {
    console.error('[whatsapp] text reply failed', error);
    return false;
  }
}
