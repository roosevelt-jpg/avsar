import { defineConfig, devices } from '@playwright/test';

const PORT = 3123;

/*
 * The e2e suite runs against demo mode only: no database, sample jobs, the
 * console open as a demo super admin. Supabase variables are set to empty
 * strings because Next never overrides a variable that already exists, so a
 * developer's .env.local cannot turn the run into a test of a real project.
 */
const DEMO_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: '',
  TURNSTILE_SECRET_KEY: '',
  UPSTASH_REDIS_REST_URL: '',
  UPSTASH_REDIS_REST_TOKEN: '',
};

export default defineConfig({
  testDir: 'tests/e2e',
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
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    env: DEMO_ENV,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
  },
});
