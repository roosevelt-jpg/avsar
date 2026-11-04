import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error('missing env');
    process.exit(1);
  }
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const { error: intakeError, count: intakeCount } = await admin
    .from('employer_intake_submissions')
    .select('*', { count: 'exact', head: true });
  console.log(
    intakeError ? `FAIL 0036 intake: ${intakeError.message}` : `OK 0036 intake table (count=${intakeCount ?? 0})`,
  );

  const { data: jobs, error: jobsError } = await admin
    .from('job_postings')
    .select('id, slug, status, employer_display')
    .eq('status', 'published')
    .limit(5);
  console.log(
    jobsError
      ? `FAIL jobs: ${jobsError.message}`
      : `OK published jobs=${jobs?.length ?? 0}${jobs?.length ? ` sample=${jobs.map((j) => j.slug).join(',')}` : ' (board empty is honest)'}`,
  );

  const slugs = [
    'home',
    'jobs',
    'how-it-works',
    'why-portugal',
    'visa-and-relocation',
    'about',
    'contact',
    'success-stories',
    'news-and-insights',
    'cookie-policy',
    'faq',
  ];
  const { data: pages, error: pagesError } = await admin
    .from('cms_pages')
    .select('slug, published_at')
    .eq('locale', 'en')
    .in('slug', slugs);
  if (pagesError) console.log(`FAIL cms: ${pagesError.message}`);
  else {
    const have = new Set((pages ?? []).map((p) => p.slug));
    const missing = slugs.filter((s) => !have.has(s));
    const unpublished = (pages ?? []).filter((p) => !p.published_at).map((p) => p.slug);
    console.log(`OK cms pages present=${have.size}/${slugs.length}`);
    if (missing.length) console.log(`FAIL cms missing: ${missing.join(', ')}`);
    if (unpublished.length) console.log(`WARN cms unpublished: ${unpublished.join(', ')}`);
  }

  const { data: settings, error: settingsError } = await admin
    .from('site_settings')
    .select('key')
    .in('key', ['footer', 'navigation', 'employerLanding', 'employerRegistration', 'applications', 'jobsBoard']);
  console.log(
    settingsError
      ? `FAIL settings: ${settingsError.message}`
      : `OK settings keys=${(settings ?? []).map((r) => r.key).sort().join(',')}`,
  );

  const { data: footerRow } = await admin.from('site_settings').select('value').eq('key', 'footer').maybeSingle();
  const footer = (footerRow?.value ?? {}) as Record<string, unknown>;
  console.log(
    footer.quickLinks
      ? `OK footer settings has quickLinks (${Array.isArray(footer.quickLinks) ? footer.quickLinks.length : '?'})`
      : 'WARN footer DB row is legacy blurb-only — code defaults merge at runtime',
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
