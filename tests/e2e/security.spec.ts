import { expect, test } from '@playwright/test';

test('security headers are sent', async ({ request }) => {
  const response = await request.get('/');
  const headers = response.headers();
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['strict-transport-security']).toContain('max-age=');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['permissions-policy']).toContain('camera=()');
});

/* The CSP must not break the pages it protects: any violation shows up as a
   console error naming the directive. */
for (const path of ['/', '/jobs', '/jobs/line-cook-algarve', '/ar', '/admin/cms/home']) {
  test(`no CSP violations on ${path}`, async ({ page }) => {
    const violations: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && /Content Security Policy/i.test(message.text())) violations.push(message.text());
    });
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    expect(violations).toEqual([]);
  });
}

test('health endpoint reports the live database', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ ok: true, mode: 'live' });
});
