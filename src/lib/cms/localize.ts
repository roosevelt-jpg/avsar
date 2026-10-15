import type { Locale } from '@/lib/i18n/path';
import type { Job } from '@/lib/jobs/types';
import type { Block } from './blocks';
import type { DefaultPage } from './defaults/make';
import { contentCopy } from './copy';

/**
 * Shipped translations of the pages and job text that live in code.
 *
 * The console can still replace any of this: a published page or a saved job
 * translation wins. Until somebody publishes one, a Malayalam visitor sees the
 * Malayalam copy here rather than the English page.
 *
 * Keys are the English source, character for character, including {{tokens}}
 * and markdown. A missing key stays English, which is how a new sentence
 * ships before it has been translated.
 */

const SKIP_KEYS = new Set([
  'href',
  'src',
  'image',
  'mediaSrc',
  'mediaPoster',
  'icon',
  'id',
  'type',
  'slug',
  'path',
  'limit',
  'purpose',
  'hidden',
  'mediaType',
  'imageSide',
  'tone',
  'columns',
  'width',
  'layout',
  'style',
]);

const SKIP_VALUES = new Set(['video', 'image', 'none', 'left', 'right', 'dark', 'light', 'accent', 'info', 'warning', 'narrow', 'wide']);

export function siteText(locale: Locale, english: string): string {
  if (locale === 'en' || !english) return english;
  return contentCopy[locale]?.[english] ?? english;
}

function translatable(key: string | null, value: string): boolean {
  if (!value.trim()) return false;
  if (key && SKIP_KEYS.has(key)) return false;
  if (SKIP_VALUES.has(value)) return false;
  if (value.startsWith('/') || value.startsWith('http') || value.startsWith('mailto:')) return false;
  /* Numbers and bare tokens ("0", "{{shortlist_score}}/10") read the same in every language. */
  if (!/\p{L}/u.test(value.replace(/\{\{\w+\}\}/g, ''))) return false;
  return true;
}

function walk(value: unknown, locale: Locale, key: string | null): unknown {
  if (typeof value === 'string') return translatable(key, value) ? siteText(locale, value) : value;
  if (Array.isArray(value)) return value.map((item) => walk(item, locale, null));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [childKey, child] of Object.entries(value)) out[childKey] = walk(child, locale, childKey);
    return out;
  }
  return value;
}

/** Every string in a value that localizePage would look up, for the coverage test. */
export function translatableStrings(value: unknown, key: string | null = null, out = new Set<string>()): Set<string> {
  if (typeof value === 'string') {
    if (translatable(key, value)) out.add(value);
  } else if (Array.isArray(value)) {
    for (const item of value) translatableStrings(item, null, out);
  } else if (value && typeof value === 'object') {
    for (const [childKey, child] of Object.entries(value)) translatableStrings(child, childKey, out);
  }
  return out;
}

/** Page content for this language. English is the source and is returned as-is. */
export function localizePage(page: DefaultPage, locale: Locale): DefaultPage {
  if (locale === 'en') return page;
  return walk(page, locale, null) as DefaultPage;
}

export function localizeBlocks(blocks: Block[], locale: Locale): Block[] {
  if (locale === 'en') return blocks;
  return walk(blocks, locale, null) as Block[];
}

/**
 * Job posting copy. City names stay as stored, because they are also the
 * filter values. Everything a candidate reads is translated.
 */
export function localizeJob(job: Job, locale: Locale): Job {
  if (locale === 'en') return job;
  return {
    ...job,
    title: siteText(locale, job.title),
    employerDisplay: siteText(locale, job.employerDisplay),
    summary: siteText(locale, job.summary),
    description: siteText(locale, job.description),
    responsibilities: job.responsibilities.map((line) => siteText(locale, line)),
    requirements: job.requirements.map((line) => siteText(locale, line)),
    benefits: job.benefits.map((line) => siteText(locale, line)),
    screeningQuestions: job.screeningQuestions.map((question) => ({ ...question, label: siteText(locale, question.label) })),
    seoTitle: job.seoTitle ? siteText(locale, job.seoTitle) : job.seoTitle,
    seoDescription: job.seoDescription ? siteText(locale, job.seoDescription) : job.seoDescription,
  };
}
