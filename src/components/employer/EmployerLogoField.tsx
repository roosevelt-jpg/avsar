'use client';

import { useRouter } from 'next/navigation';
import { useState, type ChangeEvent } from 'react';

/** Replaces the logo shown for this employer on the homepage strip. */
export function EmployerLogoField({ employerId, hasLogo }: { employerId: string; hasLogo: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);

  async function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setMessage('');
    setFailed(false);
    const body = new FormData();
    body.set('file', file);
    const response = await fetch(`/api/admin/employers/${employerId}/logo`, { method: 'POST', body });
    if (!response.ok) {
      setFailed(true);
      setMessage('Could not save the logo. Use a JPEG, PNG or WebP under 2 MB.');
      return;
    }
    setMessage('Logo saved. It is on the homepage.');
    router.refresh();
  }

  return (
    <label className="inline-flex cursor-pointer flex-col gap-1 text-[14px]">
      <span className="font-medium text-ink underline decoration-line-strong underline-offset-4">{hasLogo ? 'Replace logo' : 'Add logo'}</span>
      <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void onChange(event)} />
      {message ? <span className={failed ? 'text-accent-deep' : 'font-normal text-ink-2 no-underline'}>{message}</span> : null}
    </label>
  );
}
