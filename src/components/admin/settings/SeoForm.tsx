'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MediaField } from '@/components/admin/MediaPicker';
import { STATIC_SEO_PAGES, type SiteSettings } from '@/lib/cms/settings';
import { Field, INPUT, SaveBar, Section, useSettingsSaver } from './ui';

/**
 * Settings › Search & sharing: site-wide WhatsApp / Google defaults, then
 * pages built in code. The home page also has the same share fields in the
 * CMS page editor (linked below).
 */
export function SeoForm({ initial }: { initial: SiteSettings['seo'] }) {
  const [seo, setSeo] = useState(initial);
  const saver = useSettingsSaver('seo');
  const page = (key: (typeof STATIC_SEO_PAGES)[number]['key'], patch: Partial<SiteSettings['seo']['pages'][typeof key]>) =>
    setSeo({ ...seo, pages: { ...seo.pages, [key]: { ...seo.pages[key], ...patch } } });

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Section
        title="WhatsApp & share card"
        lead="What appears when someone pastes your site link in WhatsApp, Facebook or LinkedIn. Also used when a page leaves its own share fields empty."
      >
        <div className="flex flex-col gap-3">
          <Field label={`Browser / search title (${seo.defaultTitle.length}/70)`} help="Tab title and Google result when a page has no search title of its own.">
            <input
              className={INPUT}
              maxLength={80}
              value={seo.defaultTitle}
              onChange={(e) => setSeo({ ...seo, defaultTitle: e.target.value })}
            />
          </Field>
          <Field label={`Browser / search description (${seo.defaultDescription.length}/160)`}>
            <textarea
              className={INPUT}
              rows={3}
              maxLength={200}
              value={seo.defaultDescription}
              onChange={(e) => setSeo({ ...seo, defaultDescription: e.target.value })}
            />
          </Field>
          <Field
            label={`Share title (${seo.defaultOgTitle.length}/90)`}
            help="Bold line on the WhatsApp preview. Empty falls back to the browser title."
          >
            <input
              className={INPUT}
              maxLength={90}
              value={seo.defaultOgTitle}
              onChange={(e) => setSeo({ ...seo, defaultOgTitle: e.target.value })}
              placeholder="Defaults to the browser title"
            />
          </Field>
          <Field
            label={`Share description (${seo.defaultOgDescription.length}/160)`}
            help="Grey text under the share title on WhatsApp."
          >
            <textarea
              className={INPUT}
              rows={3}
              maxLength={200}
              value={seo.defaultOgDescription}
              onChange={(e) => setSeo({ ...seo, defaultOgDescription: e.target.value })}
              placeholder="Defaults to the browser description"
            />
          </Field>
          <MediaField
            label="Share image (1200 × 630)"
            accept="image"
            value={seo.ogImage}
            onChange={(value) => setSeo({ ...seo, ogImage: typeof value === 'string' ? value : '' })}
          />
          <p className="m-0 text-[12px] leading-[1.45] text-muted">
            Homepage (`/`) can override these fields in{' '}
            <Link href="/admin/cms/home" className="font-medium text-[#b28a49] no-underline hover:underline">
              CMS › Pages › Home
            </Link>{' '}
            under “Search and sharing”. Save and publish there after edits. WhatsApp caches previews — after changing
            the image, re-share the link or wait for the cache to refresh.
          </p>
        </div>
        <SaveBar onSave={() => saver.save(seo)} state={saver.state} busy={saver.busy} />
      </Section>

      {STATIC_SEO_PAGES.map(({ key, label, path }) => (
        <Section key={key} title={label} lead={`${path}. Built in code — search and share text lives here.`}>
          <div className="flex flex-col gap-3">
            <Field label={`Search title (${seo.pages[key].title.length}/70)`}>
              <input
                className={INPUT}
                maxLength={80}
                value={seo.pages[key].title}
                onChange={(e) => page(key, { title: e.target.value })}
              />
            </Field>
            <Field label={`Search description (${seo.pages[key].description.length}/160)`}>
              <textarea
                className={INPUT}
                rows={2}
                maxLength={200}
                value={seo.pages[key].description}
                onChange={(e) => page(key, { description: e.target.value })}
              />
            </Field>
            <Field label="Share title" help="Empty uses the search title, then the site share title.">
              <input
                className={INPUT}
                maxLength={90}
                value={seo.pages[key].ogTitle}
                onChange={(e) => page(key, { ogTitle: e.target.value })}
              />
            </Field>
            <Field label="Share description" help="Empty uses the search description, then the site share description.">
              <textarea
                className={INPUT}
                rows={2}
                maxLength={200}
                value={seo.pages[key].ogDescription}
                onChange={(e) => page(key, { ogDescription: e.target.value })}
              />
            </Field>
            <MediaField
              label="Share image"
              accept="image"
              value={seo.pages[key].ogImage}
              onChange={(value) => page(key, { ogImage: typeof value === 'string' ? value : '' })}
            />
          </div>
          <SaveBar onSave={() => saver.save(seo)} state={saver.state} busy={saver.busy} />
        </Section>
      ))}
    </div>
  );
}
