'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Integration } from '@/lib/integrations/catalog';

export type FieldStatus = { source: 'console' | 'environment' | 'missing'; hint: string; value: string };

const INPUT = 'w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[14px] outline-none focus:border-ink';

const SOURCE_LABEL = {
  console: 'Set here',
  environment: 'Set in hosting',
  missing: 'Not set',
} as const;

const ERRORS: Record<string, string> = {
  master_key_missing: 'INTEGRATIONS_MASTER_KEY is not set in the hosting environment, so nothing can be stored safely. Add it (32+ random characters) and redeploy.',
  invalid_option: 'One of the choices is not allowed.',
  forbidden: 'Only super admins can change integrations.',
};

/**
 * One service's settings. A secret field starts empty and is only sent when
 * something is typed into it, so saving never overwrites a key with blank and
 * a stored key is never sent back to the browser.
 */
export function IntegrationCard({ integration, status }: { integration: Integration; status: Record<string, FieldStatus> }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(integration.fields.map((f) => [f.name, f.secret ? '' : (status[f.name]?.value ?? '')])),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const required = integration.fields.some((f) => f.secret) ? integration.fields.filter((f) => f.secret) : integration.fields;
  const configured = required.every((f) => status[f.name]?.source !== 'missing');

  async function send(body: { values?: Record<string, string>; clear?: string[] }) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/integrations', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (response.ok) {
        setMessage('Saved. Live within a minute.');
        setValues((current) => Object.fromEntries(integration.fields.map((f) => [f.name, f.secret ? '' : (current[f.name] ?? '')])));
        router.refresh();
      } else {
        setMessage(ERRORS[data?.error ?? ''] ?? 'Could not save.');
      }
    } finally {
      setBusy(false);
    }
  }

  function save() {
    const changed = Object.fromEntries(
      integration.fields
        .filter((f) => (f.secret ? values[f.name]?.trim() : values[f.name] !== (status[f.name]?.value ?? '')))
        .map((f) => [f.name, values[f.name] ?? '']),
    );
    const cleared = integration.fields.filter((f) => !f.secret && status[f.name]?.source === 'console' && !values[f.name]?.trim()).map((f) => f.name);
    void send({ values: changed, clear: cleared });
  }

  return (
    <section className="rounded-[18px] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="m-0 text-[16px] font-semibold">{integration.name}</h3>
        <span className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] ${configured ? 'bg-success/15 text-success' : 'bg-surface-subtle text-muted'}`}>
          {configured ? 'Connected' : 'Not connected'}
        </span>
        {integration.docs && (
          <a href={integration.docs} target="_blank" rel="noreferrer" className="prose-link ms-auto text-[13px]">
            Provider docs
          </a>
        )}
      </div>
      <p className="m-0 mt-1 text-[13px] leading-[1.5] text-ink-2">{integration.description}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {integration.fields.map((field) => {
          const current = status[field.name];
          return (
            <label key={field.name} className="flex flex-col gap-1.5 text-[13px]">
              <span className="flex items-center gap-2 font-medium text-ink-2">
                {field.label}
                <span className="font-mono text-[11px] font-normal text-muted">
                  {SOURCE_LABEL[current?.source ?? 'missing']}
                  {field.secret && current?.hint ? ` · …${current.hint}` : ''}
                </span>
              </span>
              {field.options ? (
                <select className={INPUT} value={values[field.name] ?? ''} onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}>
                  <option value="">Not set</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  className={`${INPUT} font-mono`}
                  type={field.secret ? 'password' : 'text'}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={field.secret ? (current?.source === 'missing' ? 'Paste the key' : 'Leave blank to keep the current key') : (field.hint ?? '')}
                  value={values[field.name] ?? ''}
                  onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                />
              )}
              {field.hint && field.secret ? <span className="text-[12px] text-muted">{field.hint}</span> : null}
              {field.secret && current?.source === 'console' && (
                <button type="button" disabled={busy} onClick={() => confirm(`Remove the saved ${field.label.toLowerCase()}?`) && void send({ clear: [field.name] })} className="w-fit cursor-pointer border-0 bg-transparent p-0 text-[12px] text-accent-deep underline">
                  Remove saved key
                </button>
              )}
            </label>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="button" disabled={busy} onClick={save} className="cursor-pointer rounded-full border-0 bg-ink px-4 py-2 text-[14px] font-medium text-paper disabled:opacity-40">
          Save
        </button>
        {message && <span role="status" className="text-[13px] text-ink-2">{message}</span>}
      </div>
    </section>
  );
}
