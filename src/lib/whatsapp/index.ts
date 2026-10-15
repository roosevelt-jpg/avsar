import { getAdminSupabase } from '@/lib/supabase/admin';

/**
 * WhatsApp Business (Cloud API) template messages.
 *
 * Candidates in India read WhatsApp long before they read email, so stage
 * changes and interview times go there too, but only to candidates who ticked
 * the opt-in on the apply form. Meta only delivers pre-approved templates
 * outside a 24-hour reply window, so every message here is a named template
 * whose body has numbered parameters. The names below must match templates
 * approved in WhatsApp Manager, in English.
 *
 * Same pattern as the mailer: without credentials nothing is sent and nothing
 * fails. Never throws; a WhatsApp failure must not undo the status change it
 * reports.
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
} as const;

export type WhatsAppTemplate = keyof typeof WHATSAPP_TEMPLATES;

const GRAPH_VERSION = 'v21.0';

function config(): { token: string; phoneNumberId: string } | null {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return token && phoneNumberId ? { token, phoneNumberId } : null;
}

export function isWhatsAppConfigured(): boolean {
  return config() !== null;
}

/** Template parameters are plain text with limits; newlines and long runs of spaces are rejected by Meta. */
function clean(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 300);
}

export async function sendWhatsApp(input: {
  candidateId: string;
  applicationId?: string | null;
  template: WhatsAppTemplate;
  params: string[];
}): Promise<void> {
  const settings = config();
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
export async function sendWhatsAppToNumber(input: { to: string; template: WhatsAppTemplate; params: string[] }): Promise<{ sent: boolean }> {
  const settings = config();
  const admin = getAdminSupabase();
  if (!settings || !admin || !/^\+[1-9]\d{6,14}$/.test(input.to)) return { sent: false };
  try {
    return await deliver(settings, admin, { ...input, candidateId: null, applicationId: null });
  } catch (error) {
    console.error('[whatsapp] send failed', input.template, error);
    return { sent: false };
  }
}

async function deliver(
  settings: { token: string; phoneNumberId: string },
  admin: NonNullable<ReturnType<typeof getAdminSupabase>>,
  input: { to: string; template: WhatsAppTemplate; params: string[]; candidateId: string | null; applicationId: string | null },
): Promise<{ sent: boolean }> {
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
