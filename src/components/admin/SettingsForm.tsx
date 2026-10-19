'use client';

import { useState } from 'react';
import type { NavItem, SiteSettings } from '@/lib/cms/settings';
import { Field, INPUT, SaveBar, Section, useSettingsSaver } from './settings/ui';

/** Settings › General: contact details, the announcement bar and the footer. */
export function GeneralSettings({ initial }: { initial: Pick<SiteSettings, 'general' | 'announcement' | 'footer'> }) {
  const [general, setGeneral] = useState(initial.general);
  const [announcement, setAnnouncement] = useState(initial.announcement);
  const [footer, setFooter] = useState(initial.footer);
  const g = useSettingsSaver('general');
  const a = useSettingsSaver('announcement');
  const f = useSettingsSaver('footer');

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Section title="Contact details" lead="Shown in the header, footer, contact cards and placeholders like {{support_phone}}.">
        <div className="grid gap-3 sm:grid-cols-2">
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
        <SaveBar onSave={() => g.save(general)} state={g.state} busy={g.busy} />
      </Section>

      <Section title="Announcement bar" lead="The strip above the header on every public page.">
        <div className="flex flex-col gap-3">
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
        <SaveBar onSave={() => a.save(announcement)} state={a.state} busy={a.busy} />

        <h2 className="m-0 mt-8 text-[17px] font-semibold">Footer</h2>
        <div className="mt-3">
          <Field label="Footer description"><textarea className={INPUT} rows={3} value={footer.blurb} onChange={(e) => setFooter({ blurb: e.target.value })} /></Field>
        </div>
        <SaveBar onSave={() => f.save(footer)} state={f.state} busy={f.busy} />
      </Section>
    </div>
  );
}

