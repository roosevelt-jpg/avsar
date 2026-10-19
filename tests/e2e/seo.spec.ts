import { expect, test } from '@playwright/test';

for (const path of ['/', '/jobs', '/jobs/line-cook-algarve', '/hi/faq']) {
  test(`${path} links its other languages`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(15);
  });
}

test('sitemap lists every job with its language alternates', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const xml = await response.text();
  expect(xml).toContain('/jobs/line-cook-algarve');
  expect(xml).toContain('hreflang="x-default"');
  expect(xml).toContain('/ta/jobs/line-cook-algarve');
});

test('robots stays closed until indexing is switched on', async ({ request }) => {
  const body = await (await request.get('/robots.txt')).text();
  expect(body).toMatch(/Disallow: \/\s*$/m);
});
