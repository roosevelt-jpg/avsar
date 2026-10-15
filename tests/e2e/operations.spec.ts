import { expect, test } from '@playwright/test';

/* Demo mode: every page renders sample data, and writes answer 503 demo_mode. */

test('inbox lists sample messages and opens one', async ({ page }) => {
  await page.goto('/admin/inbox');
  await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible();
  const first = page.locator('main table tbody tr a').first();
  await expect(first).toBeVisible();
  await first.click();
  await expect(page).toHaveURL(/\/admin\/inbox\/.+/);
});

test('privacy page and notification bell render', async ({ page }) => {
  await page.goto('/admin/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
  await page.goto('/admin/notifications');
  await expect(page.locator('main')).toBeVisible();
});

test('contact form refuses to save in demo mode', async ({ request }) => {
  const response = await request.post('/api/contact', {
    data: { topic: 'other', fullName: 'Test Person', email: 'test@example.com', message: 'Hello, this is a test message.' },
  });
  expect([400, 403, 503]).toContain(response.status());
});

test('relocation: candidate page, console queue and application panel', async ({ page }) => {
  await page.goto('/dashboard/relocation');
  await expect(page.getByRole('heading', { name: 'Visa file' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your steps' })).toBeVisible();

  await page.goto('/admin/relocation');
  await expect(page.getByRole('heading', { name: /Documents to check/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Stories to read/ })).toBeVisible();

  await page.goto('/admin/applications/sample-0');
  await expect(page.getByText('Fit for this job')).toBeVisible();
});

test('family link: unknown token says only that it does not work', async ({ page }) => {
  await page.goto('/family/not-a-real-token-at-all-000');
  await expect(page.getByRole('heading', { name: 'This link does not work' })).toBeVisible();
  await page.goto('/family/sample-family-link-0000');
  await expect(page.getByText(/move to Portugal/)).toBeVisible();
});

test('employer side: applicants with fit, bench, fees and unlocks render', async ({ page }) => {
  await page.goto('/admin/applicants');
  await expect(page.getByRole('heading', { name: 'Applicants' })).toBeVisible();
  await expect(page.getByText('Visa file ready')).toBeVisible();
  await page.goto('/admin/bench');
  await expect(page.getByRole('heading', { name: 'Ready to travel' })).toBeVisible();
  await page.goto('/admin/fees');
  await expect(page.getByRole('heading', { name: 'Employer fees' })).toBeVisible();
  await page.goto('/admin/unlocks');
  await expect(page.getByRole('heading', { name: 'Profile requests' })).toBeVisible();
});

test('relocation writes refuse in demo mode', async ({ request }) => {
  const response = await request.post('/api/relocation/family-links', { data: { label: 'Parents', consent: true } });
  expect(response.status()).toBe(503);
});
