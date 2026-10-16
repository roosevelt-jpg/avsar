import { defineConfig, devices } from '@playwright/test';

const PORT = 3123;

/*
 * There is no demo mode, so the suite needs a Supabase test project, never
 * production: E2E_SUPABASE_URL, E2E_SUPABASE_ANON_KEY and
 * E2E_SUPABASE_SERVICE_ROLE_KEY, with the migrations applied and the sample
 * jobs from supabase/seed/jobs_sample.sql published.
 *
 * The variables are passed explicitly, and set to empty when absent, because
 * Next never overrides a variable that already exists: a developer's
 * .env.local cannot turn the run into a test of the real project. Without a
 * test project only setup.spec.ts runs, against the "Setup required" page.
 */
const TEST_PROJECT = Boolean(process.env.E2E_SUPABASE_URL && process.env.E2E_SUPABASE_ANON_KEY);

const ENV = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.E2E_SUPABASE_URL ?? '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.E2E_SUPABASE_ANON_KEY ?? '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? '',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: '',
  TURNSTILE_SECRET_KEY: '',
  UPSTASH_REDIS_REST_URL: '',
  UPSTASH_REDIS_REST_TOKEN: '',
};

/*
 * These specs were written for the old demo session (console open as a super
 * admin, sample ids) and need signed-in fixtures for staff, employer and
 * candidate accounts in the test project before they can run again.
 */
const NEEDS_SIGNED_IN_FIXTURES = ['console.spec.ts', 'employer.spec.ts', 'growth.spec.ts', 'operations.spec.ts'];

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: TEST_PROJECT ? undefined : ['setup.spec.ts'],
  testIgnore: TEST_PROJECT ? ['setup.spec.ts', ...NEEDS_SIGNED_IN_FIXTURES] : undefined,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    /* Webpack, not Turbopack: Next 16's default turbopack build intermittently
       fails on next/font/google with many Indic faces ("queries have exactly
       one entry"), which stops the e2e webServer before any test runs. */
    command: `npx next build --webpack && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    env: ENV,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
  },
});
