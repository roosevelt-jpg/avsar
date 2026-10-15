'use client';

import { useState } from 'react';
import {
  COMMON_PLACEHOLDERS,
  DEFAULT_EMAILS,
  EMAIL_META,
  fillTemplate,
  paragraphsOf,
  type EmailId,
  type EmailSettings,
} from '@/lib/email/templates';
import { CARD, Field, INPUT, SaveBar, useSettingsSaver } from './ui';

/** Example values, so the preview reads like a real message. */
const EXAMPLE: Record<string, string> = {
  first_name: 'Priya',
  job_title: 'Cook, Lisbon',
  reference: 'APP-2F81',
  status_title: 'Shortlisted',
  status_body: 'You have been shortlisted. A recruiter will contact you to arrange an interview.',
  recruiter_note: '',
  when: 'Tuesday 21 October, 11:00 India time',
  how: 'Zoom video call',
  role: 'Cook',
  count: '3',
  document: 'passport',
  reason: 'The photo page is cut off at the bottom.',
  message: 'Thank you for your message. The cook vacancies in Lisbon are open until 30 November.',
  vacancies: 'Cook, Lisbon (2); Kitchen assistant, Porto (1)',
  line: 'New application: Cook, Lisbon',
};

/**
 * Settings › Emails. Plain text with placeholders, never HTML: the layout and
 * footer are fixed, so an edit here cannot break how a message renders.
 */
export function EmailsForm({ initial, common }: { initial: EmailSettings; common: Record<string, string> }) {
  const [emails, setEmails] = useState(initial);
  const [selected, setSelected] = useState<EmailId>(EMAIL_META[0]!.id);
  const saver = useSettingsSaver('emails');
  const meta = EMAIL_META.find((item) => item.id === selected)!;
  const template = emails[selected];
  const values = { ...common, ...EXAMPLE };
  const update = (patch: Partial<typeof template>) => setEmails({ ...emails, [selected]: { ...template, ...patch } });

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <nav aria-label="Emails" className={`${CARD} h-fit p-2`}>
        {(['Candidates', 'Leads', 'Employers', 'Staff'] as const).map((audience) => (
          <div key={audience} className="mb-2">
            <p className="m-0 px-3 pt-2 pb-1 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{audience}</p>
            <ul className="m-0 list-none p-0">
              {EMAIL_META.filter((item) => item.audience === audience).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(item.id)}
                    aria-current={item.id === selected ? 'true' : undefined}
                    className={`w-full cursor-pointer rounded-[10px] border-0 px-3 py-2 text-start text-[14px] ${item.id === selected ? 'bg-ink text-paper' : 'bg-transparent text-ink hover:bg-paper'}`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className={CARD}>
          <h2 className="m-0 text-[17px] font-semibold">{meta.label}</h2>
          <p className="m-0 mt-1 text-[13px] leading-[1.5] text-muted">{meta.description}</p>
          <div className="mt-4 flex flex-col gap-3">
            <Field label="Subject"><input className={INPUT} value={template.subject} onChange={(e) => update({ subject: e.target.value })} /></Field>
            <Field label="Heading"><input className={INPUT} value={template.heading} onChange={(e) => update({ heading: e.target.value })} /></Field>
            <Field label="Text" help="Plain text. Leave a blank line between paragraphs. A paragraph whose placeholders are all empty is left out.">
              <textarea className={`${INPUT} font-mono text-[13px]`} rows={10} value={template.body} onChange={(e) => update({ body: e.target.value })} />
            </Field>
            <Field label="Button text" help="Leave empty for no button."><input className={INPUT} value={template.action} onChange={(e) => update({ action: e.target.value })} /></Field>
          </div>
          <p className="m-0 mt-4 text-[12px] leading-[1.6] text-muted">
            Placeholders:{' '}
            {[...meta.placeholders, ...COMMON_PLACEHOLDERS].map((name) => (
              <code key={name} className="me-1 rounded bg-paper px-1 font-mono">{`{{${name}}}`}</code>
            ))}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <SaveBar onSave={() => saver.save(emails)} state={saver.state} busy={saver.busy} />
            <button type="button" onClick={() => setEmails({ ...emails, [selected]: DEFAULT_EMAILS[selected] })} className="mt-5 cursor-pointer border-0 bg-transparent p-0 text-[13px] text-ink-2 underline">
              Restore the original text
            </button>
          </div>
        </section>

        <section className={`${CARD} bg-paper`} aria-label="Preview">
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Preview, with example values</p>
          <p className="m-0 mt-3 text-[13px] text-ink-2">
            <span className="text-muted">Subject:</span> {fillTemplate(template.subject, values)}
          </p>
          <div className="mt-3 rounded-[14px] border border-line bg-surface p-5">
            <h3 className="m-0 text-[20px] font-semibold">{fillTemplate(template.heading, values)}</h3>
            {paragraphsOf(fillTemplate(template.body, values)).map((paragraph, index) => (
              <p key={index} className="m-0 mt-3 whitespace-pre-line text-[15px] leading-[1.6]">{paragraph}</p>
            ))}
            {template.action ? (
              <span className="mt-5 inline-block rounded-[10px] bg-night px-5 py-2.5 text-[14px] font-semibold text-on-night">{fillTemplate(template.action, values)}</span>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
