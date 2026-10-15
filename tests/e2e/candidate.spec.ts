import { expect, test } from '@playwright/test';

test('home renders the hero and live jobs', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page.locator('a[href^="/jobs/"]').first()).toBeVisible();
});

test('home has no horizontal scroll', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

/* The narrowest phone we design for, in every locale: translations are often
   much longer than the English, and the header is where that shows first. */
test.describe('360px wide', () => {
  test.use({ viewport: { width: 360, height: 780 } });
  const locales = ['en', 'hi', 'bn', 'mr', 'te', 'ta', 'ur', 'gu', 'kn', 'or', 'ml', 'pa', 'as', 'ar'];
  for (const locale of locales) {
    test(`no horizontal scroll on ${locale} home, jobs, a job and the FAQ`, async ({ page }) => {
      const prefix = locale === 'en' ? '' : `/${locale}`;
      for (const path of [prefix || '/', `${prefix}/jobs`, `${prefix}/jobs/line-cook-algarve`, `${prefix}/faq`]) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, path).toBeLessThanOrEqual(0);
      }
    });
  }
});

test('jobs board filters by search text through the GET form', async ({ page }) => {
  const totalOf = async () => Number(await page.locator('main p strong').first().innerText());
  await page.goto('/jobs');
  const total = await totalOf();
  expect(total).toBeGreaterThan(1);

  await page.locator('input[name="q"]').fill('welder');
  await page.locator('form[method="get"] button[type="submit"]').click();
  await expect(page).toHaveURL(/[?&]q=welder/);
  const filtered = await totalOf();
  expect(filtered).toBeGreaterThan(0);
  expect(filtered).toBeLessThan(total);
  await expect(page.getByRole('link', { name: 'Clear filters' })).toBeVisible();
});

test('job page shows the one-step apply form to a visitor', async ({ page }) => {
  await page.goto('/jobs/line-cook-algarve');
  await expect(page.locator('h1')).toContainText(/cook/i);
  await expect(page.locator('input[type="email"]').first()).toBeVisible();
  await expect(page.locator('input[type="password"]').first()).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached();
});

test('application tracker renders', async ({ page }) => {
  const response = await page.goto('/dashboard/applications');
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('h1').first()).toBeVisible();
});

test('Arabic pages are right-to-left', async ({ page }) => {
  await page.goto('/ar');
  await expect(page.locator('.avsar-root').first()).toHaveAttribute('dir', 'rtl');
});
