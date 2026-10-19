import { expect, test } from '@playwright/test';

test('tracker shows a booked interview in India and Lisbon time', async ({ page }) => {
  await page.goto('/dashboard/applications');
  await expect(page.getByText(/India time/).first()).toBeVisible();
  await expect(page.getByText(/Lisbon time/).first()).toBeVisible();
});

test('candidate dashboard shows saved jobs and the WhatsApp switch', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Saved jobs' })).toBeVisible();
  await expect(page.getByRole('switch', { name: 'WhatsApp updates' })).toBeVisible();
});

test('apply form offers a CV upload and an explicit WhatsApp opt-in', async ({ page }) => {
  await page.goto('/jobs/line-cook-algarve');
  await expect(page.getByText('Attach your CV (optional)')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /updates about my application on WhatsApp/ })).not.toBeChecked();
});

test.describe('console', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test('applications list offers bulk actions and CSV export', async ({ page, request }) => {
    await page.goto('/admin/applications');
    await expect(page.getByText('Select rows to act on them')).toBeVisible();
    await page.getByRole('checkbox', { name: 'Select all on this page' }).check();
    await expect(page.getByRole('button', { name: 'Move' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Export selected (CSV)' })).toBeVisible();

    const csv = await request.get('/api/admin/applications/export');
    expect(csv.status()).toBe(200);
    expect(csv.headers()['content-type']).toContain('text/csv');
    expect(await csv.text()).toContain('Reference,Candidate,Email');
  });

  test('bulk move is refused in demo mode', async ({ request }) => {
    const response = await request.post('/api/admin/applications/bulk', {
      data: { ids: ['00000000-0000-4000-8000-000000000001'], status: 'screening' },
    });
    expect(response.status()).toBe(503);
  });

  test('dashboard lists upcoming interviews and the application page can book one', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Upcoming interviews' })).toBeVisible();
    await page.goto('/admin/applications/sample-0');
    await expect(page.getByText('Book an interview')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Interviews' })).toBeVisible();
  });
});
