'use client';

import { useState } from 'react';
import type { SiteSettings } from '@/lib/cms/settings';
import {
  CHARGE_CURRENCIES,
  INDICATIVE_CURRENCIES,
  formatFee,
  formatIndicative,
  type ChargeCurrency,
} from '@/lib/company/config';
import { Field, INPUT, MoneyInput, NumberInput, SaveBar, Section, useSettingsSaver } from './ui';

type Props = Pick<SiteSettings, 'company' | 'pricing' | 'hiring' | 'cohort'> & { provider: string; railCurrencies: readonly string[] };

/**
 * Settings › Company & pricing. Super admins only; every save is audited with
 * the saved value.
 */
export function CompanyForm(props: Props) {
  const [company, setCompany] = useState(props.company);
  const [pricing, setPricing] = useState(props.pricing);
  const [hiring, setHiring] = useState(props.hiring);
  const [cohort, setCohort] = useState(props.cohort);
  const c = useSettingsSaver('company');
  const p = useSettingsSaver('pricing');
  const h = useSettingsSaver('hiring');
  const k = useSettingsSaver('cohort');

  const text = (key: keyof typeof company) => ({
    value: String(company[key] ?? ''),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCompany({ ...company, [key]: e.target.value }),
  });
  const partner = (key: keyof typeof company.partner) => ({
    value: company.partner[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCompany({ ...company, partner: { ...company.partner, [key]: e.target.value } }),
  });
  const mismatch = props.provider && props.railCurrencies.length > 0 && !props.railCurrencies.includes(pricing.chargeCurrency);

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Section
        title="The company that takes payment"
        lead="Shown on the terms, privacy and contact pages and in every email footer. The legal name must match the merchant account exactly."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Legal name"><input className={INPUT} {...text('legalName')} /></Field>
          <Field label="Trading as" help="The name candidates know you by."><input className={INPUT} {...text('tradingAs')} /></Field>
          <Field label="Registration label" help="e.g. Trade licence"><input className={INPUT} {...text('registrationLabel')} /></Field>
          <Field label="Registration number"><input className={INPUT} {...text('registrationNumber')} /></Field>
          <Field label="Jurisdiction" help="Where it is registered; also the governing law in the terms."><input className={INPUT} {...text('jurisdiction')} /></Field>
          <Field label="Statement descriptor" help="What the bank statement shows. Check it against a live test payment."><input className={INPUT} {...text('statementDescriptor')} /></Field>
        </div>
        <div className="mt-3 grid gap-3">
          <Field label="Registered address"><textarea className={INPUT} rows={2} {...text('registeredAddress')} /></Field>
          <Field label="Description" help="What the company is and whose it is."><input className={INPUT} {...text('descriptor')} /></Field>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Parent brand"><input className={INPUT} {...text('parentBrand')} /></Field>
          <Field label="Short name"><input className={INPUT} {...text('shortName')} /></Field>
          <Field label="Locations line" help="e.g. Lisbon · Dubai"><input className={INPUT} {...text('locations')} /></Field>
        </div>
        <SaveBar onSave={() => c.save(company)} state={c.state} busy={c.busy} />
      </Section>

      <Section title="Contacts" lead="Where people reach you. Every inbox here must be read by someone.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Phone"><input className={INPUT} {...text('phone')} /></Field>
          <Field label="Website"><input className={INPUT} {...text('website')} /></Field>
          <Field label="Candidate email"><input className={INPUT} type="email" {...text('supportEmail')} /></Field>
          <Field label="Employer email"><input className={INPUT} type="email" {...text('employerEmail')} /></Field>
          <Field label="Scam reports email"><input className={INPUT} type="email" {...text('reportEmail')} /></Field>
          <Field label="Finance and refunds email"><input className={INPUT} type="email" {...text('financeEmail')} /></Field>
          <Field label="Finance contact name"><input className={INPUT} {...text('financeName')} /></Field>
          <Field label="Data protection contact"><input className={INPUT} {...text('dataProtectionName')} /></Field>
          <Field label="Data protection email"><input className={INPUT} type="email" {...text('dataProtectionEmail')} /></Field>
        </div>
        <SaveBar onSave={() => c.save(company)} state={c.state} busy={c.busy} />
      </Section>

      <Section title="Offices" lead="Shown in the footer and on the contact page. List only offices that exist.">
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {company.offices.map((office, index) => (
            <li key={index} className="grid gap-2 rounded-[12px] bg-paper p-3 sm:grid-cols-[140px_1fr_auto]">
              <input className={INPUT} placeholder="City" value={office.city} onChange={(e) => setCompany({ ...company, offices: company.offices.map((o, i) => (i === index ? { ...o, city: e.target.value } : o)) })} />
              <input className={INPUT} placeholder="Address" value={office.address} onChange={(e) => setCompany({ ...company, offices: company.offices.map((o, i) => (i === index ? { ...o, address: e.target.value } : o)) })} />
              <button type="button" onClick={() => setCompany({ ...company, offices: company.offices.filter((_, i) => i !== index) })} className="cursor-pointer rounded-[8px] border border-line bg-surface px-2 text-[12px] text-accent-deep">
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setCompany({ ...company, offices: [...company.offices, { city: '', address: '' }] })} className="mt-2 cursor-pointer rounded-full border border-dashed border-line-strong bg-transparent px-3 py-1.5 text-[13px]">
          + Add office
        </button>

        <h3 className="m-0 mt-6 text-[15px] font-semibold">Placement partner in Portugal</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Legal name"><input className={INPUT} {...partner('legalName')} /></Field>
          <Field label="Manager"><input className={INPUT} {...partner('manager')} /></Field>
          <Field label="Registration label"><input className={INPUT} {...partner('registrationLabel')} /></Field>
          <Field label="Registration number"><input className={INPUT} {...partner('registrationNumber')} /></Field>
          <Field label="Address"><input className={INPUT} {...partner('address')} /></Field>
          <Field label="Email"><input className={INPUT} type="email" {...partner('email')} /></Field>
        </div>
        <SaveBar onSave={() => c.save(company)} state={c.state} busy={c.busy} />
      </Section>

      <Section
        title="Package price"
        lead="What a candidate pays for the optional career preparation package. The checkout, the pages and the emails all read this one price."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Charge currency" help={`Must match the active payment rail${props.provider ? ` (${props.provider}: ${props.railCurrencies.join(', ')})` : ''}.`}>
            <select className={INPUT} value={pricing.chargeCurrency} onChange={(e) => setPricing({ ...pricing, chargeCurrency: e.target.value as ChargeCurrency })}>
              {CHARGE_CURRENCIES.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </Field>
          <Field label="VAT included (%)" help="Inside the price, never added at checkout.">
            <NumberInput value={pricing.vatBasisPoints / 100} step={0.01} min={0} max={30} onChange={(v) => setPricing({ ...pricing, vatBasisPoints: Math.round(v * 100) })} />
          </Field>
        </div>
        {mismatch && (
          <p role="alert" className="m-0 mt-3 rounded-[12px] border border-accent bg-accent-tint px-3 py-2 text-[13px]">
            The active payment rail cannot charge {pricing.chargeCurrency}. Checkout will refuse payments until the two match.
          </p>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {CHARGE_CURRENCIES.map((code) => (
            <Field key={code} label={`Price in ${code}`}>
              <MoneyInput currency={code} minor={pricing.feeMinor[code]} onChange={(minor) => setPricing({ ...pricing, feeMinor: { ...pricing.feeMinor, [code]: minor } })} />
            </Field>
          ))}
        </div>
        <p className="m-0 mt-3 text-[13px] text-ink-2">
          Candidates will be charged <strong>{formatFee(pricing)}</strong>
          {pricing.chargeCurrency !== 'INR' ? <> (shown as about {formatIndicative(pricing, 'INR')})</> : null}.
        </p>

        <details className="mt-4">
          <summary className="cursor-pointer text-[13px] font-medium">Guide conversions from 1 EUR (display only, never charged)</summary>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {INDICATIVE_CURRENCIES.map((code) => (
              <Field key={code} label={code}>
                <NumberInput value={pricing.indicativeRates[code]} step={0.01} min={0} onChange={(v) => setPricing({ ...pricing, indicativeRates: { ...pricing.indicativeRates, [code]: v } })} />
              </Field>
            ))}
          </div>
        </details>

        <h3 className="m-0 mt-6 text-[15px] font-semibold">Employer placement fee</h3>
        <p className="m-0 mt-1 text-[13px] text-muted">Paid by the employer. Candidates never pay for a job.</p>
        <div className="mt-3 max-w-[260px]">
          <MoneyInput currency="EUR" minor={pricing.employerPlacementFeeMinor} onChange={(minor) => setPricing({ ...pricing, employerPlacementFeeMinor: minor })} />
        </div>
        <SaveBar onSave={() => p.save(pricing)} state={p.state} busy={p.busy} />
      </Section>

      <Section title="Selection and promises" lead="The shortlist rule and the numbers the site promises. They appear on the selection rules, the terms and the job pages.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Shortlist score (out of 100)" help={`Candidates must score above this. Shown as ${hiring.shortlistMinScore / 10} out of 10.`}>
            <NumberInput value={hiring.shortlistMinScore} min={0} max={99} onChange={(v) => setHiring({ ...hiring, shortlistMinScore: v })} />
          </Field>
          <Field label="Working days to an answer"><NumberInput value={hiring.responseDays} min={1} max={120} onChange={(v) => setHiring({ ...hiring, responseDays: v })} /></Field>
          <Field label="Days to deliver the report"><NumberInput value={hiring.reportWithinDays} min={1} max={60} onChange={(v) => setHiring({ ...hiring, reportWithinDays: v })} /></Field>
          <Field label="Days to deliver the legal review"><NumberInput value={hiring.legalReviewWithinDays ?? 10} min={1} max={90} onChange={(v) => setHiring({ ...hiring, legalReviewWithinDays: v })} /></Field>
          <Field label="Months a profile stays listed"><NumberInput value={hiring.profileMonths} min={1} max={60} onChange={(v) => setHiring({ ...hiring, profileMonths: v })} /></Field>
          <Field label="Typical contract length (years)"><NumberInput value={hiring.contractYears} min={1} max={10} onChange={(v) => setHiring({ ...hiring, contractYears: v })} /></Field>
          <Field label="Terms version" help="Move it whenever the terms, refund policy or selection rules change in substance. Stored with every consent.">
            <input className={INPUT} value={hiring.consentVersion} onChange={(e) => setHiring({ ...hiring, consentVersion: e.target.value })} />
          </Field>
        </div>

        <h3 className="m-0 mt-6 text-[15px] font-semibold">Published past results</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Hired"><NumberInput value={hiring.outcomeHired} min={0} onChange={(v) => setHiring({ ...hiring, outcomeHired: v })} /></Field>
          <Field label="Out of every … shortlisted"><NumberInput value={hiring.outcomeShortlisted} min={1} onChange={(v) => setHiring({ ...hiring, outcomeShortlisted: v })} /></Field>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          <Field label="Where the figure comes from" help="Printed beside the figure every time. Keep the base (shortlisted, not applicants) and the disclaimer.">
            <textarea className={INPUT} rows={4} value={hiring.outcomeBasis} onChange={(e) => setHiring({ ...hiring, outcomeBasis: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-[14px]">
            <input type="checkbox" checked={hiring.outcomeVisible} onChange={(e) => setHiring({ ...hiring, outcomeVisible: e.target.checked })} />
            Show the past results on the site
          </label>
        </div>
        <SaveBar onSave={() => h.save(hiring)} state={h.state} busy={h.busy} />
      </Section>

      <Section title="Current cohort" lead="The intake candidates register into. New registrations and payments are tagged with the cohort id.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Cohort id" help="Lowercase letters, numbers and dashes. Change it only when a new intake opens.">
            <input className={INPUT} value={cohort.id} onChange={(e) => setCohort({ ...cohort, id: e.target.value })} />
          </Field>
          <Field label="Name"><input className={INPUT} value={cohort.name} onChange={(e) => setCohort({ ...cohort, name: e.target.value })} /></Field>
          <Field label="Corridor"><input className={INPUT} value={cohort.corridor} onChange={(e) => setCohort({ ...cohort, corridor: e.target.value })} /></Field>
          <Field label="Applications close"><input className={INPUT} type="date" value={cohort.closesAt} onChange={(e) => setCohort({ ...cohort, closesAt: e.target.value })} /></Field>
          <Field label="Review until"><input className={INPUT} type="date" value={cohort.reviewUntil} onChange={(e) => setCohort({ ...cohort, reviewUntil: e.target.value })} /></Field>
          <Field label="Results announced"><input className={INPUT} type="date" value={cohort.announceAt} onChange={(e) => setCohort({ ...cohort, announceAt: e.target.value })} /></Field>
        </div>
        <SaveBar onSave={() => k.save(cohort)} state={k.state} busy={k.busy} />
      </Section>
    </div>
  );
}