/** Settings › Navigation: header and footer links, and the header button. */
export function NavigationSettings({ initial }: { initial: SiteSettings['navigation'] }) {
  const [navigation, setNavigation] = useState(initial);
  const n = useSettingsSaver('navigation');
  const setNav = (index: number, next: Partial<NavItem>) =>
    setNavigation({ ...navigation, items: navigation.items.map((item, i) => (i === index ? { ...item, ...next } : item)) });
  const move = (index: number, by: -1 | 1) => {
    const items = [...navigation.items];
    const [item] = items.splice(index, 1);
    if (item) items.splice(index + by, 0, item);
    setNavigation({ ...navigation, items });
  };

  return (
    <Section title="Main navigation" lead="Links in the header and footer, in this order. Paths like /jobs get the visitor’s language added automatically.">
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {navigation.items.map((item, index) => (
          <li key={index} className="grid gap-2 rounded-[12px] bg-paper p-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <input className={INPUT} placeholder="Label" value={item.label} onChange={(e) => setNav(index, { label: e.target.value })} />
            <input className={INPUT} placeholder="Hindi label" value={item.labelHi ?? ''} onChange={(e) => setNav(index, { labelHi: e.target.value })} />
            <input className={INPUT} placeholder="Arabic label" value={item.labelAr ?? ''} onChange={(e) => setNav(index, { labelAr: e.target.value })} />
            <input className={INPUT} placeholder="/path" value={item.href} onChange={(e) => setNav(index, { href: e.target.value })} />
            <div className="flex gap-1">
              <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)} className="cursor-pointer rounded-[8px] border border-line bg-surface px-2 text-[12px] disabled:opacity-30">↑</button>
              <button type="button" aria-label="Move down" disabled={index === navigation.items.length - 1} onClick={() => move(index, 1)} className="cursor-pointer rounded-[8px] border border-line bg-surface px-2 text-[12px] disabled:opacity-30">↓</button>
              <button type="button" onClick={() => setNavigation({ ...navigation, items: navigation.items.filter((_, i) => i !== index) })} className="cursor-pointer rounded-[8px] border border-line bg-surface px-2 text-[12px] text-accent-deep">
                Remove
              </button>
            </div>
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
      <SaveBar onSave={() => n.save(navigation)} state={n.state} busy={n.busy} />
    </Section>
  );
}

/** Settings › Conversion: trust lines, deliverables, offer and pricing copy. */
export function ConversionSettingsForm({ initial }: { initial: SiteSettings['conversion'] }) {
  const [conversion, setConversion] = useState(initial);
  const saver = useSettingsSaver('conversion');

  function setTrust(index: number, value: string) {
    setConversion({ ...conversion, trustLines: conversion.trustLines.map((line, i) => (i === index ? value : line)) });
  }
  function setDeliverable(index: number, next: Partial<{ title: string; timing: string }>) {
    setConversion({
      ...conversion,
      deliverables: conversion.deliverables.map((item, i) => (i === index ? { ...item, ...next } : item)),
    });
  }
  function setFeature(index: number, value: string) {
    setConversion({ ...conversion, pricingFeatures: conversion.pricingFeatures.map((f, i) => (i === index ? value : f)) });
  }

  return (
    <div className="flex flex-col gap-5">
      <Section
        title="Trust lines beside payment"
        lead="Shown next to every package checkout. Three short facts beat a long disclaimer. For real testimonials (video or written), use docs/testimonials-script.md — never invent quotes in CMS."
      >
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {conversion.trustLines.map((line, index) => (
            <li key={index}>
              <Field label={`Line ${index + 1}`}>
                <textarea className={INPUT} rows={2} value={line} onChange={(e) => setTrust(index, e.target.value)} />
              </Field>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={conversion.trustLines.length >= 5}
            onClick={() => setConversion({ ...conversion, trustLines: [...conversion.trustLines, ''] })}
            className="cursor-pointer rounded-full border border-dashed border-line-strong bg-transparent px-3 py-1.5 text-[13px] disabled:opacity-40"
          >
            + Add line
          </button>
          {conversion.trustLines.length > 1 ? (
            <button
              type="button"
              onClick={() => setConversion({ ...conversion, trustLines: conversion.trustLines.slice(0, -1) })}
              className="cursor-pointer rounded-full border border-line bg-surface px-3 py-1.5 text-[13px]"
            >
              Remove last
            </button>
          ) : null}
        </div>
      </Section>

      <Section title="Package deliverables" lead="What the buyer gets, and when. Price and report timing come from Company & pricing.">
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {conversion.deliverables.map((item, index) => (
            <li key={index} className="grid gap-2 rounded-[12px] bg-paper p-3 sm:grid-cols-2">
              <Field label="Title"><input className={INPUT} value={item.title} onChange={(e) => setDeliverable(index, { title: e.target.value })} /></Field>
              <Field label="Timing / detail"><textarea className={INPUT} rows={2} value={item.timing} onChange={(e) => setDeliverable(index, { timing: e.target.value })} /></Field>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={conversion.deliverables.length >= 6}
            onClick={() => setConversion({ ...conversion, deliverables: [...conversion.deliverables, { title: '', timing: '' }] })}
            className="cursor-pointer rounded-full border border-dashed border-line-strong bg-transparent px-3 py-1.5 text-[13px] disabled:opacity-40"
          >
            + Add deliverable
          </button>
          {conversion.deliverables.length > 1 ? (
            <button
              type="button"
              onClick={() => setConversion({ ...conversion, deliverables: conversion.deliverables.slice(0, -1) })}
              className="cursor-pointer rounded-full border border-line bg-surface px-3 py-1.5 text-[13px]"
            >
              Remove last
            </button>
          ) : null}
        </div>
      </Section>

      <Section title="After the assessment" lead="Shown when someone finishes the test and has not paid yet.">
        <div className="grid gap-3">
          <Field label="Heading"><input className={INPUT} value={conversion.offerHeading} onChange={(e) => setConversion({ ...conversion, offerHeading: e.target.value })} /></Field>
          <Field label="Body"><textarea className={INPUT} rows={4} value={conversion.offerBody} onChange={(e) => setConversion({ ...conversion, offerBody: e.target.value })} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Primary button"><input className={INPUT} value={conversion.offerPrimaryLabel} onChange={(e) => setConversion({ ...conversion, offerPrimaryLabel: e.target.value })} /></Field>
            <Field label="Secondary button"><input className={INPUT} value={conversion.offerSecondaryLabel} onChange={(e) => setConversion({ ...conversion, offerSecondaryLabel: e.target.value })} /></Field>
          </div>
          <Field label="Sticky mobile button (unpaid after assessment)">
            <input className={INPUT} value={conversion.stickyCtaLabel} onChange={(e) => setConversion({ ...conversion, stickyCtaLabel: e.target.value })} />
          </Field>
        </div>
      </Section>

      <Section title="Pricing page" lead="Candidate column on /pricing. Employer and partner cards stay in the page code.">
        <Field label="Lead"><textarea className={INPUT} rows={3} value={conversion.pricingLead} onChange={(e) => setConversion({ ...conversion, pricingLead: e.target.value })} /></Field>
        <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
          {conversion.pricingFeatures.map((feature, index) => (
            <li key={index}>
              <Field label={`Feature ${index + 1}`}>
                <input className={INPUT} value={feature} onChange={(e) => setFeature(index, e.target.value)} />
              </Field>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={conversion.pricingFeatures.length >= 10}
            onClick={() => setConversion({ ...conversion, pricingFeatures: [...conversion.pricingFeatures, ''] })}
            className="cursor-pointer rounded-full border border-dashed border-line-strong bg-transparent px-3 py-1.5 text-[13px] disabled:opacity-40"
          >
            + Add feature
          </button>
          {conversion.pricingFeatures.length > 1 ? (
            <button
              type="button"
              onClick={() => setConversion({ ...conversion, pricingFeatures: conversion.pricingFeatures.slice(0, -1) })}
              className="cursor-pointer rounded-full border border-line bg-surface px-3 py-1.5 text-[13px]"
            >
              Remove last
            </button>
          ) : null}
        </div>
        <label className="mt-4 flex items-start gap-2 text-[14px]">
          <input
            type="checkbox"
            className="mt-1"
            checked={conversion.mentionPackageInJobAlerts}
            onChange={(e) => setConversion({ ...conversion, mentionPackageInJobAlerts: e.target.checked })}
          />
          <span>
            Mention the package on weekly job alerts for unpaid candidates
            <span className="block text-[13px] text-muted">One soft line only. Newsletter digests never get it.</span>
          </span>
        </label>
      </Section>

      <SaveBar onSave={() => saver.save(conversion)} state={saver.state} busy={saver.busy} />
    </div>
  );
}

/** Settings › VSL: paid-traffic funnel at /[locale]/go. */
export function VslSettingsForm({ initial }: { initial: SiteSettings['vsl'] }) {
  const [vsl, setVsl] = useState(initial);
  const saver = useSettingsSaver('vsl');

  function setHighlight(index: number, value: string) {
    setVsl({ ...vsl, highlights: vsl.highlights.map((line, i) => (i === index ? value : line)) });
  }

  return (
    <div className="flex flex-col gap-5">
      <Section title="Copy" lead="Headline and proof lines on the /go funnel. Keep it short: visitors arrive from ads and WhatsApp.">
        <Field label="Eyebrow"><input className={INPUT} value={vsl.eyebrow} onChange={(e) => setVsl({ ...vsl, eyebrow: e.target.value })} /></Field>
        <Field label="Headline"><textarea className={INPUT} rows={2} value={vsl.headline} onChange={(e) => setVsl({ ...vsl, headline: e.target.value })} /></Field>
        <Field label="Supporting line"><textarea className={INPUT} rows={3} value={vsl.subhead} onChange={(e) => setVsl({ ...vsl, subhead: e.target.value })} /></Field>
        <div className="mt-2 flex flex-col gap-2">
          <p className="m-0 text-[13px] font-medium text-ink-2">Highlights</p>
          {vsl.highlights.map((line, index) => (
            <input key={index} className={INPUT} value={line} onChange={(e) => setHighlight(index, e.target.value)} />
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              className="text-[13px] text-accent"
              disabled={vsl.highlights.length >= 6}
              onClick={() => setVsl({ ...vsl, highlights: [...vsl.highlights, ''] })}
            >
              Add line
            </button>
            {vsl.highlights.length > 1 ? (
              <button
                type="button"
                className="text-[13px] text-muted"
                onClick={() => setVsl({ ...vsl, highlights: vsl.highlights.slice(0, -1) })}
              >
                Remove last
              </button>
            ) : null}
          </div>
        </div>
      </Section>

      <Section
        title="Video"
        lead="YouTube or an uploaded MP4. Leave blank to use the Applications film, then /video/intro.mp4."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Video URL">
            <input
              className={INPUT}
              value={vsl.videoUrl}
              placeholder="https://www.youtube.com/watch?v=... or /video/intro.mp4"
              onChange={(e) => setVsl({ ...vsl, videoUrl: e.target.value })}
            />
          </Field>
          <Field label="Poster image">
            <input
              className={INPUT}
              value={vsl.videoPoster}
              placeholder="/video/hero-poster.jpg"
              onChange={(e) => setVsl({ ...vsl, videoPoster: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Video title (accessibility)">
          <input className={INPUT} value={vsl.videoTitle} onChange={(e) => setVsl({ ...vsl, videoTitle: e.target.value })} />
        </Field>
      </Section>

      <Section title="Buttons" lead="Primary and sticky send visitors to sign-up (ad params kept). Secondary opens the jobs board.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Primary CTA">
            <input className={INPUT} value={vsl.primaryCtaLabel} onChange={(e) => setVsl({ ...vsl, primaryCtaLabel: e.target.value })} />
          </Field>
          <Field label="Sticky bar CTA">
            <input className={INPUT} value={vsl.stickyCtaLabel} onChange={(e) => setVsl({ ...vsl, stickyCtaLabel: e.target.value })} />
          </Field>
          <Field label="Secondary link">
            <input className={INPUT} value={vsl.secondaryCtaLabel} onChange={(e) => setVsl({ ...vsl, secondaryCtaLabel: e.target.value })} />
          </Field>
        </div>
      </Section>

      <SaveBar onSave={() => saver.save(vsl)} state={saver.state} busy={saver.busy} />
    </div>
  );
}

/** Settings › Applications: who can apply, and how. Needs jobs.publish. */
export function ApplicationSettings({ initial }: { initial: SiteSettings['applications'] }) {
  const [applications, setApplications] = useState(initial);
  const ap = useSettingsSaver('applications');
  return (
    <Section title="Applications" lead="Who can apply, and how. Needs the jobs.publish permission.">
      <div className="flex flex-col gap-3 text-[14px]">
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
            <span className="block text-[13px] text-muted">Leave off. The published terms say the package is optional and not required to join the database or take part in recruitment; turning this on breaks that promise and makes the fee a condition of applying.</span>
          </span>
        </label>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Field label="Film beside the apply form and on sign-up">
          <input
            className={INPUT}
            value={applications.filmUrl}
            placeholder="https://www.youtube.com/watch?v=... or /video/intro.mp4"
            onChange={(e) => setApplications({ ...applications, filmUrl: e.target.value })}
          />
        </Field>
        <Field label="Film button text">
          <input className={INPUT} value={applications.filmLabel} maxLength={80} onChange={(e) => setApplications({ ...applications, filmLabel: e.target.value })} />
        </Field>
      </div>
      <p className="mt-2 mb-0 text-[13px] text-muted">
        Shown as a quiet &ldquo;watch&rdquo; button where people decide, never instead of the apply button. YouTube loads only when pressed. Leave the link empty to hide it.
      </p>
      <SaveBar onSave={() => ap.save(applications)} state={ap.state} busy={ap.busy} />
    </Section>
  );
}
