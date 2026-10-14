'use client';

import { useState } from 'react';
import type { NavItem, SiteSettings } from '@/lib/cms/settings';

const INPUT = 'w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[14px] outline-none focus:border-ink';

function Field({ label, children, help }: { label: string; children: React.ReactNode; help?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {help ? <span className="text-[12px] text-muted">{help}</span> : null}
    </label>
  );
}

function SaveBar({ onSave, state }: { onSave: () => void; state: string | null }) {
  return (
    <div className="mt-5 flex items-center gap-3">
      <button type="button" onClick={onSave} className="cursor-pointer rounded-full border-0 bg-ink px-4 py-2 text-[14px] font-medium text-paper">
        Save
      </button>
      {state && <span className="text-[13px] text-ink-2">{state}</span>}
    </div>
  );
}

function useSaver(key: string) {
  const [state, setState] = useState<string | null>(null);
  async function save(value: unknown) {
    setState('Saving…');
    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    setState(
      response.ok
        ? 'Saved. The live site is updated.'
        : data?.error === 'demo_mode'
          ? 'Demo mode: nothing can be saved without Supabase.'
          : data?.error === 'forbidden'
            ? 'Your role cannot change this section.'
            : data?.error === 'validation_failed'
              ? 'Please check the values (emails and links must be valid).'
              : 'Could not save.',
    );
  }
  return { state, save };
}

