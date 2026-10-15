import { expect, test } from '@playwright/test';

/* Runs only without a test project: the site must say what is missing rather
   than render an empty shell, and writes must be refused. */

test('every page shows the setup notice', async ({ page }) => {
  for (const path of ['/', '/jobs', '/admin/dashboard']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: 'Setup required' }), path).toBeVisible();
    await expect(page.getByText('NEXT_PUBLIC_SUPABASE_URL'), path).toBeVisible();
  }
});

test('health endpoint reports the missing database', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(503);
  expect(await response.json()).toMatchObject({ ok: false, mode: 'not_configured' });
});

test('contact form refuses to save', async ({ request }) => {
  const response = await request.post('/api/contact', {
    data: { fullName: 'Test', email: 'test@example.com', message: 'Hello there, a question.', topic: 'other' },
  });
  expect(response.status()).toBe(503);
  expect(await response.json()).toMatchObject({ error: 'not_configured' });
});
