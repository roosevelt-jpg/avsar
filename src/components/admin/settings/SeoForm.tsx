'use client';

import { useState } from 'react';
import { MediaField } from '@/components/admin/MediaPicker';
import { STATIC_SEO_PAGES, type SiteSettings } from '@/lib/cms/settings';
import { Field, INPUT, SaveBar, Section, useSettingsSaver } from './ui';

/**
 * Settings › Search & sharing: the site defaults, and the search and share
 * text of pages built in code. Pages made of blocks have the same fields in
 * the page editor.
 */
export function SeoForm({ initial }: { initial: SiteSettings['seo'] }) {
  const [seo, setSeo] = useState(initial);
  const saver = useSettingsSaver('seo');
  const page = (key: (typeof STATIC_SEO_PAGES)[number]['key'], patch: Partial<SiteSettings['seo']['pages'][typeof key]>) =>
    setSeo({ ...seo, pages: { ...seo.pages, [key]: { ...seo.pages[key], ...patch } } });

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Section title="Site defaults" lead="Used by any page that leaves its own fields empty, and by the home of every shared link.">
        <div className="flex flex-col gap-3">
          <Field label={`Default title (${seo.defaultTitle.length}/70)`}>
            <input className={INPUT} maxLength={80} value={seo.defaultTitle} onChange={(e) => setSeo({ ...seo, defaultTitle: e.target.value })} />
          </Field>
          <Field label={`Default description (${seo.defaultDescription.length}/160)`}>
            <textarea className={INPUT} rows={3} maxLength={200} value={seo.defaultDescription} onChange={(e) => setSeo({ ...seo, defaultDescription: e.target.value })} />
          </Field>
          <MediaField label="Default share image (1200 × 630)" accept="image" value={seo.ogImage} onChange={(value) => setSeo({ ...seo, ogImage: typeof value === 'string' ? value : '' })} />
        </div>
        <SaveBar onSave={() => saver.save(seo)} state={saver.state} busy={saver.busy} />
      </Section>

      {STATIC_SEO_PAGES.map(({ key, label, path }) => (
        <Section key={key} title={label} lead={`${path}. Built in code, so its search and share text lives here.`}>
          <div className="flex flex-col gap-3">
            <Field label={`Search title (${seo.pages[key].title.length}/70)`}>
              <input className={INPUT} maxLength={80} value={seo.pages[key].title} onChange={(e) => page(key, { title: e.target.value })} />
            </Field>
            <Field label={`Search description (${seo.pages[key].description.length}/160)`}>
              <textarea className={INPUT} rows={2} maxLength={200} value={seo.pages[key].description} onChange={(e) => page(key, { description: e.target.value })} />
            </Field>
            <Field label="Share title" help="Empty uses the search title.">
              <input className={INPUT} maxLength={90} value={seo.pages[key].ogTitle} onChange={(e) => page(key, { ogTitle: e.target.value })} />
            </Field>
            <MediaField label="Share image" accept="image" value={seo.pages[key].ogImage} onChange={(value) => page(key, { ogImage: typeof value === 'string' ? value : '' })} />
          </div>
          <SaveBar onSave={() => saver.save(seo)} state={saver.state} busy={saver.busy} />
        </Section>
      ))}
    </div>
  );
}
