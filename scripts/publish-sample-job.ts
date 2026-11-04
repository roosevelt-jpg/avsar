/**
 * Publish the Lisbon restaurant server sample so the public job-detail
 * mockup layout can be verified end-to-end.
 *
 *   npx tsx --env-file=.env.local scripts/publish-sample-job.ts
 *
 * Only touches the known seed slug. Does not invent openings or pay —
 * updates stay within the existing draft's honest ranges.
 */

import { createClient } from '@supabase/supabase-js';

const SLUG = 'restaurant-server-lisbon';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const now = new Date().toISOString();
  /* Close date matches the mockup's November deadline so the facts rail is live. */
  const closesAt = new Date('2026-11-30T23:59:59.000Z').toISOString();

  const { data, error } = await admin
    .from('job_postings')
    .update({
      title: 'Restaurant Service Staff',
      employer_display: 'Hospitality group · Lisbon',
      openings: 10,
      salary_min_eur: 900,
      salary_max_eur: 1200,
      summary:
        'Join a busy Lisbon hospitality group as front-of-house service staff. English on the floor, written contract, housing help and meals with the role.',
      description:
        'Serve guests across a small group of restaurants in Lisbon. Most guests are international, so English is the working language on the floor. You work as part of a trained team, take orders, explain the menu including allergens, and handle payments on the POS.',
      responsibilities: [
        'Welcome guests and take food and drink orders accurately',
        'Explain the menu, including allergens and daily specials',
        'Serve courses and clear tables to house standards',
        'Handle payments on the POS and close your section cleanly',
        'Work with the kitchen so tickets leave on time',
      ],
      requirements: [
        'At least one year in restaurant or hotel service',
        'Conversational English (B1) for guest-facing work',
        'Calm and friendly under pressure during busy services',
        'Willing to relocate to Lisbon under a work visa after a successful offer',
      ],
      benefits: [
        'Shared tips on top of base pay',
        'Staff meal every shift',
        'Help with housing search after selection',
        'Written Portuguese employment contract',
        'Visa file support after a successful offer',
      ],
      status: 'published',
      featured: true,
      published_at: now,
      closes_at: closesAt,
      updated_at: now,
      seo_title: 'Restaurant Service Staff · Lisbon',
      seo_description:
        'Front-of-house restaurant role in Lisbon for Indian candidates. Salary €900–€1,200/month, meals included, housing help, visa support after offer.',
    })
    .eq('slug', SLUG)
    .select('id, slug, status, title, published_at')
    .maybeSingle();

  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  if (!data) {
    console.error(`No job with slug ${SLUG}`);
    process.exit(1);
  }
  console.log('published', JSON.stringify(data));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
