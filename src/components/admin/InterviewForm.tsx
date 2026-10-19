'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { INTERVIEW_MODE_LABELS, interviewTimes, zonedLocalToUtc, type InterviewMode, type InterviewZone } from '@/lib/interviews/time';

const INPUT = 'w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[14px] outline-none focus:border-ink';

/**
 * Book an interview. The recruiter types the time in whichever zone they think
 * in; the preview underneath shows what the candidate will read, in India time
 * and Lisbon time, before anything is sent.
 */
export function InterviewForm({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [localTime, setLocalTime] = useState('');
  const [timezone, setTimezone] = useState<InterviewZone>('Asia/Kolkata');
  const [mode, setMode] = useState<InterviewMode>('video');
  const [duration, setDuration] = useState(30);
  const [link, setLink] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const instant = localTime ? zonedLocalToUtc(localTime, timezone) : null;
  const preview = instant ? interviewTimes(instant).both : null;

  async function submit() {
    setBusy(true);
    setStatus(null);
    const response = await fetch(`/api/admin/applications/${applicationId}/interviews`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        localTime,
        timezone,
        durationMinutes: duration,
        mode,
        link: link.trim(),
        location: location.trim() || undefined,
        candidateMessage: message.trim() || undefined,
        notify,
      }),
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    setBusy(false);
    if (response.ok) {
      setStatus('Interview booked.');
      setLocalTime('');
      setMessage('');
      router.refresh();
      return;
    }
    const messages: Record<string, string> = {
      not_configured: 'The database is not connected, so nothing was saved.',
      in_the_past: 'That time has already passed.',
      invalid_payload: 'Check the time, and that the link starts with https://.',
      forbidden: 'Your role cannot book interviews.',
    };
    setStatus(messages[data?.error ?? ''] ?? 'Could not book the interview.');
  }

  return (
    <section className="rounded-[16px] border border-line bg-surface p-4">
      <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Book an interview</p>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <input type="datetime-local" aria-label="Date and time" className={INPUT} value={localTime} onChange={(e) => setLocalTime(e.target.value)} />
        <select aria-label="Time zone" className={INPUT} value={timezone} onChange={(e) => setTimezone(e.target.value as InterviewZone)}>
          <option value="Asia/Kolkata">India</option>
          <option value="Europe/Lisbon">Lisbon</option>
        </select>
      </div>
      {preview && <p className="m-0 mt-2 text-[13px] text-ink-2">Candidate sees: {preview}</p>}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <select aria-label="Mode" className={INPUT} value={mode} onChange={(e) => setMode(e.target.value as InterviewMode)}>
          {(Object.keys(INTERVIEW_MODE_LABELS) as InterviewMode[]).map((value) => (
            <option key={value} value={value}>{INTERVIEW_MODE_LABELS[value]}</option>
          ))}
        </select>
        <select aria-label="Duration" className={INPUT} value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
          {[15, 30, 45, 60, 90].map((minutes) => (
            <option key={minutes} value={minutes}>{minutes} min</option>
          ))}
        </select>
      </div>
      {mode === 'video' && <input className={`${INPUT} mt-2`} placeholder="Meeting link (https://…)" value={link} onChange={(e) => setLink(e.target.value)} />}
      {mode === 'in_person' && <input className={`${INPUT} mt-2`} placeholder="Address" value={location} onChange={(e) => setLocation(e.target.value)} />}
      <textarea className={`${INPUT} mt-2`} rows={2} placeholder="Message to the candidate (optional)" value={message} onChange={(e) => setMessage(e.target.value)} />
      <label className="mt-2 flex items-center gap-2 text-[13px]">
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Email the candidate (and WhatsApp, if they opted in)
      </label>
      <button
        type="button"
        disabled={busy || !instant}
        onClick={submit}
        className="mt-3 w-full cursor-pointer rounded-full border-0 bg-ink px-4 py-2.5 text-[14px] font-medium text-paper disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? 'Booking…' : 'Book interview'}
      </button>
      {status && <p className="m-0 mt-2 text-[13px] text-ink-2">{status}</p>}
    </section>
  );
}
