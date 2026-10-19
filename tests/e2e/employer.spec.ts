import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 1000 } });

test('employer can request a vacancy and follow its status', async ({ page }) => {
  await page.goto('/admin/vacancies');
  const main = page.locator('main');
  await expect(main.getByRole('heading', { name: 'Vacancies', exact: true })).toBeVisible();
  await expect(main.getByText('Request a vacancy')).toBeVisible();
  await expect(main.getByText('Housekeeping attendant')).toBeVisible();
  await expect(main.getByText('With our team')).toBeVisible();

  await main.getByLabel('Role').fill('Pastry chef');
  await main.getByLabel('City', { exact: true }).fill('Lagos');
  await main.getByRole('button', { name: 'Send request' }).click();
  await expect(main.getByRole('status')).toContainText('preview');
});

test('vacancy requests are refused without a database', async ({ request }) => {
  const response = await request.post('/api/employer/vacancies', { data: { title: 'Pastry chef' } });
  expect(response.status()).toBe(503);
});

test('employer sees shortlisted applicants without contact details', async ({ page }) => {
  await page.goto('/admin/applicants');
  const main = page.locator('main');
  await expect(main.getByText('Arjun Nair')).toBeVisible();
  await expect(main.getByText(/Lisbon time/).first()).toBeVisible();
  await expect(main.getByText('Shortlisted', { exact: true })).toBeVisible();
  /* No email addresses or phone numbers anywhere in the table. */
  const text = (await main.textContent()) ?? '';
  expect(text).not.toMatch(/@[a-z0-9-]+\./i);
  expect(text).not.toMatch(/\+91/);
});

test('staff can filter jobs to employer requests', async ({ page }) => {
  await page.goto('/admin/jobs?status=requests');
  await expect(page.locator('main').getByText('employer request').first()).toBeVisible();
});
