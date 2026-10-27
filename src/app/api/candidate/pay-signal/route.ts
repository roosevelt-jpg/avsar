import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionCandidate } from '@/lib/auth';
import { getSiteSettings } from '@/lib/cms/data';
import { formatProductFee, productFeeMinor, type PaidProduct } from '@/lib/company/config';
import { publicOrigin } from '@/lib/http/origin';
import { normalisePhone } from '@/lib/leads/phone';
import { emailStaff, notifyStaff } from '@/lib/notifications/staff';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { sendWhatsAppToNumber } from '@/lib/whatsapp';

export const runtime = 'nodejs';

const schema = z.object({
  kind: z.enum(['talk', 'family_send']),
  product: z.enum(['skills_report', 'visa_requirements', 'bundle']).optional(),
  phone: z.string().max(24).optional(),
  confirmed: z.boolean().optional(),
});

const HOURS = 12;

function plain(value: string): string {
  return value.replace(/[\u2066\u2069]/g, '');
}

/**
 * A candidate asked to talk, or asked us to send the family page to a number
 * they typed. The price is read from Settings. The other person is messaged
 * only after the candidate confirms they asked for the page.
 */
export async function POST(request: Request) {
  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'sign_in' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const settings = await getSiteSettings();
  const product = parsed.data.product ?? null;
  const amount = product ? productFeeMinor(settings.pricing, product) : null;
  const since = new Date(Date.now() - HOURS * 60 * 60 * 1000).toISOString();

  if (parsed.data.kind === 'talk') {
    const { count } = await admin
      .from('conversion_signals')
      .select('id', { count: 'exact', head: true })
      .eq('candidate_id', candidate.id)
      .eq('kind', 'talk')
      .gte('created_at', since);
    if ((count ?? 0) > 0) return NextResponse.json({ ok: true, already: true });

    const { error } = await admin.from('conversion_signals').insert({
      candidate_id: candidate.id,
      kind: 'talk',
      product,
      amount_paise: amount,
    });
    if (error) {
      console.error('[pay-signal] talk insert failed', error);
      return NextResponse.json({ error: 'not_saved' }, { status: 503 });
    }

    const looking = product ? `${label(product)} · ${plain(formatProductFee(settings.pricing, product))}` : 'a report';
    await notifyStaff({
      permission: 'leads.manage',
      kind: 'conversion.talk',
      title: `${candidate.fullName} asked to talk before paying`,
      body: looking,
      href: '/admin/dashboard',
    });
    await emailStaff({
      subject: `${candidate.fullName} asked to talk before paying`,
      line: `${candidate.fullName} (${candidate.email}) asked to talk before paying. They were looking at ${looking}.`,
      href: '/admin/dashboard',
      actionLabel: 'Open the morning list',
    });
    return NextResponse.json({ ok: true });
  }

  if (!parsed.data.confirmed) return NextResponse.json({ error: 'confirm' }, { status: 400 });
  const phone = normalisePhone(parsed.data.phone);
  if (!phone) return NextResponse.json({ error: 'phone' }, { status: 400 });

  const { count } = await admin
    .from('conversion_signals')
    .select('id', { count: 'exact', head: true })
    .eq('candidate_id', candidate.id)
    .eq('kind', 'family_send')
    .eq('payer_phone', phone)
    .gte('created_at', since);
  const priceLine = plain(
    `${formatProductFee(settings.pricing, 'skills_report')} for the skills report, ${formatProductFee(settings.pricing, 'visa_requirements')} for the visa-requirements list, ${formatProductFee(settings.pricing, 'bundle')} for both`,
  );
  const origin = await publicOrigin();
  const url = `${origin}/for-your-family`;
  const first = candidate.fullName.split(' ')[0] || candidate.fullName;
  const waUrl = `https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
    `Hello, ${first} asked me to send this page before anyone pays. Joining is free. The only charges are ${priceLine}, paid on the website. A job and a visa are not for sale. ${url}`,
  )}`;

  if ((count ?? 0) > 0) return NextResponse.json({ ok: true, already: true, sent: false, waUrl });

  const { data: row, error } = await admin
    .from('conversion_signals')
    .insert({
      candidate_id: candidate.id,
      kind: 'family_send',
      product,
      amount_paise: amount,
      payer_phone: phone,
      sent: false,
    })
    .select('id')
    .single();
  if (error || !row) {
    console.error('[pay-signal] family insert failed', error);
    return NextResponse.json({ error: 'not_saved', waUrl }, { status: 503 });
  }

  const result = await sendWhatsAppToNumber({
    to: phone,
    template: 'family_page',
    params: [first, priceLine, url],
    candidateId: candidate.id,
  });
  if (result.sent) {
    await admin.from('conversion_signals').update({ sent: true }).eq('id', row.id);
  }

  await notifyStaff({
    permission: 'leads.manage',
    kind: 'conversion.family',
    title: `${candidate.fullName} sent the family page`,
    body: result.sent ? `Sent to ${phone}.` : `WhatsApp did not send to ${phone}. They can send the link themselves.`,
    href: '/admin/dashboard',
  });

  return NextResponse.json({ ok: true, sent: result.sent, waUrl });
}

function label(product: PaidProduct): string {
  if (product === 'skills_report') return 'skills report';
  if (product === 'visa_requirements') return 'visa-requirements list';
  return 'both reports';
}
