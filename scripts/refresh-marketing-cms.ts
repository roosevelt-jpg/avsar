/**
 * Publish code defaults for marketing CMS pages (and industries) into
 * cms_pages, plus employerLanding photo settings. Run:
 *   npx tsx scripts/refresh-marketing-cms.ts
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEFAULT_PAGES } from '../src/lib/cms/defaults';
import { sanitizeBlocks, sanitizeSeo } from '../src/lib/cms/sanitize';
import { DEFAULT_SETTINGS } from '../src/lib/cms/settings';

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i < 0) continue;
    const key = trimmed.slice(0, i);
    let value = trimmed.slice(i + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const SLUGS = new Set([
  'home',
  'jobs',
  'how-it-works',
  'why-portugal',
  'visa-and-relocation',
  'about',
  'founders-note',
  'directors-note',
  'history',
  'organization-chart',
  'contact',
  'success-stories',
  'news-and-insights',
  'industries',
  'faq',
  'cookie-policy',
]);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function main() {
  const admin = createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
  const now = new Date().toISOString();
  const pages = DEFAULT_PAGES.filter((page) => SLUGS.has(page.slug)).map((page) => {
    const blocks = sanitizeBlocks(page.blocks);
    const seo = sanitizeSeo(page.seo);
    return {
      slug: page.slug,
      locale: 'en',
      title: page.title,
      blocks,
      seo,
      published_blocks: blocks,
      published_seo: seo,
      published_at: now,
      updated_at: now,
    };
  });

  const { data, error } = await admin.from('cms_pages').upsert(pages, { onConflict: 'slug,locale' }).select('slug');
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(
    'Published CMS pages:',
    data?.map((row) => row.slug).join(' · '),
  );

  const { data: existingLanding } = await admin
    .from('site_settings')
    .select('value')
    .eq('key', 'employerLanding')
    .maybeSingle();
  const current =
    existingLanding?.value && typeof existingLanding.value === 'object'
      ? (existingLanding.value as Record<string, unknown>)
      : {};
  const landing = {
    ...current,
    slides: DEFAULT_SETTINGS.employerLanding.slides,
    industriesImage: DEFAULT_SETTINGS.employerLanding.industriesImage,
    industriesImageAlt: DEFAULT_SETTINGS.employerLanding.industriesImageAlt,
  };
  const { error: landingError } = await admin.from('site_settings').upsert(
    { key: 'employerLanding', value: landing, updated_at: now },
    { onConflict: 'key' },
  );
  if (landingError) {
    console.error(landingError);
    process.exit(1);
  }
  console.log(
    'Updated employerLanding slides:',
    DEFAULT_SETTINGS.employerLanding.slides.map((slide) => slide.src).join(' · '),
  );

  const { data: existingReg } = await admin
    .from('site_settings')
    .select('value')
    .eq('key', 'employerRegistration')
    .maybeSingle();
  const regCurrent =
    existingReg?.value && typeof existingReg.value === 'object'
      ? (existingReg.value as Record<string, unknown>)
      : {};
  const registration = {
    ...regCurrent,
    slides: DEFAULT_SETTINGS.employerRegistration.slides,
    quoteImage: DEFAULT_SETTINGS.employerRegistration.quoteImage,
    quoteImageAlt: DEFAULT_SETTINGS.employerRegistration.quoteImageAlt,
  };
  const { error: regError } = await admin.from('site_settings').upsert(
    { key: 'employerRegistration', value: registration, updated_at: now },
    { onConflict: 'key' },
  );
  if (regError) {
    console.error(regError);
    process.exit(1);
  }
  console.log('Updated employerRegistration photo fields');

  /* Corporate Info: rename About in the header and expand Company footer links. */
  const { data: existingNav } = await admin.from('site_settings').select('value').eq('key', 'navigation').maybeSingle();
  const navCurrent =
    existingNav?.value && typeof existingNav.value === 'object'
      ? (existingNav.value as Record<string, unknown>)
      : {};
  const main = Array.isArray(navCurrent.main) ? [...(navCurrent.main as Record<string, unknown>[])] : [];
  const aboutIndex = main.findIndex((item) => item.href === '/about');
  if (aboutIndex >= 0) {
    main[aboutIndex] = {
      ...main[aboutIndex],
      label: 'Corporate Info',
      labelHi: 'कंपनी जानकारी',
      labelAr: 'معلومات الشركة',
      href: '/about',
    };
  } else {
    main.push({
      label: 'Corporate Info',
      labelHi: 'कंपनी जानकारी',
      labelAr: 'معلومات الشركة',
      labels: {},
      href: '/about',
    });
  }
  const { error: navError } = await admin.from('site_settings').upsert(
    { key: 'navigation', value: { ...navCurrent, main }, updated_at: now },
    { onConflict: 'key' },
  );
  if (navError) {
    console.error(navError);
    process.exit(1);
  }
  console.log('Updated navigation: Corporate Info → /about');

  const { data: existingFooter } = await admin.from('site_settings').select('value').eq('key', 'footer').maybeSingle();
  const footerCurrent =
    existingFooter?.value && typeof existingFooter.value === 'object'
      ? (existingFooter.value as Record<string, unknown>)
      : {};
  const companyLinks = DEFAULT_SETTINGS.footer.companyLinks;
  const { error: footerError } = await admin.from('site_settings').upsert(
    {
      key: 'footer',
      value: { ...footerCurrent, companyLinks },
      updated_at: now,
    },
    { onConflict: 'key' },
  );
  if (footerError) {
    console.error(footerError);
    process.exit(1);
  }
  console.log(
    'Updated footer companyLinks:',
    companyLinks.map((link) => link.href).join(' · '),
  );
}

void main();
