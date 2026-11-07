'use client';

import { useState } from 'react';
import type { NavItem, SiteSettings } from '@/lib/cms/settings';
import { MediaField } from './MediaPicker';
import { Field, INPUT, SaveBar, Section, useSettingsSaver } from './settings/ui';

/** Plain labels for icon keys used in Settings chips and badges. */
const SETTING_ICONS: { value: string; label: string }[] = [
  { value: 'users', label: 'People' },
  { value: 'shield', label: 'Shield' },
  { value: 'bolt', label: 'Bolt' },
  { value: 'document', label: 'Document' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'plane', label: 'Plane' },
  { value: 'check', label: 'Check' },
  { value: 'globe', label: 'Globe' },
  { value: 'briefcase', label: 'Briefcase' },
  { value: 'star', label: 'Star' },
  { value: 'home', label: 'Home' },
  { value: 'phone', label: 'Phone' },
];

function IconSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const known = SETTING_ICONS.some((icon) => icon.value === value);
  return (
    <select className={INPUT} value={known ? value : 'check'} onChange={(e) => onChange(e.target.value)}>
      {SETTING_ICONS.map((icon) => (
        <option key={icon.value} value={icon.value}>
          {icon.label}
        </option>
      ))}
    </select>
  );
}

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
          <Field label="Family voice recording" help="An https link to about 30 seconds from someone on the team. It plays on For your family and next to the price. Leave empty until that recording exists.">
            <input className={INPUT} placeholder="https://" value={general.familyVoiceUrl} onChange={(e) => setGeneral({ ...general, familyVoiceUrl: e.target.value })} />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Office address"><textarea className={INPUT} rows={2} value={general.officeAddress} onChange={(e) => setGeneral({ ...general, officeAddress: e.target.value })} /></Field>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(['instagram', 'facebook', 'linkedin', 'youtube', 'tiktok'] as const).map((network) => (
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
        <p className="m-0 mt-1 text-[13px] text-ink-2">
          Shared on every public page. Link columns should point at CMS pages or live routes. Edit page bodies under CMS.
        </p>
        <div className="mt-3 flex flex-col gap-3">
          <Field label="Blurb under the logo">
            <textarea className={INPUT} rows={3} value={footer.blurb} onChange={(e) => setFooter({ ...footer, blurb: e.target.value })} />
          </Field>
          <Field label="Disclaimer under the blurb" help="Visa and outcomes wording. Leave blank to hide.">
            <textarea className={INPUT} rows={2} value={footer.disclaimer} onChange={(e) => setFooter({ ...footer, disclaimer: e.target.value })} />
          </Field>
          <MediaField
            label="Optional background photograph"
            accept="image"
            value={footer.backgroundImage}
            onChange={(backgroundImage) => setFooter({ ...footer, backgroundImage })}
          />
          <Field label="Background description" help="Unused when the photograph is empty (solid navy footer).">
            <input className={INPUT} value={footer.backgroundImageAlt} onChange={(e) => setFooter({ ...footer, backgroundImageAlt: e.target.value })} />
          </Field>
          <Field label="Copyright line" help="Use {{year}} and {{brand}}.">
            <input className={INPUT} value={footer.copyright} onChange={(e) => setFooter({ ...footer, copyright: e.target.value })} />
          </Field>
        </div>

        <FooterLinkEditor
          title="Explore column"
          titleValue={footer.quickLinksTitle}
          onTitle={(quickLinksTitle) => setFooter({ ...footer, quickLinksTitle })}
          links={footer.quickLinks}
          onLinks={(quickLinks) => setFooter({ ...footer, quickLinks })}
        />
        <FooterLinkEditor
          title="Company column"
          titleValue={footer.companyTitle}
          onTitle={(companyTitle) => setFooter({ ...footer, companyTitle })}
          links={footer.companyLinks}
          onLinks={(companyLinks) => setFooter({ ...footer, companyLinks })}
        />
        <FooterLinkEditor
          title="Legal row"
          titleValue="Legal links"
          onTitle={() => undefined}
          hideTitle
          links={footer.legalLinks}
          onLinks={(legalLinks) => setFooter({ ...footer, legalLinks })}
        />

        <h3 className="m-0 mt-6 text-[15px] font-semibold">Trust badges</h3>
        <p className="m-0 mt-1 text-[12px] text-ink-2">Optional. The HTML-44 footer ships with none.</p>
        <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
          {footer.trustBadges.map((badge, index) => (
            <li key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                className={INPUT}
                placeholder="Label"
                value={badge.label}
                onChange={(e) =>
                  setFooter({
                    ...footer,
                    trustBadges: footer.trustBadges.map((item, i) => (i === index ? { ...item, label: e.target.value } : item)),
                  })
                }
              />
              <IconSelect
                value={badge.icon}
                onChange={(icon) =>
                  setFooter({
                    ...footer,
                    trustBadges: footer.trustBadges.map((item, i) => (i === index ? { ...item, icon } : item)),
                  })
                }
              />
              <button
                type="button"
                className="cursor-pointer rounded-[8px] border border-line bg-surface px-2 text-[12px] text-accent-deep"
                onClick={() => setFooter({ ...footer, trustBadges: footer.trustBadges.filter((_, i) => i !== index) })}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-2 cursor-pointer rounded-full border border-dashed border-line-strong bg-transparent px-3 py-1.5 text-[13px]"
          onClick={() => setFooter({ ...footer, trustBadges: [...footer.trustBadges, { label: '', icon: 'shield' }] })}
        >
          + Add badge
        </button>

        <h3 className="m-0 mt-6 text-[15px] font-semibold">Stay informed</h3>
        <div className="mt-2 grid gap-3">
          <Field label="Subscribe heading">
            <input className={INPUT} value={footer.subscribeTitle} onChange={(e) => setFooter({ ...footer, subscribeTitle: e.target.value })} />
          </Field>
          <Field label="Subscribe note">
            <textarea className={INPUT} rows={2} value={footer.subscribeNote} onChange={(e) => setFooter({ ...footer, subscribeNote: e.target.value })} />
          </Field>
          <Field label="Email placeholder">
            <input className={INPUT} value={footer.subscribePlaceholder} onChange={(e) => setFooter({ ...footer, subscribePlaceholder: e.target.value })} />
          </Field>
          <Field label="Follow us heading">
            <input className={INPUT} value={footer.followTitle} onChange={(e) => setFooter({ ...footer, followTitle: e.target.value })} />
          </Field>
        </div>
        <SaveBar onSave={() => f.save(footer)} state={f.state} busy={f.busy} />
      </Section>
    </div>
  );
}

function FooterLinkEditor({
  title,
  titleValue,
  onTitle,
  links,
  onLinks,
  hideTitle = false,
}: {
  title: string;
  titleValue: string;
  onTitle: (value: string) => void;
  links: { label: string; href: string }[];
  onLinks: (value: { label: string; href: string }[]) => void;
  hideTitle?: boolean;
}) {
  return (
    <div className="mt-6">
      <h3 className="m-0 text-[15px] font-semibold">{title}</h3>
      {!hideTitle ? (
        <div className="mt-2">
          <Field label="Column heading">
            <input className={INPUT} value={titleValue} onChange={(e) => onTitle(e.target.value)} />
          </Field>
        </div>
      ) : null}
      <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
        {links.map((item, index) => (
          <li key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              className={INPUT}
              placeholder="Label"
              value={item.label}
              onChange={(e) => onLinks(links.map((link, i) => (i === index ? { ...link, label: e.target.value } : link)))}
            />
            <input
              className={INPUT}
              placeholder="Page link (Jobs, About…)"
              value={item.href}
              onChange={(e) => onLinks(links.map((link, i) => (i === index ? { ...link, href: e.target.value } : link)))}
            />
            <button type="button" className="cursor-pointer rounded-[8px] border border-line bg-surface px-2 text-[12px] text-accent-deep" onClick={() => onLinks(links.filter((_, i) => i !== index))}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="mt-2 cursor-pointer rounded-full border border-dashed border-line-strong bg-transparent px-3 py-1.5 text-[13px]" onClick={() => onLinks([...links, { label: '', href: '/' }])}>
        + Add link
      </button>
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
            <input className={INPUT} placeholder="Page link (Jobs, About…)" value={item.href} onChange={(e) => setNav(index, { href: e.target.value })} />
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

      <Section title="Pricing page" lead="Every sentence on /pricing. Amounts still come from Company & pricing. In a question, {skills}, {visa}, {bundle} and {separate} are replaced with those amounts.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Page title"><input className={INPUT} value={conversion.pricingTitle} onChange={(e) => setConversion({ ...conversion, pricingTitle: e.target.value })} /></Field>
          <Field label="Questions heading"><input className={INPUT} value={conversion.pricingQuestions} onChange={(e) => setConversion({ ...conversion, pricingQuestions: e.target.value })} /></Field>
          <Field label="Start button"><input className={INPUT} value={conversion.pricingStartCta} onChange={(e) => setConversion({ ...conversion, pricingStartCta: e.target.value })} /></Field>
          <Field label="Reports heading"><input className={INPUT} value={conversion.reportsHeading} onChange={(e) => setConversion({ ...conversion, reportsHeading: e.target.value })} /></Field>
        </div>
        <Field label="Lead"><textarea className={INPUT} rows={3} value={conversion.pricingLead} onChange={(e) => setConversion({ ...conversion, pricingLead: e.target.value })} /></Field>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Candidate label"><input className={INPUT} value={conversion.candidateEyebrow} onChange={(e) => setConversion({ ...conversion, candidateEyebrow: e.target.value })} /></Field>
          <Field label="Candidate price note"><input className={INPUT} value={conversion.candidatePeriod} onChange={(e) => setConversion({ ...conversion, candidatePeriod: e.target.value })} /></Field>
        </div>
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
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Employer label"><input className={INPUT} value={conversion.employerEyebrow} onChange={(e) => setConversion({ ...conversion, employerEyebrow: e.target.value })} /></Field>
          <Field label="Employer price note"><input className={INPUT} value={conversion.employerPeriod} onChange={(e) => setConversion({ ...conversion, employerPeriod: e.target.value })} /></Field>
        </div>
        <Field label="Employer card note"><input className={INPUT} value={conversion.employerNote} onChange={(e) => setConversion({ ...conversion, employerNote: e.target.value })} /></Field>
        <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
          {conversion.employerFeatures.map((feature, index) => (
            <li key={index}>
              <Field label={`Employer feature ${index + 1}`}>
                <input className={INPUT} value={feature} onChange={(e) => setConversion({ ...conversion, employerFeatures: conversion.employerFeatures.map((item, i) => (i === index ? e.target.value : item)) })} />
              </Field>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Partner label"><input className={INPUT} value={conversion.partnerEyebrow} onChange={(e) => setConversion({ ...conversion, partnerEyebrow: e.target.value })} /></Field>
          <Field label="Partner price"><input className={INPUT} value={conversion.partnerPrice} onChange={(e) => setConversion({ ...conversion, partnerPrice: e.target.value })} /></Field>
          <Field label="Book a call"><input className={INPUT} value={conversion.bookCall} onChange={(e) => setConversion({ ...conversion, bookCall: e.target.value })} /></Field>
          <Field label="Contact sales"><input className={INPUT} value={conversion.contactSales} onChange={(e) => setConversion({ ...conversion, contactSales: e.target.value })} /></Field>
        </div>
        <Field label="Partner card note"><input className={INPUT} value={conversion.partnerNote} onChange={(e) => setConversion({ ...conversion, partnerNote: e.target.value })} /></Field>
        <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
          {conversion.partnerFeatures.map((feature, index) => (
            <li key={index}>
              <Field label={`Partner feature ${index + 1}`}>
                <input className={INPUT} value={feature} onChange={(e) => setConversion({ ...conversion, partnerFeatures: conversion.partnerFeatures.map((item, i) => (i === index ? e.target.value : item)) })} />
              </Field>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-3">
          <Field label="Stories eyebrow"><input className={INPUT} value={conversion.storiesEyebrow} onChange={(e) => setConversion({ ...conversion, storiesEyebrow: e.target.value })} /></Field>
          <Field label="Stories title"><input className={INPUT} value={conversion.storiesTitle} onChange={(e) => setConversion({ ...conversion, storiesTitle: e.target.value })} /></Field>
          <Field label="Stories introduction"><textarea className={INPUT} rows={2} value={conversion.storiesIntro} onChange={(e) => setConversion({ ...conversion, storiesIntro: e.target.value })} /></Field>
        </div>
        <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
          {conversion.pricingFaq.map((item, index) => (
            <li key={index} className="grid gap-2 rounded-[12px] bg-paper p-3">
              <Field label={`Question ${index + 1}`}><input className={INPUT} value={item.question} onChange={(e) => setConversion({ ...conversion, pricingFaq: conversion.pricingFaq.map((row, i) => (i === index ? { ...row, question: e.target.value } : row)) })} /></Field>
              <Field label="Answer"><textarea className={INPUT} rows={3} value={item.answer} onChange={(e) => setConversion({ ...conversion, pricingFaq: conversion.pricingFaq.map((row, i) => (i === index ? { ...row, answer: e.target.value } : row)) })} /></Field>
            </li>
          ))}
        </ul>
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

/** Settings › the /employers page. {{fee}} in the contact note is the placement fee. */
export function EmployerLandingForm({ initial }: { initial: SiteSettings['employerLanding'] }) {
  const [page, setPage] = useState(initial);
  const saver = useSettingsSaver('employerLanding');
  const set = <K extends keyof SiteSettings['employerLanding']>(key: K, value: SiteSettings['employerLanding'][K]) =>
    setPage({ ...page, [key]: value });

  return (
    <div className="flex flex-col gap-5">
      <Section title="Header navigation" lead="Navy bar on /employers. Match the mockup order; /employers is underlined when active.">
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {page.headerLinks.map((link, index) => (
            <li key={index} className="grid gap-2 rounded-[12px] bg-paper p-3 sm:grid-cols-2">
              <Field label="Label">
                <input
                  className={INPUT}
                  value={link.label}
                  onChange={(e) =>
                    set(
                      'headerLinks',
                      page.headerLinks.map((row, i) => (i === index ? { ...row, label: e.target.value } : row)),
                    )
                  }
                />
              </Field>
              <Field label="Link">
                <input
                  className={INPUT}
                  value={link.href}
                  onChange={(e) =>
                    set(
                      'headerLinks',
                      page.headerLinks.map((row, i) => (i === index ? { ...row, href: e.target.value } : row)),
                    )
                  }
                />
              </Field>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Hero" lead="Full-bleed hero and pitch on /employers. Shell figures below are edited in the stats strip.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Eyebrow"><input className={INPUT} value={page.eyebrow} onChange={(e) => set('eyebrow', e.target.value)} /></Field>
          <Field label="Accent word (gold italic)"><input className={INPUT} value={page.accentWord} onChange={(e) => set('accentWord', e.target.value)} /></Field>
        </div>
        <Field label="Headline"><textarea className={INPUT} rows={2} value={page.headline} onChange={(e) => set('headline', e.target.value)} /></Field>
        <Field label="Introduction"><textarea className={INPUT} rows={3} value={page.intro} onChange={(e) => set('intro', e.target.value)} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Header CTA"><input className={INPUT} value={page.headerCtaLabel} onChange={(e) => set('headerCtaLabel', e.target.value)} /></Field>
          <Field label="Primary CTA"><input className={INPUT} value={page.ctaLabel} onChange={(e) => set('ctaLabel', e.target.value)} /></Field>
          <Field label="Primary CTA link"><input className={INPUT} value={page.ctaHref} onChange={(e) => set('ctaHref', e.target.value)} /></Field>
          <Field label="Secondary CTA"><input className={INPUT} value={page.secondaryCtaLabel} onChange={(e) => set('secondaryCtaLabel', e.target.value)} /></Field>
          <Field label="Secondary CTA link"><input className={INPUT} value={page.secondaryCtaHref} onChange={(e) => set('secondaryCtaHref', e.target.value)} /></Field>
          <Field label="Badge title"><input className={INPUT} value={page.badgeLabel} onChange={(e) => set('badgeLabel', e.target.value)} /></Field>
          <Field label="Badge subtext"><input className={INPUT} value={page.badgeSubtext} onChange={(e) => set('badgeSubtext', e.target.value)} /></Field>
          <Field label="Badge link"><input className={INPUT} value={page.badgeHref} onChange={(e) => set('badgeHref', e.target.value)} /></Field>
        </div>
        <p className="m-0 mt-2 text-[13px] font-medium text-ink-2">Slideshow photographs</p>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {page.slides.map((slide, index) => (
            <li key={index} className="grid gap-3 rounded-[12px] bg-paper p-3 sm:grid-cols-2">
              <MediaField
                label={`Photograph ${index + 1}`}
                accept="image"
                value={slide.src}
                onChange={(src) =>
                  set(
                    'slides',
                    page.slides.map((row, i) => (i === index ? { ...row, src } : row)),
                  )
                }
              />
              <Field label="Description">
                <input
                  className={INPUT}
                  value={slide.alt}
                  onChange={(e) =>
                    set(
                      'slides',
                      page.slides.map((row, i) => (i === index ? { ...row, alt: e.target.value } : row)),
                    )
                  }
                />
              </Field>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <button
            type="button"
            className="text-[13px] text-accent"
            disabled={page.slides.length >= 8}
            onClick={() => set('slides', [...page.slides, { src: '', alt: '' }])}
          >
            Add slide
          </button>
          {page.slides.length > 1 ? (
            <button type="button" className="text-[13px] text-muted" onClick={() => set('slides', page.slides.slice(0, -1))}>
              Remove last
            </button>
          ) : null}
        </div>
      </Section>

      <Section title="Stats strip" lead="Shell figures shown on the cream ribbon under the hero. Edit carefully — these are marketing claims.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Candidates value"><input className={INPUT} value={page.statsCandidatesValue} onChange={(e) => set('statsCandidatesValue', e.target.value)} /></Field>
          <Field label="Candidates label"><input className={INPUT} value={page.statsCandidates} onChange={(e) => set('statsCandidates', e.target.value)} /></Field>
          <Field label="Industries value"><input className={INPUT} value={page.statsIndustriesValue} onChange={(e) => set('statsIndustriesValue', e.target.value)} /></Field>
          <Field label="Industries label"><input className={INPUT} value={page.statsIndustries} onChange={(e) => set('statsIndustries', e.target.value)} /></Field>
          <Field label="Success value"><input className={INPUT} value={page.statsPlacedValue} onChange={(e) => set('statsPlacedValue', e.target.value)} /></Field>
          <Field label="Success label"><input className={INPUT} value={page.statsPlaced} onChange={(e) => set('statsPlaced', e.target.value)} /></Field>
          <Field label="Hiring time value"><input className={INPUT} value={page.hiringTimeValue} onChange={(e) => set('hiringTimeValue', e.target.value)} /></Field>
          <Field label="Hiring time label"><input className={INPUT} value={page.hiringTimeLabel} onChange={(e) => set('hiringTimeLabel', e.target.value)} /></Field>
        </div>
      </Section>

      <Section title="Why partner" lead="Four reason cards under the stats strip.">
        <Field label="Section title"><input className={INPUT} value={page.reasonsTitle} onChange={(e) => set('reasonsTitle', e.target.value)} /></Field>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {page.reasons.map((reason, index) => (
            <li key={index} className="grid gap-2 rounded-[12px] bg-paper p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Icon">
                  <input
                    className={INPUT}
                    value={reason.icon}
                    onChange={(e) =>
                      set(
                        'reasons',
                        page.reasons.map((row, i) => (i === index ? { ...row, icon: e.target.value } : row)),
                      )
                    }
                  />
                </Field>
                <Field label="Title">
                  <input
                    className={INPUT}
                    value={reason.title}
                    onChange={(e) =>
                      set(
                        'reasons',
                        page.reasons.map((row, i) => (i === index ? { ...row, title: e.target.value } : row)),
                      )
                    }
                  />
                </Field>
              </div>
              <Field label="Body">
                <textarea
                  className={INPUT}
                  rows={2}
                  value={reason.body}
                  onChange={(e) =>
                    set(
                      'reasons',
                      page.reasons.map((row, i) => (i === index ? { ...row, body: e.target.value } : row)),
                    )
                  }
                />
              </Field>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Industries band" lead="Navy band with the tram photograph and industry chips.">
        <Field label="Title"><input className={INPUT} value={page.industriesTitle} onChange={(e) => set('industriesTitle', e.target.value)} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <MediaField
            label="Photograph"
            accept="image"
            value={page.industriesImage}
            onChange={(industriesImage) => set('industriesImage', industriesImage)}
          />
          <Field label="Image alt"><input className={INPUT} value={page.industriesImageAlt} onChange={(e) => set('industriesImageAlt', e.target.value)} /></Field>
        </div>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {page.industries.map((industry, index) => (
            <li key={index} className="grid gap-2 rounded-[12px] bg-paper p-3 sm:grid-cols-2">
              <Field label="Icon">
                <input
                  className={INPUT}
                  value={industry.icon}
                  onChange={(e) =>
                    set(
                      'industries',
                      page.industries.map((row, i) => (i === index ? { ...row, icon: e.target.value } : row)),
                    )
                  }
                />
              </Field>
              <Field label="Label">
                <input
                  className={INPUT}
                  value={industry.label}
                  onChange={(e) =>
                    set(
                      'industries',
                      page.industries.map((row, i) => (i === index ? { ...row, label: e.target.value } : row)),
                    )
                  }
                />
              </Field>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Closing and contact" lead="Closing band CTAs reuse the hero buttons. Contact form note still accepts {{fee}}.">
        <Field label="Closing title"><input className={INPUT} value={page.closingTitle} onChange={(e) => set('closingTitle', e.target.value)} /></Field>
        <Field label="Closing body"><textarea className={INPUT} rows={2} value={page.closingBody} onChange={(e) => set('closingBody', e.target.value)} /></Field>
        <Field label="Contact heading"><input className={INPUT} value={page.contactTitle} onChange={(e) => set('contactTitle', e.target.value)} /></Field>
        <Field label="Contact note"><input className={INPUT} value={page.contactNote} onChange={(e) => set('contactNote', e.target.value)} /></Field>
      </Section>

      <SaveBar onSave={() => saver.save(page)} state={saver.state} busy={saver.busy} />
    </div>
  );
}

/** Settings › /employers/register mockup copy and form labels. */
export function EmployerRegistrationForm({ initial }: { initial: SiteSettings['employerRegistration'] }) {
  const [page, setPage] = useState(initial);
  const saver = useSettingsSaver('employerRegistration');
  const set = <K extends keyof SiteSettings['employerRegistration']>(key: K, value: SiteSettings['employerRegistration'][K]) =>
    setPage({ ...page, [key]: value });
  const lines = (value: string) =>
    value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

  return (
    <div className="flex flex-col gap-5">
      <Section title="Hero" lead="Slideshow photographs and the three highlight chips.">
        <Field label="Eyebrow"><input className={INPUT} value={page.eyebrow} onChange={(e) => set('eyebrow', e.target.value)} /></Field>
        <Field label="Headline"><input className={INPUT} value={page.headline} onChange={(e) => set('headline', e.target.value)} /></Field>
        <Field label="Introduction"><textarea className={INPUT} rows={3} value={page.intro} onChange={(e) => set('intro', e.target.value)} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Header CTA"><input className={INPUT} value={page.headerCtaLabel} onChange={(e) => set('headerCtaLabel', e.target.value)} /></Field>
          <Field label="Header CTA link"><input className={INPUT} value={page.headerCtaHref} onChange={(e) => set('headerCtaHref', e.target.value)} /></Field>
        </div>
        <p className="m-0 text-[13px] font-medium text-ink-2">Slideshow photographs</p>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {page.slides.map((slide, index) => (
            <li key={index} className="grid gap-3 rounded-[12px] bg-paper p-3 sm:grid-cols-2">
              <MediaField
                label={`Photograph ${index + 1}`}
                accept="image"
                value={slide.src}
                onChange={(src) =>
                  set(
                    'slides',
                    page.slides.map((row, i) => (i === index ? { ...row, src } : row)),
                  )
                }
              />
              <Field label="Description">
                <input
                  className={INPUT}
                  value={slide.alt}
                  onChange={(e) =>
                    set(
                      'slides',
                      page.slides.map((row, i) => (i === index ? { ...row, alt: e.target.value } : row)),
                    )
                  }
                />
              </Field>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <button
            type="button"
            className="text-[13px] text-accent"
            disabled={page.slides.length >= 8}
            onClick={() => set('slides', [...page.slides, { src: '', alt: '' }])}
          >
            Add photograph
          </button>
          {page.slides.length > 1 ? (
            <button type="button" className="text-[13px] text-muted" onClick={() => set('slides', page.slides.slice(0, -1))}>
              Remove last
            </button>
          ) : null}
        </div>

        <p className="m-0 mt-4 text-[13px] font-medium text-ink-2">Highlight chips</p>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {page.highlights.map((item, index) => (
            <li key={index} className="grid gap-2 rounded-[12px] bg-paper p-3 sm:grid-cols-[160px_1fr_auto]">
              <Field label="Icon">
                <IconSelect
                  value={item.icon}
                  onChange={(icon) =>
                    set(
                      'highlights',
                      page.highlights.map((row, i) => (i === index ? { ...row, icon } : row)),
                    )
                  }
                />
              </Field>
              <Field label="Label">
                <input
                  className={INPUT}
                  value={item.label}
                  onChange={(e) =>
                    set(
                      'highlights',
                      page.highlights.map((row, i) => (i === index ? { ...row, label: e.target.value } : row)),
                    )
                  }
                />
              </Field>
              <button
                type="button"
                className="self-end rounded-[8px] border border-line bg-surface px-2 py-2 text-[12px] text-accent-deep"
                onClick={() => set('highlights', page.highlights.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-2 cursor-pointer rounded-full border border-dashed border-line-strong bg-transparent px-3 py-1.5 text-[13px]"
          disabled={page.highlights.length >= 6}
          onClick={() => set('highlights', [...page.highlights, { icon: 'check', label: '' }])}
        >
          + Add highlight
        </button>
      </Section>

      <Section title="How it works" lead="Numbered steps beside the form.">
        <Field label="Title"><input className={INPUT} value={page.howTitle} onChange={(e) => set('howTitle', e.target.value)} /></Field>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {page.howSteps.map((step, index) => (
            <li key={index} className="grid gap-2 rounded-[12px] bg-paper p-3">
              <div className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                <Field label="Icon">
                  <IconSelect
                    value={step.icon}
                    onChange={(icon) =>
                      set(
                        'howSteps',
                        page.howSteps.map((row, i) => (i === index ? { ...row, icon } : row)),
                      )
                    }
                  />
                </Field>
                <Field label="Title">
                  <input
                    className={INPUT}
                    value={step.title}
                    onChange={(e) =>
                      set(
                        'howSteps',
                        page.howSteps.map((row, i) => (i === index ? { ...row, title: e.target.value } : row)),
                      )
                    }
                  />
                </Field>
                <button
                  type="button"
                  className="self-end rounded-[8px] border border-line bg-surface px-2 py-2 text-[12px] text-accent-deep"
                  onClick={() => set('howSteps', page.howSteps.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              </div>
              <Field label="Description">
                <textarea
                  className={INPUT}
                  rows={2}
                  value={step.body}
                  onChange={(e) =>
                    set(
                      'howSteps',
                      page.howSteps.map((row, i) => (i === index ? { ...row, body: e.target.value } : row)),
                    )
                  }
                />
              </Field>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-2 cursor-pointer rounded-full border border-dashed border-line-strong bg-transparent px-3 py-1.5 text-[13px]"
          disabled={page.howSteps.length >= 8}
          onClick={() => set('howSteps', [...page.howSteps, { icon: 'check', title: '', body: '' }])}
        >
          + Add step
        </button>
      </Section>

      <Section title="Quote card" lead="Quote under How it works. Empty quote hides the card.">
        <Field label="Quote"><textarea className={INPUT} rows={2} value={page.quote} onChange={(e) => set('quote', e.target.value)} /></Field>
        <Field label="Attribution"><input className={INPUT} value={page.quoteAttribution} onChange={(e) => set('quoteAttribution', e.target.value)} /></Field>
        <MediaField
          label="Photograph"
          accept="image"
          value={page.quoteImage}
          onChange={(quoteImage) => set('quoteImage', quoteImage)}
        />
        <Field label="Photograph description">
          <input className={INPUT} value={page.quoteImageAlt} onChange={(e) => set('quoteImageAlt', e.target.value)} />
        </Field>
      </Section>

      <Section title="Form copy" lead="Labels and CTAs on the multi-step enquiry card.">
        <Field label="Form title"><input className={INPUT} value={page.formTitle} onChange={(e) => set('formTitle', e.target.value)} /></Field>
        <Field label="Form intro"><textarea className={INPUT} rows={2} value={page.formIntro} onChange={(e) => set('formIntro', e.target.value)} /></Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Step 1"><input className={INPUT} value={page.step1Label} onChange={(e) => set('step1Label', e.target.value)} /></Field>
          <Field label="Step 2"><input className={INPUT} value={page.step2Label} onChange={(e) => set('step2Label', e.target.value)} /></Field>
          <Field label="Step 3"><input className={INPUT} value={page.step3Label} onChange={(e) => set('step3Label', e.target.value)} /></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Continue to hiring"><input className={INPUT} value={page.continueToHiring} onChange={(e) => set('continueToHiring', e.target.value)} /></Field>
          <Field label="Continue to review"><input className={INPUT} value={page.continueToReview} onChange={(e) => set('continueToReview', e.target.value)} /></Field>
          <Field label="Submit"><input className={INPUT} value={page.submitLabel} onChange={(e) => set('submitLabel', e.target.value)} /></Field>
          <Field label="Book consultation"><input className={INPUT} value={page.bookConsultationLabel} onChange={(e) => set('bookConsultationLabel', e.target.value)} /></Field>
          <Field label="Book consultation link"><input className={INPUT} value={page.bookConsultationHref} onChange={(e) => set('bookConsultationHref', e.target.value)} /></Field>
          <Field label="Privacy note"><input className={INPUT} value={page.privacyNote} onChange={(e) => set('privacyNote', e.target.value)} /></Field>
        </div>
        <Field label="Success title"><input className={INPUT} value={page.successTitle} onChange={(e) => set('successTitle', e.target.value)} /></Field>
        <Field label="Success body"><textarea className={INPUT} rows={2} value={page.successBody} onChange={(e) => set('successBody', e.target.value)} /></Field>
      </Section>

      <Section title="Dropdown options" lead="One option per line.">
        <Field label="Industries">
          <textarea className={INPUT} rows={4} value={page.industryOptions.join('\n')} onChange={(e) => set('industryOptions', lines(e.target.value))} />
        </Field>
        <Field label="Countries">
          <textarea className={INPUT} rows={3} value={page.countryOptions.join('\n')} onChange={(e) => set('countryOptions', lines(e.target.value))} />
        </Field>
        <Field label="Company sizes">
          <textarea className={INPUT} rows={3} value={page.companySizeOptions.join('\n')} onChange={(e) => set('companySizeOptions', lines(e.target.value))} />
        </Field>
        <Field label="Employment types">
          <textarea className={INPUT} rows={3} value={page.employmentOptions.join('\n')} onChange={(e) => set('employmentOptions', lines(e.target.value))} />
        </Field>
        <Field label="Timelines">
          <textarea className={INPUT} rows={3} value={page.timelineOptions.join('\n')} onChange={(e) => set('timelineOptions', lines(e.target.value))} />
        </Field>
      </Section>

      <SaveBar onSave={() => saver.save(page)} state={saver.state} busy={saver.busy} />
    </div>
  );
}

/** Settings › chrome on /jobs. {count} is filled with a live database figure. */
export function JobsBoardForm({ initial }: { initial: SiteSettings['jobsBoard'] }) {
  /* Older saved rows may predate newer shell fields; fill from defaults. */
  const [board, setBoard] = useState<SiteSettings['jobsBoard']>(() => ({
    ...initial,
    salaryMinLabel: initial.salaryMinLabel || 'Min',
    salaryMaxLabel: initial.salaryMaxLabel || 'Max',
    sortLabel: initial.sortLabel || 'Sort by',
  }));
  const saver = useSettingsSaver('jobsBoard');
  const set = (key: keyof SiteSettings['jobsBoard'], value: string) => setBoard({ ...board, [key]: value });

  return (
    <div className="flex flex-col gap-5">
      <Section title="Hero" lead="Full-bleed photograph and pitch on /jobs.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Eyebrow"><input className={INPUT} value={board.heroEyebrow} onChange={(e) => set('heroEyebrow', e.target.value)} /></Field>
          <Field label="Accent word"><input className={INPUT} value={board.heroAccentWord} onChange={(e) => set('heroAccentWord', e.target.value)} /></Field>
        </div>
        <Field label="Headline"><input className={INPUT} value={board.heroHeadline} onChange={(e) => set('heroHeadline', e.target.value)} /></Field>
        <Field label="Introduction"><textarea className={INPUT} rows={3} value={board.heroIntro} onChange={(e) => set('heroIntro', e.target.value)} /></Field>
        <MediaField
          label="Photograph"
          accept="image"
          value={board.heroImage}
          onChange={(heroImage) => set('heroImage', heroImage)}
        />
        <Field label="Photograph description">
          <input className={INPUT} value={board.heroImageAlt} onChange={(e) => set('heroImageAlt', e.target.value)} />
        </Field>
      </Section>
      <Section title="Search bar" lead="Placeholders and the search button on /jobs.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Keyword placeholder"><input className={INPUT} value={board.searchKeywordPlaceholder} onChange={(e) => set('searchKeywordPlaceholder', e.target.value)} /></Field>
          <Field label="Location label"><input className={INPUT} value={board.searchLocationLabel} onChange={(e) => set('searchLocationLabel', e.target.value)} /></Field>
          <Field label="Category label"><input className={INPUT} value={board.searchCategoryLabel} onChange={(e) => set('searchCategoryLabel', e.target.value)} /></Field>
          <Field label="Search button"><input className={INPUT} value={board.searchButton} onChange={(e) => set('searchButton', e.target.value)} /></Field>
        </div>
      </Section>
      <Section title="Filters and results" lead="Sidebar headings, sort labels and the results line. Write {count} where a live number should appear.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Filter title"><input className={INPUT} value={board.filterTitle} onChange={(e) => set('filterTitle', e.target.value)} /></Field>
          <Field label="Clear all"><input className={INPUT} value={board.clearAll} onChange={(e) => set('clearAll', e.target.value)} /></Field>
          <Field label="Category heading"><input className={INPUT} value={board.categoryHeading} onChange={(e) => set('categoryHeading', e.target.value)} /></Field>
          <Field label="Experience heading"><input className={INPUT} value={board.experienceHeading} onChange={(e) => set('experienceHeading', e.target.value)} /></Field>
          <Field label="Employment heading"><input className={INPUT} value={board.employmentHeading} onChange={(e) => set('employmentHeading', e.target.value)} /></Field>
          <Field label="Salary heading"><input className={INPUT} value={board.salaryHeading} onChange={(e) => set('salaryHeading', e.target.value)} /></Field>
          <Field label="Salary · min"><input className={INPUT} value={board.salaryMinLabel} onChange={(e) => set('salaryMinLabel', e.target.value)} /></Field>
          <Field label="Salary · max"><input className={INPUT} value={board.salaryMaxLabel} onChange={(e) => set('salaryMaxLabel', e.target.value)} /></Field>
          <Field label="Entry level"><input className={INPUT} value={board.experienceEntry} onChange={(e) => set('experienceEntry', e.target.value)} /></Field>
          <Field label="Mid level"><input className={INPUT} value={board.experienceMid} onChange={(e) => set('experienceMid', e.target.value)} /></Field>
          <Field label="Senior level"><input className={INPUT} value={board.experienceSenior} onChange={(e) => set('experienceSenior', e.target.value)} /></Field>
          <Field label="Results heading"><input className={INPUT} value={board.resultsHeading} onChange={(e) => set('resultsHeading', e.target.value)} /></Field>
          <Field label="Sort label"><input className={INPUT} value={board.sortLabel} onChange={(e) => set('sortLabel', e.target.value)} /></Field>
          <Field label="Sort · newest"><input className={INPUT} value={board.sortNewest} onChange={(e) => set('sortNewest', e.target.value)} /></Field>
          <Field label="Sort · salary"><input className={INPUT} value={board.sortSalary} onChange={(e) => set('sortSalary', e.target.value)} /></Field>
        </div>
      </Section>
      <Section title="Cards and hero stats" lead="Every published job shows the verified badge. Hero ribbon figures are shell copy from the mockup.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Verified badge"><input className={INPUT} value={board.verifiedBadge} onChange={(e) => set('verifiedBadge', e.target.value)} /></Field>
          <Field label="View details"><input className={INPUT} value={board.viewDetails} onChange={(e) => set('viewDetails', e.target.value)} /></Field>
          <Field label="Apply now"><input className={INPUT} value={board.applyNow} onChange={(e) => set('applyNow', e.target.value)} /></Field>
          <Field label="Vacancies value"><input className={INPUT} value={board.statsVacanciesValue} onChange={(e) => set('statsVacanciesValue', e.target.value)} /></Field>
          <Field label="Vacancies label"><input className={INPUT} value={board.statsVacancies} onChange={(e) => set('statsVacancies', e.target.value)} /></Field>
          <Field label="Employers value"><input className={INPUT} value={board.statsEmployersValue} onChange={(e) => set('statsEmployersValue', e.target.value)} /></Field>
          <Field label="Employers label"><input className={INPUT} value={board.statsEmployers} onChange={(e) => set('statsEmployers', e.target.value)} /></Field>
          <Field label="Placed value"><input className={INPUT} value={board.statsPlacedValue} onChange={(e) => set('statsPlacedValue', e.target.value)} /></Field>
          <Field label="Placed label"><input className={INPUT} value={board.statsPlaced} onChange={(e) => set('statsPlaced', e.target.value)} /></Field>
        </div>
        <Field label="Empty title"><input className={INPUT} value={board.emptyTitle} onChange={(e) => set('emptyTitle', e.target.value)} /></Field>
        <Field label="Empty body"><textarea className={INPUT} rows={2} value={board.emptyBody} onChange={(e) => set('emptyBody', e.target.value)} /></Field>
      </Section>
      <SaveBar onSave={() => saver.save(board)} state={saver.state} busy={saver.busy} />
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

      <Section title="Video" lead="YouTube or an uploaded film. Leave blank to use the Applications film.">
        <MediaField
          label="Film"
          accept="video"
          value={vsl.videoUrl}
          onChange={(videoUrl) => setVsl({ ...vsl, videoUrl })}
        />
        <MediaField
          label="Poster photograph"
          accept="image"
          value={vsl.videoPoster}
          onChange={(videoPoster) => setVsl({ ...vsl, videoPoster })}
        />
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
        <MediaField
          label="Film beside the apply form and on sign-up"
          accept="video"
          value={applications.filmUrl}
          onChange={(filmUrl) => setApplications({ ...applications, filmUrl })}
        />
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