const card = 'rounded-[18px] border border-line bg-surface p-5';

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [general, setGeneral] = useState(initial.general);
  const [announcement, setAnnouncement] = useState(initial.announcement);
  const [navigation, setNavigation] = useState(initial.navigation);
  const [footer, setFooter] = useState(initial.footer);
  const [applications, setApplications] = useState(initial.applications);
  const [seo, setSeo] = useState(initial.seo);

  const g = useSaver('general');
  const a = useSaver('announcement');
  const n = useSaver('navigation');
  const f = useSaver('footer');
  const ap = useSaver('applications');
  const s = useSaver('seo');

  const setNav = (index: number, next: Partial<NavItem>) =>
    setNavigation({ ...navigation, items: navigation.items.map((item, i) => (i === index ? { ...item, ...next } : item)) });

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className={card}>
        <h2 className="m-0 text-[17px] font-semibold">Contact details</h2>
        <p className="m-0 mt-1 text-[13px] text-muted">Shown in the header, footer, contact cards and placeholders like {'{{support_phone}}'}.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Site name"><input className={INPUT} value={general.siteName} onChange={(e) => setGeneral({ ...general, siteName: e.target.value })} /></Field>
          <Field label="Tagline"><input className={INPUT} value={general.tagline} onChange={(e) => setGeneral({ ...general, tagline: e.target.value })} /></Field>
          <Field label="Support phone"><input className={INPUT} value={general.supportPhone} onChange={(e) => setGeneral({ ...general, supportPhone: e.target.value })} /></Field>
          <Field label="WhatsApp number" help="Include the country code, e.g. +91 98..."><input className={INPUT} value={general.whatsapp} onChange={(e) => setGeneral({ ...general, whatsapp: e.target.value })} /></Field>
          <Field label="Support email"><input className={INPUT} type="email" value={general.supportEmail} onChange={(e) => setGeneral({ ...general, supportEmail: e.target.value })} /></Field>
          <Field label="Office hours"><input className={INPUT} value={general.officeHours} onChange={(e) => setGeneral({ ...general, officeHours: e.target.value })} /></Field>
        </div>
        <div className="mt-3">
          <Field label="Office address"><textarea className={INPUT} rows={2} value={general.officeAddress} onChange={(e) => setGeneral({ ...general, officeAddress: e.target.value })} /></Field>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(['instagram', 'facebook', 'linkedin', 'youtube'] as const).map((network) => (
            <Field key={network} label={network[0]!.toUpperCase() + network.slice(1)}>
              <input className={INPUT} placeholder="https://" value={general.socials[network]} onChange={(e) => setGeneral({ ...general, socials: { ...general.socials, [network]: e.target.value } })} />
            </Field>
          ))}
        </div>
        <SaveBar onSave={() => g.save(general)} state={g.state} />
      </section>

      <section className={card}>
        <h2 className="m-0 text-[17px] font-semibold">Announcement bar</h2>
        <p className="m-0 mt-1 text-[13px] text-muted">The strip above the header on every public page.</p>
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex items-center gap-2 text-[14px]">
            <input type="checkbox" checked={announcement.enabled} onChange={(e) => setAnnouncement({ ...announcement, enabled: e.target.checked })} />
            Show the announcement bar
          </label>
          <Field label="Message"><textarea className={INPUT} rows={2} value={announcement.text} onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Link text"><input className={INPUT} value={announcement.linkLabel} onChange={(e) => setAnnouncement({ ...announcement, linkLabel: e.target.value })} /></Field>
            <Field label="Link"><input className={INPUT} value={announcement.href} onChange={(e) => setAnnouncement({ ...announcement, href: e.target.value })} /></Field>
          </div>
        </div>
        <SaveBar onSave={() => a.save(announcement)} state={a.state} />

        <h2 className="m-0 mt-8 text-[17px] font-semibold">Footer</h2>
        <div className="mt-3">
          <Field label="Footer description"><textarea className={INPUT} rows={3} value={footer.blurb} onChange={(e) => setFooter({ blurb: e.target.value })} /></Field>
        </div>
        <SaveBar onSave={() => f.save(footer)} state={f.state} />
      </section>

      <section className={card}>
        <h2 className="m-0 text-[17px] font-semibold">Main navigation</h2>
        <p className="m-0 mt-1 text-[13px] text-muted">Links in the header and footer. Paths like /jobs get the visitor’s language added automatically.</p>
        <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
          {navigation.items.map((item, index) => (
            <li key={index} className="grid gap-2 rounded-[12px] bg-paper p-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
              <input className={INPUT} placeholder="Label" value={item.label} onChange={(e) => setNav(index, { label: e.target.value })} />
              <input className={INPUT} placeholder="Hindi label" value={item.labelHi ?? ''} onChange={(e) => setNav(index, { labelHi: e.target.value })} />
              <input className={INPUT} placeholder="Arabic label" value={item.labelAr ?? ''} onChange={(e) => setNav(index, { labelAr: e.target.value })} />
              <input className={INPUT} placeholder="/path" value={item.href} onChange={(e) => setNav(index, { href: e.target.value })} />
              <button type="button" onClick={() => setNavigation({ ...navigation, items: navigation.items.filter((_, i) => i !== index) })} className="cursor-pointer rounded-[8px] border border-line bg-surface px-2 text-[12px] text-accent-deep">
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setNavigation({ ...navigation, items: [...navigation.items, { label: '', href: '/' }] })} className="mt-2 cursor-pointer rounded-full border border-dashed border-line-strong bg-transparent px-3 py-1.5 text-[13px]">
          + Add link
        </button>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Header button text"><input className={INPUT} value={navigation.headerCta.label} onChange={(e) => setNavigation({ ...navigation, headerCta: { ...navigation.headerCta, label: e.target.value } })} /></Field>
          <Field label="Header button link"><input className={INPUT} value={navigation.headerCta.href} onChange={(e) => setNavigation({ ...navigation, headerCta: { ...navigation.headerCta, href: e.target.value } })} /></Field>
        </div>
        <SaveBar onSave={() => n.save(navigation)} state={n.state} />
      </section>

      <section className={card}>
        <h2 className="m-0 text-[17px] font-semibold">Applications</h2>
        <p className="m-0 mt-1 text-[13px] text-muted">Who can apply, and how. Needs the jobs.publish permission.</p>
        <div className="mt-4 flex flex-col gap-3 text-[14px]">
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" checked={applications.allowQuickApply} onChange={(e) => setApplications({ ...applications, allowQuickApply: e.target.checked })} />
            <span>
              One-step apply on job pages
              <span className="block text-[13px] text-muted">Visitors create their account and apply in a single form. Recommended.</span>
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" checked={applications.requirePaidAssessment} onChange={(e) => setApplications({ ...applications, requirePaidAssessment: e.target.checked })} />
            <span>
              Require a paid assessment before applying
              <span className="block text-[13px] text-muted">Off by default. Turning this on puts a payment in front of every application; check the legal position on charging candidates first.</span>
            </span>
          </label>
        </div>
        <SaveBar onSave={() => ap.save(applications)} state={ap.state} />

        <h2 className="m-0 mt-8 text-[17px] font-semibold">Search engines and sharing</h2>
        <div className="mt-3 flex flex-col gap-3">
          <Field label="Default title"><input className={INPUT} value={seo.defaultTitle} onChange={(e) => setSeo({ ...seo, defaultTitle: e.target.value })} /></Field>
          <Field label="Default description"><textarea className={INPUT} rows={2} value={seo.defaultDescription} onChange={(e) => setSeo({ ...seo, defaultDescription: e.target.value })} /></Field>
          <Field label="Default share image URL"><input className={INPUT} value={seo.ogImage} onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })} /></Field>
        </div>
        <SaveBar onSave={() => s.save(seo)} state={s.state} />
      </section>
    </div>
  );
}
