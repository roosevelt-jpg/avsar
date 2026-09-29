'use client';

import { useRef, useState } from 'react';
import { Mono } from '@/components/ui/Mono';
import type { Dictionary } from '@/lib/i18n';

/**
 * CV upload.
 *
 * Deliberately not the only way in. Plenty of candidates in this corridor have
 * no CV file at all, so the manual form below it is a first-class path rather
 * than a fallback for people who fail at uploading.
 */
export function CvUpload({ t, alreadyUploaded }: { t: Dictionary; alreadyUploaded: boolean }) {
  const p = t.profile;
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>(
    alreadyUploaded ? 'done' : 'idle',
  );
  const [name, setName] = useState('');

  async function upload(file: File) {
    setState('busy');
    setName(file.name);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/cv/upload', { method: 'POST', body });
      setState(response.ok ? 'done' : 'error');
    } catch (error) {
      console.error('[cv-upload]', error);
      setState('error');
    }
  }

  return (
    <section className="rounded-[20px] border border-line bg-surface p-[clamp(20px,2.6cqi,28px)]">
      <h2 className="m-0 text-[19px] font-semibold">{p.cvTitle}</h2>
      <p className="mt-2 mb-5 max-w-[60ch] text-[15px] leading-[1.6] text-ink-2">{p.cvLead}</p>

      <input
        ref={input}
        type="file"
        accept=".pdf,.doc,.docx,.txt,application/pdf"
        className="sr-only-focusable"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={state === 'busy'}
          className="t-colors cursor-pointer rounded-[12px] border border-line-strong bg-surface px-4 py-2.5 text-[15px] hover:border-ink disabled:opacity-50"
        >
          {state === 'done' ? p.cvReplace : p.cvChoose}
        </button>

        <Mono className="text-muted">
          {state === 'busy'
            ? p.cvUploading
            : state === 'done'
              ? `${p.cvDone}${name ? ` · ${name}` : ''}`
              : state === 'error'
                ? p.cvError
                : p.cvHint}
        </Mono>
      </div>
    </section>
  );
}
