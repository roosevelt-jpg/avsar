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
  inboxNew: number;
  legalWaiting: number;
  documentsWaiting: number;
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
export function AnalysisTool({ facts, insight }: { facts: ConversionFacts; insight: Briefing }) {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [forFacts, setForFacts] = useState('');
  const signature = [
    facts.newAccounts,
    facts.profilesComplete,
    facts.finishedTests,
    facts.applications,
    facts.interviews,
    facts.openJobs,
    facts.awaitingPayment,
    facts.familyLinks,
    facts.employerVacancies,
    facts.employerApplicants,
    facts.assessedPool,
    facts.inboxNew,
    facts.legalWaiting,
    facts.documentsWaiting,
    facts.talk,
    facts.familySent,
    facts.familyFailed,
    facts.checkoutsOpen,
    facts.paid,
  ].join('.');
  const shown = briefing && forFacts === signature ? briefing : insight;
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
      setForFacts(signature);
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
      title: 'Open work',
      note: 'What is still waiting on the staff desk',
      rows: [
        { label: 'Unread messages', value: facts.inboxNew },
        { label: 'Legal reviews not delivered', value: facts.legalWaiting },
        { label: 'Visa documents waiting', value: facts.documentsWaiting },
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
          {busy ? 'Reading the counts…' : 'Rewrite with the model'}
        </button>
        {failed ? <p className="mt-2 mb-0 text-[13px] text-accent-deep">The briefing could not be written. The counts above are still the figures.</p> : null}
      </div>
      <section className="rounded-[16px] border border-line/70 bg-surface p-4">
        <h2 className="m-0 text-[16px] font-semibold">Insights</h2>
        <p className="m-0 mt-2 text-[15px] leading-[1.55] text-ink">{shown.summary}</p>
        {shown.calls.length > 0 ? (
          <ul className="mt-3 mb-0 list-disc pl-5 text-[14px] text-ink">
            {shown.calls.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
        {shown.watch.length > 0 ? (
          <ul className="mt-3 mb-0 list-disc pl-5 text-[14px] text-muted">
            {shown.watch.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
        <p className="mt-3 mb-0 font-mono text-[11px] text-muted">
          {shown.source === 'model' ? 'Written from these counts. A new change replaces it.' : 'Written from the counts as they change.'}
        </p>
      </section>
    </div>
  );
}
