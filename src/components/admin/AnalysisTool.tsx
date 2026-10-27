'use client';

import { useState } from 'react';

type ConversionFacts = {
  since: string;
  newAccounts: number;
  profilesComplete: number;
  finishedTests: number;
  applications: number;
  interviews: number;
  openJobs: number;
  awaitingPayment: number;
  familyLinks: number;
  employerVacancies: number;
  employerApplicants: number;
  assessedPool: number;
  talk: number;
  familySent: number;
  familyFailed: number;
  checkoutsOpen: number;
  paid: number;
};

type Briefing = {
  summary: string;
  calls: string[];
  watch: string[];
  source: 'model' | 'counts';
};

/**
 * The week's counts are on the page before anyone presses the button.
 * The button asks for a short briefing. If the model is off, the same
 * counts come back as plain sentences.
 */
export function AnalysisTool({ facts }: { facts: ConversionFacts }) {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function write() {
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch('/api/admin/analysis', { method: 'POST' });
      if (!response.ok) {
        setFailed(true);
        return;
      }
      const data = (await response.json()) as { briefing?: Briefing };
      setBriefing(data.briefing ?? null);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const groups: { title: string; note: string; rows: { label: string; value: number }[] }[] = [
    {
      title: 'Applicant dashboard',
      note: 'What candidates see after they sign in',
      rows: [
        { label: 'New accounts', value: facts.newAccounts },
        { label: 'Profiles finished', value: facts.profilesComplete },
        { label: 'Scores written', value: facts.finishedTests },
        { label: 'Applications', value: facts.applications },
        { label: 'Interviews booked', value: facts.interviews },
        { label: 'Open jobs', value: facts.openJobs },
        { label: 'Score in, both reports unpaid', value: facts.awaitingPayment },
        { label: 'Family links created', value: facts.familyLinks },
      ],
    },
    {
      title: 'Employer dashboard',
      note: 'What an employer sees on their desk',
      rows: [
        { label: 'Vacancies', value: facts.employerVacancies },
        { label: 'Applicants they can open', value: facts.employerApplicants },
        { label: 'Assessed in the pool', value: facts.assessedPool },
      ],
    },
    {
      title: 'Payment',
      note: 'The pay button and the family page',
      rows: [
        { label: 'Asked to talk before paying', value: facts.talk },
        { label: 'Opened checkout, not paid', value: facts.checkoutsOpen },
        { label: 'Payments completed', value: facts.paid },
        { label: 'Family pages sent', value: facts.familySent },
        { label: 'Family pages not sent', value: facts.familyFailed },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <p className="m-0 text-[14px] text-muted">
        Activity since {facts.since || 'today'}, India time. Open jobs, the assessed pool, employer vacancies and unpaid scores are the current totals. Names stay on Due today.
      </p>
      {groups.map((group) => (
        <section key={group.title}>
          <h2 className="m-0 text-[16px] font-semibold">{group.title}</h2>
          <p className="mt-1 mb-3 text-[13px] text-muted">{group.note}</p>
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
            {group.rows.map((row) => (
              <li key={row.label} className="rounded-[16px] border border-line/70 bg-surface px-4 py-3">
                <span className="block font-mono text-[22px] text-ink">{row.value}</span>
                <span className="block text-[13px] text-muted">{row.label}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div>
        <button
          type="button"
          onClick={() => void write()}
          disabled={busy}
          className="cursor-pointer rounded-[10px] border-0 bg-ink px-4 py-2.5 text-[14px] font-medium text-paper disabled:opacity-40"
        >
          {busy ? 'Reading the counts…' : 'Write a briefing'}
        </button>
        {failed ? <p className="mt-2 mb-0 text-[13px] text-accent-deep">The briefing could not be written. The counts above are still the figures.</p> : null}
      </div>
      {briefing ? (
        <section className="rounded-[16px] border border-line/70 bg-surface p-4">
          <p className="m-0 text-[15px] leading-[1.55] text-ink">{briefing.summary}</p>
          {briefing.calls.length > 0 ? (
            <ul className="mt-3 mb-0 list-disc pl-5 text-[14px] text-ink">
              {briefing.calls.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          {briefing.watch.length > 0 ? (
            <ul className="mt-3 mb-0 list-disc pl-5 text-[14px] text-muted">
              {briefing.watch.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 mb-0 font-mono text-[11px] text-muted">{briefing.source === 'model' ? 'Written from these counts.' : 'Written from the counts, without a model.'}</p>
        </section>
      ) : null}
    </div>
  );
}
